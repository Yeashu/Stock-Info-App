/******************************************
 * GLOBAL VARIABLES & INITIAL SETUP
 ******************************************/
var performanceChart; // Global Chart instance for portfolio performance
var portfolioData = JSON.parse(localStorage.getItem('portfolio')) || {
  stocks: [],
  totalValue: 0,
  performanceHistory: []
};

/******************************************
 * UTILITY FUNCTIONS
 ******************************************/

/**
 * Creates an HTML element with optional attributes and text content.
 * @param {string} tag - The tag name.
 * @param {object} attrs - Object containing attributes (e.g., { id: 'myId', className: 'myClass' }).
 * @param {string} text - Optional text content.
 * @return {HTMLElement} The created element.
 */
function createEl(tag, attrs, text) {
  attrs = attrs || {};
  var el = document.createElement(tag);
  for (var key in attrs) {
    if (attrs.hasOwnProperty(key)) {
      if (key.indexOf('data-') === 0) {
        el.setAttribute(key, attrs[key]);
      } else {
        el[key] = attrs[key];
      }
    }
  }
  if (text) {
    el.textContent = text;
  }
  return el;
}

/**
 * Clears all child elements of a given element.
 * @param {HTMLElement} el - The element to clear.
 */
function clearEl(el) {
  el.replaceChildren();
}

/**
 * Creates a table row with two cells.
 * @param {string} label - The text for the first cell.
 * @param {string} value - The text for the second cell.
 * @return {HTMLElement} The table row element.
 */
function createTableRow(label, value) {
  var tr = createEl('tr');
  tr.appendChild(createEl('td', {}, label));
  tr.appendChild(createEl('td', {}, value));
  return tr;
}

/**
 * Creates a section with a header and paragraph.
 * @param {string} title - The header text.
 * @param {string} content - The paragraph content.
 * @return {HTMLElement} The section element.
 */
function createSection(title, content) {
  var sec = createEl('div');
  sec.appendChild(createEl('h3', {}, title));
  sec.appendChild(createEl('p', {}, content));
  return sec;
}

/**
 * Displays a temporary modal with a message.
 * @param {string} message - The message to display.
 * @param {string} type - The type of message (e.g., 'error' or 'success').
 */
function showModal(message, type) {
  type = type || 'error';
  var modal = createEl('div', { className: 'modal modal-' + type });
  var content = createEl('div', { className: 'modal-content' }, message);
  var closeBtn = createEl('span', { className: 'modal-close' }, '×');
  closeBtn.onclick = function () {
    modal.remove();
  };
  modal.appendChild(closeBtn);
  modal.appendChild(content);
  document.body.appendChild(modal);
  // Remove the modal after 5 seconds
  setTimeout(function () {
    modal.remove();
  }, 5000);
}

/******************************************
 * CHART FUNCTIONS
 ******************************************/

/**
 * Creates and returns a container with a price/volume chart.
 * Uses historical data to build a Chart.js chart.
 * @param {Array} history - Array of historical stock data.
 * @return {HTMLElement} The container element with the chart.
 */
function createPriceChart(history) {
  // Transform and sort historical data
  var data = history.map(function (entry) {
    return {
      x: new Date(entry.Date),
      y: entry.Close,
      volume: entry.Volume
    };
  });
  data.sort(function (a, b) {
    return a.x - b.x;
  });
  
  // Create container and canvas
  var container = createEl('div', {
    className: 'chart-container',
    style: 'position: relative; height: 400px; width: 100%; margin: 20px 0;'
  });
  var canvas = createEl('canvas', { id: 'price-chart' });
  container.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  
  // Determine tick count
  var desiredTicks = Math.min(12, data.length);
  
  new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Close Price',
          data: data,
          yAxisID: 'y',
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderWidth: 2,
          pointRadius: 1,
          fill: true
        },
        {
          label: 'Volume',
          data: data.map(function (entry) {
            return { x: entry.x, y: entry.volume };
          }),
          yAxisID: 'y1',
          type: 'bar',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      scales: {
        x: {
          type: 'time',
          time: { unit: 'day', displayFormats: { day: 'MMM dd' } },
          ticks: {
            maxTicksLimit: desiredTicks,
            autoSkip: true,
            maxRotation: 45
          }
        },
        y: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Price ($)' },
          ticks: { maxTicksLimit: 8 }
        },
        y1: {
          type: 'linear',
          position: 'right',
          title: { display: true, text: 'Volume' },
          ticks: { maxTicksLimit: 8 },
          grid: { drawOnChartArea: false }
        }
      },
      plugins: {
        tooltip: { mode: 'index', intersect: false },
        legend: {
          display: true,
          position: 'top',
          align: 'center',
          labels: { boxWidth: 20, padding: 15 }
        }
      }
    }
  });
  
  return container;
}

/**
 * Creates and returns a container with the performance chart.
 * Also initializes the global performanceChart variable.
 * @return {HTMLElement} The container element with the chart.
 */
function createPerformanceChart() {
  var container = createEl('div', { className: 'chart-container' });
  var canvas = createEl('canvas', { id: 'performance-chart' });
  container.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  
  performanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Portfolio Value',
        data: [], // This will be updated dynamically
        borderColor: 'rgba(0, 153, 204, 1)',
        backgroundColor: 'rgba(0, 153, 204, 0.2)',
        fill: true,
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'minute',
            tooltipFormat: 'MMM dd, yyyy HH:mm:ss'
          },
          title: { display: true, text: 'Time' }
        },
        y: {
          title: { display: true, text: 'Portfolio Value ($)' },
          beginAtZero: true
        }
      }
    }
  });
  
  return container;
}

/**
 * Updates the performance chart using the performance history data.
 */
function updatePerformanceChart() {
  if (!performanceChart) return;
  var chartData = portfolioData.performanceHistory.map(function (point) {
    return {
      x: new Date(point.timestamp),
      y: point.value
    };
  });
  performanceChart.data.datasets[0].data = chartData;
  performanceChart.update();
}

/******************************************
 * STOCK INFO FUNCTIONS
 ******************************************/

/**
 * Fetches stock information and historical data and displays it.
 * @param {string} ticker - The stock ticker symbol.
 */
function fetchAndDisplayStockInfo(ticker) {
  var stockInfoDiv = document.getElementById('stock-info');
  clearEl(stockInfoDiv);
  
  // Use try/catch with promises to handle errors
  fetch('/stock_info/' + ticker)
    .then(function (response) {
      if (!response.ok) {
        throw new Error('Stock not found');
      }
      return response.json();
    })
    .then(function (data) {
      // Create header and business summary
      var title = createEl('h2', {}, data.longName + ' (' + ticker.toUpperCase() + ')');
      var summary = createSection('Business Summary', data.longBusinessSummary);
      
      // Fetch historical data for the price chart
      fetch('/stock_history/' + ticker)
        .then(function (response) {
          return response.json();
        })
        .then(function (history) {
          var priceChart = createPriceChart(history);
          // Build metrics table
          var metrics = [
            { label: 'Price', value: '$' + data.currentPrice.toFixed(2) },
            { label: 'Market Cap', value: '$' + data.marketCap.toFixed(2) },
            { label: 'Dividend Yield', value: data.dividendYield ? data.dividendYield.toFixed(2) + '%' : 'N/A' },
            { label: 'EPS', value: '$' + (data.trailingEps ? data.trailingEps.toFixed(2) : 'N/A') },
            { label: 'PE Ratio', value: data.trailingPE ? data.trailingPE.toFixed(2) : 'N/A' },
            { label: '52 Week High', value: '$' + data.fiftyTwoWeekHigh.toFixed(2) },
            { label: '52 Week Low', value: '$' + data.fiftyTwoWeekLow.toFixed(2) }
          ];
          var metricTable = createEl('table');
          var headerRow = createEl('tr');
          headerRow.appendChild(createEl('th', {}, 'Indicator'));
          headerRow.appendChild(createEl('th', {}, 'Value'));
          metricTable.appendChild(headerRow);
          metrics.forEach(function (metric) {
            if (metric.value) {
              metricTable.appendChild(createTableRow(metric.label, metric.value));
            }
          });
          
          // Quick add to portfolio section
          var quickAdd = createEl('div', { className: 'quick-add' });
          var sharesInput = createEl('input', {
            type: 'number',
            min: '1',
            value: '1',
            placeholder: 'Shares',
            className: 'shares-input'
          });
          var addBtn = createEl('button', {
            className: 'add-to-portfolio',
            onclick: function () {
              var shares = parseFloat(sharesInput.value);
              if (shares > 0) {
                addToPortfolio(ticker, shares);
                showModal(shares + ' shares of ' + ticker + ' added to portfolio!', 'success');
              }
            }
          }, 'Add to Portfolio');
          quickAdd.appendChild(sharesInput);
          quickAdd.appendChild(addBtn);
          
          // Append all elements to the stock info div
          stockInfoDiv.appendChild(title);
          stockInfoDiv.appendChild(priceChart);
          stockInfoDiv.appendChild(metricTable);
          stockInfoDiv.appendChild(quickAdd);
          stockInfoDiv.appendChild(summary);
          // Company website link
          var websiteLink = createEl('a', { href: data.website, target: '_blank' }, 'Company Website');
          stockInfoDiv.appendChild(websiteLink);
        });
    })
    .catch(function (error) {
      showModal(error.message);
      stockInfoDiv.appendChild(createEl('h2', {}, error.message));
      console.error(error);
    });
  
  stockInfoDiv.style.display = 'block';
}

/******************************************
 * PORTFOLIO MANAGEMENT FUNCTIONS
 ******************************************/

/**
 * Saves the portfolio data to local storage.
 */
function savePortfolio() {
  localStorage.setItem('portfolio', JSON.stringify(portfolioData));
}

/**
 * Adds a stock to the portfolio.
 * @param {string} ticker - The stock ticker.
 * @param {number} shares - The number of shares to add.
 */
function addToPortfolio(ticker, shares) {
  shares = parseFloat(shares);
  if (isNaN(shares) || shares <= 0) {
    return showModal('Please enter a valid number of shares');
  }
  
  var existing = portfolioData.stocks.find(function (s) {
    return s.ticker === ticker;
  });
  
  if (existing) {
    existing.shares += shares;
    updatePortfolio();
    savePortfolio();
    displayPortfolio();
  } else {
    fetch('/stock_info/' + ticker)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.error) {
          throw new Error('Invalid ticker symbol');
        }
        portfolioData.stocks.push({
          ticker: ticker,
          shares: shares,
          purchasePrice: data.currentPrice,
          currentPrice: data.currentPrice,
          companyName: data.longName
        });
        updatePortfolio();
        savePortfolio();
        displayPortfolio();
        setupPriceUpdates();
      })
      .catch(function (err) {
        showModal(err.message);
      });
  }
}

/**
 * Removes a stock from the portfolio.
 * @param {string} ticker - The ticker symbol to remove.
 */
function removeFromPortfolio(ticker) {
  portfolioData.stocks = portfolioData.stocks.filter(function (s) {
    return s.ticker !== ticker;
  });
  updatePortfolio();
  savePortfolio();
  displayPortfolio();
}

/**
 * Removes a specific number of shares from a stock in the portfolio.
 * If the number to remove is greater than or equal to the current shares,
 * the entire stock is removed.
 * @param {string} ticker - The stock ticker.
 * @param {number} sharesToRemove - The number of shares to remove.
 */
function removeSharesFromPortfolio(ticker, sharesToRemove) {
  var stock = portfolioData.stocks.find(function(s) {
    return s.ticker === ticker;
  });
  if (!stock) {
    showModal("Stock not found in portfolio.", "error");
    return;
  }
  if (sharesToRemove >= stock.shares) {
    // If removing equal or more shares than available, remove the entire position.
    removeFromPortfolio(ticker);
  } else {
    stock.shares -= sharesToRemove;
    updatePortfolio();
    savePortfolio();
    displayPortfolio();
  }
}


/**
 * Updates the portfolio's total value and performance history.
 */
function updatePortfolio() {
  portfolioData.totalValue = portfolioData.stocks.reduce(function (sum, s) {
    return sum + s.currentPrice * s.shares;
  }, 0);
  // Record a new performance data point with a unique timestamp
  portfolioData.performanceHistory.push({
    timestamp: Date.now(),
    value: portfolioData.totalValue
  });
  savePortfolio();
  updatePerformanceChart();
}

/**
 * Creates and returns a holdings table element.
 * @return {HTMLElement} The table element.
 */
function createHoldingsTable() {
  var table = createEl('table', { id: 'holdings-table', className: 'holdings-table' });
  var header = createEl('tr');
  ['Symbol', 'Company', 'Shares', 'Current Price', 'Value', 'Gain/Loss', 'Action']
    .forEach(function (text) {
      header.appendChild(createEl('th', {}, text));
    });
  table.appendChild(header);
  return table;
}

/**
 * Displays the portfolio by updating the total value, rebuilding the holdings table,
 * and updating the performance chart.
 */
function displayPortfolio() {
  var totalEl = document.getElementById('portfolio-total-value');
  if (totalEl) {
    totalEl.textContent = 'Total Value: $' + portfolioData.totalValue.toFixed(2);
  }
  
  var table = document.getElementById('holdings-table');
  clearEl(table);
  
  // Rebuild table header
  var header = createEl('tr');
  ['Symbol', 'Company', 'Shares', 'Current Price', 'Value', 'Gain/Loss', 'Action']
    .forEach(function (text) {
      header.appendChild(createEl('th', {}, text));
    });
  table.appendChild(header);
  
  // Build a row for each stock in the portfolio
portfolioData.stocks.forEach(function (stock) {
  var row = createEl('tr');
  var gainLoss = (stock.currentPrice - stock.purchasePrice) * stock.shares;
  var gainLossPct = ((stock.currentPrice - stock.purchasePrice) / stock.purchasePrice * 100).toFixed(2);
  
  var symbolCell = createEl('td');
  var symbolLink = createEl('a', {
    href: '#',
    onclick: function (e) {
      e.preventDefault();
      fetchAndDisplayStockInfo(stock.ticker);
      document.getElementById('stock-symbol').value = stock.ticker;
    }
  }, stock.ticker);
  symbolCell.appendChild(symbolLink);
  
  row.appendChild(symbolCell);
  row.appendChild(createEl('td', {}, stock.companyName));
  row.appendChild(createEl('td', {}, stock.shares));
  row.appendChild(createEl('td', {}, '$' + stock.currentPrice.toFixed(2)));
  row.appendChild(createEl('td', {}, '$' + (stock.currentPrice * stock.shares).toFixed(2)));
  row.appendChild(createEl('td', { 
    className: (gainLoss >= 0) ? 'positive-gain' : 'negative-gain'
  }, '$' + gainLoss.toFixed(2) + ' (' + gainLossPct + '%)'));
  
  // ACTION CELL: Allows removal of a specific number of shares or the entire position.
  var actionCell = createEl('td');
  
  // Input field for the number of shares to remove
  var removeInput = createEl('input', { 
    type: 'number', 
    min: '1', 
    value: '1',
    style: 'width: 60px; margin-right: 5px;'
  });
  actionCell.appendChild(removeInput);
  
  // Button to remove a specific number of shares
  var removeSharesBtn = createEl('button', {
    className: 'remove-button',
    onclick: function () {
      var sharesToRemove = parseFloat(removeInput.value);
      if (isNaN(sharesToRemove) || sharesToRemove <= 0) {
        alert("Please enter a valid number of shares to remove.");
        return;
      }
      removeSharesFromPortfolio(stock.ticker, sharesToRemove);
    }
  }, 'Remove Shares');
  actionCell.appendChild(removeSharesBtn);
  
  // Optional: A button to remove the entire stock position
  var removeAllBtn = createEl('button', {
    className: 'remove-button',
    style: 'margin-left: 5px;',
    onclick: function () {
      if (confirm("Remove all shares of " + stock.ticker + "?")) {
        removeFromPortfolio(stock.ticker);
      }
    }
  }, 'Remove All');
  actionCell.appendChild(removeAllBtn);
  
  row.appendChild(actionCell);
  table.appendChild(row);
});
  
  updatePerformanceChart();
}

/**
 * Creates and returns the complete portfolio section element.
 * @return {HTMLElement} The portfolio section element.
 */
function createPortfolioSection() {
  var section = createEl('div', { id: 'portfolio-section', className: 'portfolio-section' });
  var header = createEl('h2', {}, 'Portfolio Summary');
  var totalEl = createEl('h3', { id: 'portfolio-total-value' }, 'Total Value: $' + portfolioData.totalValue.toFixed(2));
  
  // Build the add-stock form
  var addForm = createEl('form', { id: 'add-stock-form', className: 'add-stock-form' });
  var tickerInput = createEl('input', {
    type: 'text',
    placeholder: 'Stock Symbol',
    required: true,
    id: 'portfolio-ticker'
  });
  var sharesInput = createEl('input', {
    type: 'number',
    placeholder: 'Number of Shares',
    required: true,
    min: '1',
    id: 'portfolio-shares'
  });
  var submitBtn = createEl('button', { type: 'submit' }, 'Add to Portfolio');
  addForm.appendChild(tickerInput);
  addForm.appendChild(sharesInput);
  addForm.appendChild(submitBtn);
  addForm.addEventListener('submit', function (e) {
    e.preventDefault();
    addToPortfolio(
      document.getElementById('portfolio-ticker').value.toUpperCase(),
      document.getElementById('portfolio-shares').value
    );
    e.target.reset();
  });
  
  var holdingsTable = createHoldingsTable();
  var perfChartContainer = createPerformanceChart();
  
  section.appendChild(header);
  section.appendChild(totalEl);
  section.appendChild(addForm);
  section.appendChild(holdingsTable);
  section.appendChild(perfChartContainer);
  return section;
}

/******************************************
 * EVENT HANDLERS & INITIALIZATION
 ******************************************/

/**
 * Sets up periodic price updates (every 5 minutes).
 */
function setupPriceUpdates() {
  setInterval(function () {
    portfolioData.stocks.forEach(function (stock) {
      fetch('/stock_info/' + stock.ticker)
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data.error) {
            stock.currentPrice = data.currentPrice;
            updatePortfolio();
            displayPortfolio();
          }
        });
    });
  }, 300000); // 300,000 ms = 5 minutes
}

// Event handler for stock search form submission
document.getElementById('stock-form').addEventListener('submit', function (e) {
  e.preventDefault();
  var ticker = document.getElementById('stock-symbol').value;
  fetchAndDisplayStockInfo(ticker);
});

// Event handler for toggling the portfolio section visibility
document.getElementById('toggle-portfolio').addEventListener('click', function () {
  var section = document.querySelector('.portfolio-section');
  if (!section.style.display || section.style.display === 'none') {
    section.style.display = 'block';
    this.textContent = 'Hide Portfolio';
  } else {
    section.style.display = 'none';
    this.textContent = 'Show Portfolio';
  }
});

// Initialize portfolio section on DOM load
document.addEventListener('DOMContentLoaded', function () {
  var stockInfoDiv = document.getElementById('stock-info');
  var portfolioSection = createPortfolioSection();
  document.body.insertBefore(portfolioSection, stockInfoDiv);
  displayPortfolio();
});
