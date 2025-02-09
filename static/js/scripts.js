function createElement(tag, attributes = {}, textContent = '') {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes)) {
        if (key.startsWith('data-')) {
            element.setAttribute(key, value); // Handle data attributes
        } else {
            element[key] = value;
        }
    }
    if (textContent) element.textContent = textContent;
    return element;
}
function clearElementContent(element) {
    element.replaceChildren(); // Removes all child elements in a single operation
}
function createTableRow(label, value) {
    const row = createElement('tr');
    const labelCell = createElement('td', {}, label);
    const valueCell = createElement('td', {}, value);
    row.append(labelCell, valueCell);
    return row;
}

function createSection(title, content) {
    const section = createElement('div', {});
    const header = createElement('h3', {}, title);
    const paragraph = createElement('p', {}, content);
    section.append(header, paragraph);
    return section;
}

function createPriceChart(history) {
    // Transform data - using the same data transformation logic
    const transformedData = history.map(entry => ({
        x: new Date(entry.Date),
        y: entry.Close,
        volume: entry.Volume,
    }));
    
    transformedData.sort((a, b) => a.x - b.x);
    
    // Create a container div to control chart dimensions
    const chartContainer = createElement('div', {
        className: 'chart-container',
        style: 'position: relative; height: 400px; width: 100%; margin: 20px 0;'
    });
    
    // Create canvas with more reasonable dimensions
    const canvas = createElement('canvas', { 
        id: 'price-chart'
        // Remove explicit width/height - let Chart.js handle responsiveness
    });
    
    chartContainer.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    
    // Calculate reasonable tick counts based on data length
    const desiredTickCount = Math.min(12, transformedData.length);
    const tickSpacing = Math.ceil(transformedData.length / desiredTickCount);
    
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
                    pointRadius: 1, // Reduced point size for better performance
                    fill: true,
                },
                {
                    label: 'Volume',
                    data: transformedData.map(entry => ({ x: entry.x, y: entry.volume })),
                    yAxisID: 'y1',
                    type: 'bar',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true, // Changed to true for better scaling
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'MMM dd'
                        }
                    },
                    ticks: {
                        maxTicksLimit: desiredTickCount, // Limit number of ticks
                        autoSkip: true,
                        maxRotation: 45 // Angle labels for better readability
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Price ($)'
                    },
                    ticks: {
                        maxTicksLimit: 8 // Limit Y-axis ticks
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Volume'
                    },
                    ticks: {
                        maxTicksLimit: 8
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    display: true,
                    position: 'top',
                    align: 'center',
                    labels: {
                        boxWidth: 20,
                        padding: 15
                    }
                }
            }
        }
    });
    
    return chartContainer; // Return the container instead of just the canvas
}


// // Format historical data as a table
// function createHistoryTable(history) {
//     const table = createElement('table', {});

//     // Add table header
//     const headerRow = createElement('tr');
//     headerRow.append(
//         createElement('th', {}, 'Date'),
//         createElement('th', {}, 'Open'),
//         createElement('th', {}, 'High'),
//         createElement('th', {}, 'Low'),
//         createElement('th', {}, 'Close'),
//         createElement('th', {}, 'Volume')
//     );
//     table.appendChild(headerRow);

//     // Add rows for historical data
//     history.forEach(entry => {
//         const row = createElement('tr');
//         row.append(
//             createElement('td', {}, new Date(entry.Date).toLocaleDateString()),
//             createElement('td', {}, `$${entry.Open.toFixed(2)}`),
//             createElement('td', {}, `$${entry.High.toFixed(2)}`),
//             createElement('td', {}, `$${entry.Low.toFixed(2)}`),
//             createElement('td', {}, `$${entry.Close.toFixed(2)}`),
//             createElement('td', {}, entry.Volume.toLocaleString())
//         );
//         table.appendChild(row);
//     });

//     return table;
// }

async function fetchAndDisplayStockInfo(ticker) {
    const stockInfoDiv = document.getElementById('stock-info');
    clearElementContent(stockInfoDiv); // Clear previous content dynamically

    try {
        const response = await fetch(`/stock_info/${ticker}`);
        if (response.ok) {
            const data = await response.json();

            // Main Stock Info
            const title = createElement('h2', {}, `${data.longName} (${ticker.toUpperCase()})`);
            const summary = createSection('Business Summary', data.longBusinessSummary);

            // Getting Historical Data for last 6months
            const historicalData = await fetch(`/stock_history/${ticker}`);
            const history = await historicalData.json();
            // const testData = createHistoryTable(history);

            // Plotting the historical data
            const priceChart = createPriceChart(history);

            // Stock Metrics
            const metrics = [
                { label: 'Price', value: `$${data.currentPrice.toFixed(2)}` },
                { label: 'Market Cap', value: `$${data.marketCap.toFixed(2)}` },
                { label: 'Dividend Yield', value: `${data.dividendYield?.toFixed(2) || 'N/A'}%` },
                { label: 'EPS', value: `$${data.trailingEps?.toFixed(2) || 'N/A'}` },
                { label: 'PE Ratio', value: `${data.trailingPE?.toFixed(2) || 'N/A'}` },
                { label: '52 Week High', value: `$${data.fiftyTwoWeekHigh.toFixed(2)}` },
                { label: '52 Week Low', value: `$${data.fiftyTwoWeekLow.toFixed(2)}` }
            ];

            const metricTable = createElement('table', {});
            const headerRow = createElement('tr');
            headerRow.append(
                createElement('th', {}, 'Indicator'),
                createElement('th', {}, 'Value')
            );
            metricTable.appendChild(headerRow);

            metrics.forEach(metric => {
                if (metric.value) {
                    metricTable.appendChild(createTableRow(metric.label, metric.value));
                }
            });

            // Additional Financial Indicators
            const additionalMetrics = [
                { label: 'Beta', value: data.beta?.toFixed(2) || 'N/A' },
                { label: 'Debt to Equity', value: `${data.debtToEquity?.toFixed(2) || 'N/A'}%` },
                { label: 'Return on Assets', value: `${(data.returnOnAssets * 100)?.toFixed(2) || 'N/A'}%` },
                { label: 'Return on Equity', value: `${(data.returnOnEquity * 100)?.toFixed(2) || 'N/A'}%` },
                { label: 'Revenue Growth', value: `${(data.revenueGrowth * 100)?.toFixed(2) || 'N/A'}%` },
                { label: 'Profit Margins', value: `${(data.profitMargins * 100)?.toFixed(2) || 'N/A'}%` }
            ];

            additionalMetrics.forEach(metric => {
                if (metric.value) {
                    metricTable.appendChild(createTableRow(metric.label, metric.value));
                }
            });

            // Company Website Link
            const websiteLink = createElement('a', { href: data.website, target: '_blank' }, 'Company Website');

            // Append everything to the main container
            stockInfoDiv.append(title, priceChart, metricTable, summary, websiteLink);
        } else {
            const errorMessage = createElement('h2', {}, 'Stock not found');
            stockInfoDiv.appendChild(errorMessage);
        }
    } catch (error) {
        const errorElement = createElement('h2', {}, 'An error occurred while fetching data');
        console.error(error);
        stockInfoDiv.appendChild(errorElement);
    }

    stockInfoDiv.style.display = 'block'; // Ensure it's visible
}

document.getElementById('stock-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const ticker = document.getElementById('stock-symbol').value;
    fetchAndDisplayStockInfo(ticker);
});

// Store portfolio data in memory
let portfolioData = {
    stocks: [], // Array to hold stock positions
    totalValue: 0,
    performanceHistory: []
};

// Create portfolio management functions
function addToPortfolio(ticker, shares) {
    // Validate shares is a positive number
    shares = parseFloat(shares);
    if (isNaN(shares) || shares <= 0) {
        throw new Error('Please enter a valid number of shares');
    }

    // Check if stock already exists in portfolio
    const existingStock = portfolioData.stocks.find(stock => stock.ticker === ticker);
    if (existingStock) {
        existingStock.shares += shares;
        updatePortfolioValue();
        return;
    }

    // Fetch stock data and add to portfolio
    fetch(`/stock_info/${ticker}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error('Invalid ticker symbol');
            }

            const stockPosition = {
                ticker: ticker,
                shares: shares,
                purchasePrice: data.currentPrice,
                currentPrice: data.currentPrice,
                value: data.currentPrice * shares,
                companyName: data.longName
            };

            portfolioData.stocks.push(stockPosition);
            updatePortfolioValue();
            displayPortfolio();
            setupPriceUpdates();
        })
        .catch(error => {
            alert(error.message);
        });
}

function removeFromPortfolio(ticker) {
    portfolioData.stocks = portfolioData.stocks.filter(stock => stock.ticker !== ticker);
    updatePortfolioValue();
    displayPortfolio();
}

function updatePortfolioValue() {
    portfolioData.totalValue = portfolioData.stocks.reduce((total, stock) => 
        total + (stock.currentPrice * stock.shares), 0);
    
    // Update performance history
    const today = new Date().toISOString().split('T')[0];
    portfolioData.performanceHistory.push({
        date: today,
        value: portfolioData.totalValue
    });
}

// Function to create the portfolio display section
function createPortfolioSection() {
    const portfolioSection = createElement('div', {
        id: 'portfolio-section',
        className: 'portfolio-section'
    });

    const header = createElement('h2', {}, 'Portfolio Summary');
    const totalValue = createElement('h3', {}, `Total Value: $${portfolioData.totalValue.toFixed(2)}`);
    
    const addStockForm = createElement('form', {
        id: 'add-stock-form',
        className: 'add-stock-form'
    });

    const tickerInput = createElement('input', {
        type: 'text',
        placeholder: 'Stock Symbol',
        required: true,
        id: 'portfolio-ticker'
    });

    const sharesInput = createElement('input', {
        type: 'number',
        placeholder: 'Number of Shares',
        required: true,
        min: '1',
        id: 'portfolio-shares'
    });

    const submitButton = createElement('button', {
        type: 'submit'
    }, 'Add to Portfolio');

    addStockForm.append(tickerInput, sharesInput, submitButton);
    addStockForm.addEventListener('submit', handleAddStock);

    const holdingsTable = createHoldingsTable();
    const performanceChart = createPerformanceChart();

    portfolioSection.append(header, totalValue, addStockForm, holdingsTable, performanceChart);
    return portfolioSection;
}

function createHoldingsTable() {
    const table = createElement('table', {
        id: 'holdings-table',
        className: 'holdings-table'
    });

    const header = createElement('tr');
    ['Symbol', 'Company', 'Shares', 'Current Price', 'Value', 'Gain/Loss', 'Action']
        .forEach(text => {
            const th = createElement('th', {}, text);
            header.appendChild(th);
        });

    table.appendChild(header);
    return table;
}

function displayPortfolio() {
    const table = document.getElementById('holdings-table');
    clearElementContent(table);

    // Recreate header
    const header = createElement('tr');
    ['Symbol', 'Company', 'Shares', 'Current Price', 'Value', 'Gain/Loss', 'Action']
        .forEach(text => {
            const th = createElement('th', {}, text);
            header.appendChild(th);
        });
    table.appendChild(header);

    // Add rows for each stock
    portfolioData.stocks.forEach(stock => {
        const row = createElement('tr');
        const gainLoss = ((stock.currentPrice - stock.purchasePrice) * stock.shares);
        const gainLossPercent = ((stock.currentPrice - stock.purchasePrice) / stock.purchasePrice * 100);

        row.append(
            createElement('td', {}, stock.ticker),
            createElement('td', {}, stock.companyName),
            createElement('td', {}, stock.shares),
            createElement('td', {}, `$${stock.currentPrice.toFixed(2)}`),
            createElement('td', {}, `$${(stock.currentPrice * stock.shares).toFixed(2)}`),
            createElement('td', {
                className: gainLoss >= 0 ? 'positive-gain' : 'negative-gain'
            }, `$${gainLoss.toFixed(2)} (${gainLossPercent.toFixed(2)}%)`),
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
    const chartContainer = createElement('div', {
        className: 'chart-container',
        id: 'portfolio-performance-chart'
    });

    const canvas = createElement('canvas');
    chartContainer.appendChild(canvas);
    return chartContainer;
}

function updatePerformanceChart() {
    const canvas = document.querySelector('#portfolio-performance-chart canvas');
    const ctx = canvas.getContext('2d');

    // Clear existing chart if it exists
    if (window.portfolioChart) {
        window.portfolioChart.destroy();
    }

    window.portfolioChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Portfolio Value',
                data: portfolioData.performanceHistory.map(entry => ({
                    x: new Date(entry.date),
                    y: entry.value
                })),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Portfolio Value ($)'
                    }
                }
            }
        }
    });
}

// Set up periodic price updates
function setupPriceUpdates() {
    // Update prices every 5 minutes
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
    }, 300000); // 5 minutes
}

function handleAddStock(event) {
    event.preventDefault();
    const ticker = document.getElementById('portfolio-ticker').value.toUpperCase();
    const shares = document.getElementById('portfolio-shares').value;
    addToPortfolio(ticker, shares);
    event.target.reset();
}

// Initialize portfolio section when page loads
document.addEventListener('DOMContentLoaded', () => {
    const stockInfoDiv = document.getElementById('stock-info');
    const portfolioSection = createPortfolioSection();
    document.body.insertBefore(portfolioSection, stockInfoDiv);
});
