// Global variable for the performance chart
let performanceChart;

function createElement(tag, attributes = {}, textContent = '') {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key.startsWith('data-')) {
      element.setAttribute(key, value);
    } else {
      element[key] = value;
    }
  }
  if (textContent) element.textContent = textContent;
  return element;
}

function clearElementContent(element) {
  element.replaceChildren();
}

function createTableRow(label, value) {
  const row = createElement('tr');
  row.append(
    createElement('td', {}, label),
    createElement('td', {}, value)
  );
  return row;
}

function createSection(title, content) {
  const section = createElement('div');
  section.append(
    createElement('h3', {}, title),
    createElement('p', {}, content)
  );
  return section;
}

function createPriceChart(history) {
  // Transform data for the chart
  const transformedData = history.map(entry => ({
    x: new Date(entry.Date),
    y: entry.Close,
    volume: entry.Volume
  })).sort((a, b) => a.x - b.x);
  
  // Create a container div with a canvas for Chart.js
  const chartContainer = createElement('div', {
    className: 'chart-container',
    style: 'position: relative; height: 400px; width: 100%; margin: 20px 0;'
  });
  const canvas = createElement('canvas', { id: 'price-chart' });
  chartContainer.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  
  // Determine tick spacing for the x-axis
  const desiredTickCount = Math.min(12, transformedData.length);
  
  new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Close Price',
          data: transformedData,
          yAxisID: 'y',
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderWidth: 2,
          pointRadius: 1,
          fill: true
        },
        {
          label: 'Volume',
          data: transformedData.map(entry => ({ x: entry.x, y: entry.volume })),
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
          time: {
            unit: 'day',
            displayFormats: { day: 'MMM dd' }
          },
          ticks: {
            maxTicksLimit: desiredTickCount,
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
        legend: { display: true, position: 'top', align: 'center', labels: { boxWidth: 20, padding: 15 } }
      }
    }
  });
  
  return chartContainer;
}

async function fetchAndDisplayStockInfo(ticker) {
  const stockInfoDiv = document.getElementById('stock-info');
  clearElementContent(stockInfoDiv);
  try {
    const response = await fetch(`/stock_info/${ticker}`);
    if (!response.ok) throw new Error('Stock not found');
    const data = await response.json();

    // Main Stock Info and Summary
    const title = createElement('h2', {}, `${data.longName} (${ticker.toUpperCase()})`);
    const summary = createSection('Business Summary', data.longBusinessSummary);

    // Fetch historical data and plot the chart
    const historyResponse = await fetch(`/stock_history/${ticker}`);
    const history = await historyResponse.json();
    const priceChart = createPriceChart(history);

    // Build Metrics Table
    const metrics = [
      { label: 'Price', value: `$${data.currentPrice.toFixed(2)}` },
      { label: 'Market Cap', value: `$${data.marketCap.toFixed(2)}` },
      { label: 'Dividend Yield', value: `${data.dividendYield?.toFixed(2) || 'N/A'}%` },
      { label: 'EPS', value: `$${data.trailingEps?.toFixed(2) || 'N/A'}` },
      { label: 'PE Ratio', value: `${data.trailingPE?.toFixed(2) || 'N/A'}` },
      { label: '52 Week High', value: `$${data.fiftyTwoWeekHigh.toFixed(2)}` },
      { label: '52 Week Low', value: `$${data.fiftyTwoWeekLow.toFixed(2)}` }
    ];
    const metricTable = createElement('table');
    const headerRow = createElement('tr');
    headerRow.append(
      createElement('th', {}, 'Indicator'),
      createElement('th', {}, 'Value')
    );
    metricTable.appendChild(headerRow);
    metrics.forEach(metric => {
      if (metric.value) metricTable.appendChild(createTableRow(metric.label, metric.value));
    });

    // Additional Metrics
    const additionalMetrics = [
      { label: 'Beta', value: data.beta?.toFixed(2) || 'N/A' },
      { label: 'Debt to Equity', value: `${data.debtToEquity?.toFixed(2) || 'N/A'}%` },
      { label: 'Return on Assets', value: `${(data.returnOnAssets * 100)?.toFixed(2) || 'N/A'}%` },
      { label: 'Return on Equity', value: `${(data.returnOnEquity * 100)?.toFixed(2) || 'N/A'}%` },
      { label: 'Revenue Growth', value: `${(data.revenueGrowth * 100)?.toFixed(2) || 'N/A'}%` },
      { label: 'Profit Margins', value: `${(data.profitMargins * 100)?.toFixed(2) || 'N/A'}%` }
    ];
    additionalMetrics.forEach(metric => {
      if (metric.value) metricTable.appendChild(createTableRow(metric.label, metric.value));
    });

    // Quick add to portfolio
    const quickAddDiv = createElement('div', { className: 'quick-add' });
    const sharesInput = createElement('input', {
      type: 'number', min: '1', value: '1', placeholder: 'Shares', className: 'shares-input'
    });
    const addButton = createElement('button', {
      className: 'add-to-portfolio',
      onclick: () => {
        const shares = parseFloat(sharesInput.value);
        if (!isNaN(shares) && shares > 0) {
          addToPortfolio(ticker, shares);
          alert(`${shares} shares of ${ticker} added to portfolio!`);
        }
      }
    }, 'Add to Portfolio');
    quickAddDiv.append(sharesInput, addButton);

    // Append all elements to the stock info div
    stockInfoDiv.append(title, priceChart, metricTable, quickAddDiv, summary,
                          createElement('a', { href: data.website, target: '_blank' }, 'Company Website'));
  } catch (error) {
    stockInfoDiv.appendChild(createElement('h2', {}, error.message));
    console.error(error);
  }
  stockInfoDiv.style.display = 'block';
}

document.getElementById('stock-form').addEventListener('submit', e => {
  e.preventDefault();
  const ticker = document.getElementById('stock-symbol').value;
  fetchAndDisplayStockInfo(ticker);
});

// Portfolio data and storage
let portfolioData = JSON.parse(localStorage.getItem('portfolio')) || {
  stocks: [],
  totalValue: 0,
  performanceHistory: []
};

function savePortfolioToStorage() {
  localStorage.setItem('portfolio', JSON.stringify(portfolioData));
}

function addToPortfolio(ticker, shares) {
  shares = parseFloat(shares);
  if (isNaN(shares) || shares <= 0) throw new Error('Please enter a valid number of shares');

  const existingStock = portfolioData.stocks.find(stock => stock.ticker === ticker);
  if (existingStock) {
    existingStock.shares += shares;
    updatePortfolioValue();
    savePortfolioToStorage();
    displayPortfolio();
  } else {
    fetch(`/stock_info/${ticker}`)
      .then(response => response.json())
      .then(data => {
        if (data.error) throw new Error('Invalid ticker symbol');
        const stockPosition = {
          ticker,
          shares,
          purchasePrice: data.currentPrice,
          currentPrice: data.currentPrice,
          companyName: data.longName
        };
        portfolioData.stocks.push(stockPosition);
        updatePortfolioValue();
        savePortfolioToStorage();
        displayPortfolio();
        setupPriceUpdates();
      })
      .catch(error => alert(error.message));
  }
}

function removeFromPortfolio(ticker) {
  portfolioData.stocks = portfolioData.stocks.filter(stock => stock.ticker !== ticker);
  updatePortfolioValue();
  savePortfolioToStorage();
  displayPortfolio();
}

function updatePortfolioValue() {
  portfolioData.totalValue = portfolioData.stocks.reduce(
    (sum, stock) => sum + stock.currentPrice * stock.shares,
    0
  );
  // Add new performance data point with a unique timestamp
  portfolioData.performanceHistory.push({
    timestamp: Date.now(),
    value: portfolioData.totalValue
  });
  savePortfolioToStorage();
  updatePerformanceChart();
}

function createPortfolioSection() {
  const portfolioSection = createElement('div', { id: 'portfolio-section', className: 'portfolio-section' });
  const header = createElement('h2', {}, 'Portfolio Summary');
  const totalValueElem = createElement('h3', { id: 'portfolio-total-value' }, `Total Value: $${portfolioData.totalValue.toFixed(2)}`);

  // Build add-stock form
  const addStockForm = createElement('form', { id: 'add-stock-form', className: 'add-stock-form' });
  const tickerInput = createElement('input', { type: 'text', placeholder: 'Stock Symbol', required: true, id: 'portfolio-ticker' });
  const sharesInput = createElement('input', { type: 'number', placeholder: 'Number of Shares', required: true, min: '1', id: 'portfolio-shares' });
  const submitButton = createElement('button', { type: 'submit' }, 'Add to Portfolio');
  addStockForm.append(tickerInput, sharesInput, submitButton);
  addStockForm.addEventListener('submit', handleAddStock);

  const holdingsTable = createHoldingsTable();
  // Create the performance chart container and assign the global performanceChart variable
  const performanceChartContainer = createPerformanceChart();

  portfolioSection.append(header, totalValueElem, addStockForm, holdingsTable, performanceChartContainer);
  return portfolioSection;
}

function createHoldingsTable() {
  const table = createElement('table', { id: 'holdings-table', className: 'holdings-table' });
  const header = createElement('tr');
  ['Symbol', 'Company', 'Shares', 'Current Price', 'Value', 'Gain/Loss', 'Action']
    .forEach(text => header.appendChild(createElement('th', {}, text)));
  table.appendChild(header);
  return table;
}

function displayPortfolio() {
  // Update total value text
  const totalValueElem = document.getElementById('portfolio-total-value');
  if (totalValueElem) {
    totalValueElem.textContent = `Total Value: $${portfolioData.totalValue.toFixed(2)}`;
  }
  
  const table = document.getElementById('holdings-table');
  clearElementContent(table);
  
  // Recreate table header
  const header = createElement('tr');
  ['Symbol', 'Company', 'Shares', 'Current Price', 'Value', 'Gain/Loss', 'Action']
    .forEach(text => header.appendChild(createElement('th', {}, text)));
  table.appendChild(header);
  
  // Create a row for each stock
  portfolioData.stocks.forEach(stock => {
    const row = createElement('tr');
    const gainLoss = (stock.currentPrice - stock.purchasePrice) * stock.shares;
    const gainLossPercent = ((stock.currentPrice - stock.purchasePrice) / stock.purchasePrice * 100).toFixed(2);
    
    const symbolCell = createElement('td');
    const symbolLink = createElement('a', {
      href: '#',
      onclick: e => {
        e.preventDefault();
        fetchAndDisplayStockInfo(stock.ticker);
        document.getElementById('stock-symbol').value = stock.ticker;
      }
    }, stock.ticker);
    symbolCell.appendChild(symbolLink);
    
    row.append(
      symbolCell,
      createElement('td', {}, stock.companyName),
      createElement('td', {}, stock.shares),
      createElement('td', {}, `$${stock.currentPrice.toFixed(2)}`),
      createElement('td', {}, `$${(stock.currentPrice * stock.shares).toFixed(2)}`),
      createElement('td', { className: gainLoss >= 0 ? 'positive-gain' : 'negative-gain' },
        `$${gainLoss.toFixed(2)} (${gainLossPercent}%)`
      ),
      createElement('td', {}, '')
    );
    
    const removeButton = createElement('button', {
      className: 'remove-button',
      onclick: () => removeFromPortfolio(stock.ticker)
    }, 'Remove');
    row.lastChild.appendChild(removeButton);
    table.appendChild(row);
  });
  
  updatePerformanceChart();
}

function createPerformanceChart() {
  // Create a container and a canvas for the performance chart.
  const container = createElement('div', { className: 'chart-container' });
  const canvas = createElement('canvas', { id: 'performance-chart' });
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  
  // Initialize the global performanceChart variable.
  performanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Portfolio Value',
        data: [], // Data will be set later
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

function updatePerformanceChart() {
  if (!performanceChart) return;
  const chartData = portfolioData.performanceHistory.map(point => ({
    x: new Date(point.timestamp),
    y: point.value
  }));
  performanceChart.data.datasets[0].data = chartData;
  performanceChart.update();
}

// Periodic price update every 5 minutes
function setupPriceUpdates() {
  setInterval(() => {
    portfolioData.stocks.forEach(stock => {
      fetch(`/stock_info/${stock.ticker}`)
        .then(response => response.json())
        .then(data => {
          if (!data.error) {
            stock.currentPrice = data.currentPrice;
            updatePortfolioValue();
            displayPortfolio();
          }
        });
    });
  }, 300000);
}

function handleAddStock(event) {
  event.preventDefault();
  const ticker = document.getElementById('portfolio-ticker').value.toUpperCase();
  const shares = document.getElementById('portfolio-shares').value;
  addToPortfolio(ticker, shares);
  event.target.reset();
}

// Initialize the portfolio section on DOM load.
document.addEventListener('DOMContentLoaded', () => {
  const stockInfoDiv = document.getElementById('stock-info');
  const portfolioSection = createPortfolioSection();
  document.body.insertBefore(portfolioSection, stockInfoDiv);
  displayPortfolio();
});

document.getElementById('toggle-portfolio').addEventListener('click', function() {
  const portfolioSection = document.querySelector('.portfolio-section');
  // Toggle display (default to block if empty)
  portfolioSection.style.display = (portfolioSection.style.display === 'none' || !portfolioSection.style.display) ? 'block' : 'none';
  this.textContent = portfolioSection.style.display === 'none' ? 'Show Portfolio' : 'Hide Portfolio';
});
