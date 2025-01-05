from flask import Flask, jsonify, render_template
import yfinance as yf

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/stock_info/<ticker>')
def stock_info(ticker):
    data = yf.Ticker(ticker)
    try:
        if(data.info["longName"] == ""):
            return jsonify({'error': 'Invalid ticker'}), 404
        return jsonify(data.info), 200
    except Exception as e:
        return jsonify({'error': 'Invalid ticker'}), 404

if __name__ == '__main__':
    app.run(debug=False)