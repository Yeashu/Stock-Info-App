# Stock Portfolio Tracker

Stock Portfolio Tracker is a web-based application that allows users to track stock prices, manage their portfolio, and visualize performance trends. It fetches live stock data using the Yahoo Finance API and provides tools for effective portfolio management and analytics.

---

## Features

### 🕵️ **Search Stock Information**
- Enter a stock symbol (e.g., `AAPL`, `MSFT`, `INFY`) to get detailed live stock data, including:
  - Current Price
  - Market Cap
  - Dividend Yield
  - P/E Ratio
  - EPS
  - 52-week High/Low
  - Business Summary

### 📊 **Visualize Stock Price Trends**
- Displays a 3-month stock price chart with overlays for:
  - Close Price (Line Chart)
  - Volume (Bar Chart)

### 💼 **Manage Your Portfolio**
- Add or remove stocks in your portfolio.
- View detailed metrics, including:
  - Total Portfolio Value
  - Gains/Losses for individual holdings
- Track portfolio performance trends over time.

### ⏳ **Real-Time Updates**
- Live price updates for portfolio stocks every 5 minutes.

---

## Technologies Used

- **Backend:** Flask, Yahoo Finance API (`yfinance`)
- **Frontend:** HTML, CSS, JavaScript
- **Charting Library:** Chart.js
- **Storage:** Browser Local Storage

---

## Getting Started

### Prerequisites
- Python 3.8 or higher
- Node.js (optional for additional frontend tools)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Yeashu/Stock-Protfolio-Tracker.git
   cd Stock-Protfolio-Tracker/
   ```
2. Install Python dependencies:
   ```bash
    pip install flask yfinance
    ```
3. Run the Flask server:
    ```bash
    python app.py
    ```
4. Open your browser and go to:
    ```
    http://loclhost:5000
    ```

## Usage

### Searching for a Stock
- Enter the stock ticker symbol (e.g., `AAPL`, `TSLA`) in the search bar.
- Click **Get Info** to fetch detailed information about the stock.

### Adding Stocks to Portfolio
- Use the **Add to Portfolio** button for a stock you're viewing.
- Enter the number of shares you own.

### Viewing Your Portfolio
- Toggle the Portfolio Section using the button on the navigation bar.
- View your total portfolio value and individual stock metrics.
- Track portfolio performance trends on the chart.

## License

This project is licensed under the MIT License.

## Contact

If you have any questions or suggestions, feel free to reach out at:

- **Email:** yeashusemwal@gmail.com
- **GitHub:** [Yeashu](https://github.com/Yeashu)

Happy Investing! 🚀
