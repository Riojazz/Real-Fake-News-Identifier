import re
import string
import joblib

CONFIDENCE_THRESHOLD = 0.75
MIN_WORDS = 5


def clean_text(text):
    text = text.lower()
    text = re.sub(r"\[.*?\]", "", text)
    text = re.sub(r"https?://\S+|www\.\S+", "", text)
    text = re.sub(r"<.*?>+", "", text)
    text = re.sub(r"[%s]" % re.escape(string.punctuation), "", text)
    text = re.sub(r"\n", "", text)
    text = re.sub(r"\w*\d\w*", "", text)
    return text


model = joblib.load("fake_news_model.pkl")
vectorizer = joblib.load("tfidf_vectorizer.pkl")

while True:
    news = input("Enter news text (or type 'exit' to quit): ").strip()

    if news.lower() == "exit":
        print("Exiting prediction.")
        break

    news = clean_text(news)
    word_count = len(news.split())

    if word_count < MIN_WORDS:
        print("Input too short for reliable prediction.")
        print(f"Please enter at least {MIN_WORDS} words.")
        continue

    news_vector = vectorizer.transform([news])

    if news_vector.nnz == 0:
        print("Input does not contain enough known words for prediction.")
        continue

    prediction = model.predict(news_vector)
    probabilities = model.predict_proba(news_vector)[0]
    confidence = max(probabilities)

    if confidence < CONFIDENCE_THRESHOLD:
        print("Uncertain prediction")
    elif prediction[0] == 0:
        print("Fake News")
    else:
        print("Real News")

    print(f"Confidence: {confidence:.2%}")
    print(f"Fake probability: {probabilities[0]:.2%}")
    print(f"Real probability: {probabilities[1]:.2%}")
