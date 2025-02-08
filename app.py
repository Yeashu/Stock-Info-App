from flask import Flask, jsonify, render_template
import yfinance as yf

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/stock_info/<ticker>')
def stock_info(ticker):
    stock = yf.Ticker(ticker)
    try:
        if(stock.info["longName"] == ""):
            return jsonify({'error': 'Invalid ticker'}), 404
        return jsonify(stock.info), 200
    except Exception as e:
        return jsonify({'error': 'Invalid ticker'}), 404
    
@app.route('/stock_history/<ticker>')
def stock_history(ticker):
    stock = yf.Ticker(ticker)
    try:
        if(stock.info["longName"] == ""):
            return jsonify({'error': 'Invalid ticker'}), 404
        data = stock.history(period="3mo", interval="1d")
        data = data[['Open', 'High', 'Low', 'Close', 'Volume']].reset_index()
        return data.to_json(orient='records', date_format='iso'), 200
    except Exception as e:
        return jsonify({'error': 'Invalid ticker'}), 404

if __name__ == '__main__':
    app.run(debug=False)