import re
import string
import os
import joblib
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)  # Enable Cross-Origin Resource Sharing

# Constants matching prediction.py
CONFIDENCE_THRESHOLD = 0.75
MIN_WORDS = 5

# Load model and vectorizer
# Try current directory first, otherwise fall back to absolute path if needed
base_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(base_dir, "fake_news_model.pkl")
vectorizer_path = os.path.join(base_dir, "tfidf_vectorizer.pkl")

try:
    model = joblib.load(model_path)
    vectorizer = joblib.load(vectorizer_path)
    print("Model and vectorizer loaded successfully.")
except Exception as e:
    print(f"Error loading model or vectorizer: {e}")
    # Attempt fallback to relative paths
    model = joblib.load("fake_news_model.pkl")
    vectorizer = joblib.load("tfidf_vectorizer.pkl")


def clean_text(text):
    text = text.lower()
    text = re.sub(r"\[.*?\]", "", text)
    text = re.sub(r"https?://\S+|www\.\S+", "", text)
    text = re.sub(r"<.*?>+", "", text)
    text = re.sub(r"[%s]" % re.escape(string.punctuation), "", text)
    text = re.sub(r"\n", "", text)
    text = re.sub(r"\w*\d\w*", "", text)
    return text


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({
                'status': 'error',
                'message': 'No text provided. Please enter some news text.'
            }), 400

        raw_text = data['text'].strip()
        
        # Word count validation before cleaning
        word_count = len(raw_text.split())
        if word_count < MIN_WORDS:
            return jsonify({
                'status': 'error',
                'message': f'Input too short for reliable prediction. Please enter at least {MIN_WORDS} words.'
            }), 400

        cleaned_text = clean_text(raw_text)
        
        # Vectorize
        news_vector = vectorizer.transform([cleaned_text])

        # Check if contains any known words
        if news_vector.nnz == 0:
            return jsonify({
                'status': 'error',
                'message': 'Input does not contain enough known words for prediction. Try adding more context.'
            }), 400

        # Predict
        prediction = model.predict(news_vector)[0]
        probabilities = model.predict_proba(news_vector)[0]
        confidence = float(max(probabilities))

        # Probability scores
        fake_prob = float(probabilities[0])
        real_prob = float(probabilities[1])

        # Determine verdict
        if confidence < CONFIDENCE_THRESHOLD:
            verdict = "Uncertain"
        elif prediction == 0:
            verdict = "Fake News"
        else:
            verdict = "Real News"

        return jsonify({
            'status': 'success',
            'verdict': verdict,
            'confidence': confidence,
            'probabilities': {
                'fake': fake_prob,
                'real': real_prob
            },
            'metadata': {
                'word_count': word_count,
                'cleaned_word_count': len(cleaned_text.split())
            }
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'An error occurred during prediction: {str(e)}'
        }), 500


if __name__ == '__main__':
    print("Starting Veritas AI landing page server...")
    app.run(debug=True, host='127.0.0.1', port=5000)
