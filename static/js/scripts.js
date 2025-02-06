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
            stockInfoDiv.append(title, summary, metricTable, websiteLink);
        } else {
            const errorMessage = createElement('h2', {}, 'Stock not found');
            stockInfoDiv.appendChild(errorMessage);
        }
    } catch (error) {
        const errorElement = createElement('h2', {}, 'An error occurred while fetching data');
        stockInfoDiv.appendChild(errorElement);
    }

    stockInfoDiv.style.display = 'block'; // Ensure it's visible
}

document.getElementById('stock-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const ticker = document.getElementById('stock-symbol').value;
    fetchAndDisplayStockInfo(ticker);
});
