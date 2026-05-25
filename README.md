# Real Fake News

Real Fake News is a Flask-based machine learning web app that predicts whether a news article is real or fake. It uses TF-IDF and a trained Logistic Regression model to analyze text, return confidence scores, and provide a simple interface for quick fake news detection.

## Features

- Detects whether input news text is likely real or fake
- Uses a trained Logistic Regression model with TF-IDF vectorization
- Returns confidence scores for fake and real predictions
- Includes input validation for short or unknown text
- Provides both a web interface and a command-line prediction mode

## Tech Stack

- Python
- Flask
- Flask-CORS
- scikit-learn
- pandas
- joblib
- HTML, CSS, JavaScript

## Project Structure

```text
Real Fake News/
|-- app.py
|-- News.py
|-- prediction.py
|-- fake_news_model.pkl
|-- tfidf_vectorizer.pkl
|-- Fake.csv
|-- True.csv
|-- templates/
|   `-- index.html
`-- static/
    |-- style.css
    `-- main.js
```

## How It Works

1. The dataset is loaded from `Fake.csv` and `True.csv`.
2. Text is cleaned by removing punctuation, URLs, HTML tags, numbers, and extra symbols.
3. The cleaned text is converted into numerical features using TF-IDF.
4. A Logistic Regression model is trained to classify news as fake or real.
5. The web app accepts user input and returns a prediction with confidence scores.

## Installation

Clone the repository and install the required packages:

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
pip install flask flask-cors pandas scikit-learn joblib
```

## Run the Web App

```bash
python app.py
```

Then open:

```text
http://127.0.0.1:5000
```

## Run the Command-Line Version

```bash
python prediction.py
```

## Train the Model Again

If you want to retrain the model from the dataset files:

```bash
python News.py
```

This will generate:

- `fake_news_model.pkl`
- `tfidf_vectorizer.pkl`

## API Endpoint

### `POST /api/predict`

Send JSON like:

```json
{
  "text": "Your news article text goes here"
}
```

Example response:

```json
{
  "status": "success",
  "verdict": "Fake News",
  "confidence": 0.91,
  "probabilities": {
    "fake": 0.91,
    "real": 0.09
  }
}
```

## Notes

- The app requires at least 5 words for reliable prediction.
- If the confidence score is below the threshold, the result may be marked as `Uncertain`.
- Model accuracy depends on the dataset quality and training process.

## Future Improvements

- Add a `requirements.txt` file
- Improve the UI and result explanation
- Support article title and source analysis
- Deploy the app online
- Add more advanced models for higher accuracy

## Author

Created as a machine learning project for fake news detection using Python and Flask.
