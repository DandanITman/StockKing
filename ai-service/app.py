from flask import Flask, jsonify
import pandas as pd
import numpy as np

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "OK", "message": "StockKing AI Service is running"})

@app.route('/analyze', methods=['POST'])
def analyze_stock():
    # Placeholder for AI analysis
    return jsonify({"message": "AI analysis endpoint - to be implemented"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
