document.getElementById('stock-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const ticker = document.getElementById('stock-symbol').value;
    const stock_info_div = document.getElementById('stock-info');
    const response = await fetch(`/stock_info/${ticker}`);
    stock_info_div.style.display = 'block';  

    if (response.ok) {
        const data = await response.json();
        stock_info_div.innerHTML = `
            <h2>${ticker} (${data['longName']})</h2>
            <p>${data['longBusinessSummary']}</p>
            <h3>Price: $${data['currentPrice']}</h3>
            <h3>Market Cap: $${data['marketCap']}</h3>
            <h3>Dividend Yield: ${data['dividendYield']}%</h3>
            <h3>EPS: $${data['trailingEps']}</h3>
            <h3>PE Ratio: ${data['trailingPE']}</h3>
            <h3>52 Week High: $${data['fiftyTwoWeekHigh']}</h3>
            <h3>52 Week Low: $${data['fiftyTwoWeekLow']}</h3>
            <table>
                <tr>
                    <th>Indicator</th>
                    <th>Value</th>
                </tr>
                <tr>
                    <td>Beta</td>
                    <td>${data['beta']}</td>
                </tr>
                <tr>
                    <td>Debt to Equity</td>
                    <td>${data['debtToEquity']}%</td>
                </tr>
                <tr>
                    <td>Return on Assets</td>
                    <td>${data['returnOnAssets']*100}%</td>
                </tr>
                <tr>
                    <td>Return on Equity</td>
                    <td>${data['returnOnEquity']*100}%</td>
                </tr>
                <tr>
                    <td>Revenue Growth</td>
                    <td>${data['revenueGrowth']*100}%</td>
                </tr>
                <tr>
                    <td>Profit Margins</td>
                    <td>${data['profitMargins']*100}%</td>
                </tr>
            </table>
        `;
    }
    else {
        stock_info_div.innerHTML = "<h2>Stock not found<h2>";
    }
})