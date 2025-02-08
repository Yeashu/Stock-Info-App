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
