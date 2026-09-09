# Architecture Overview — SocialSentinel (JavaScript)

## Pipeline Architecture

```text
CSV / Text Input
       ↓
  Data Loader       (File existence, RFC 4180 CSV parsing, UTF-8 / Latin-1 fallback)
       ↓
 Data Validator     (Required columns, drop blanks, normalize labels)
       ↓
Text Preprocessor   (Emoji expansion, hashtag segmentation, mentions/URLs, char normalization)
       ↓
TF-IDF Vectorizer   (Unigrams + Bigrams, Sublinear TF scaling, L2 normalization)
       ↓
Logistic Regression (Multinomial Softmax, class-weighted, L2 regularized)
       ↓
Sentiment Predictor (Label classification + Probability confidence score)
       ↓
 Analytics Engine   (Stats, Keywords, Topics, Trends, Reputation, Alerts, Platforms)
       ↓
 Terminal UI        (Tables, Unicode progress bars, Panels, Executive Report)
```

## Modular Components

1. **`bin/socialsentinel.js`**:
   Executable CLI entry point registering the `socialsentinel` command.

2. **`src/cli.js`**:
   Subcommands definition and CLI argument routing powered by Commander.

3. **`src/data/loader.js`**:
   Loads raw CSV files safely, catches corrupt rows, encodings (`utf-8`, `latin-1`), and generates descriptive user errors.

4. **`src/data/validator.js`**:
   Validates schema (`text` column for posts; `text` and `label` for training data). Normalizes labels and filters out unparseable rows with informative warnings.

5. **`src/nlp/preprocess.js`**:
   Cleans social media text while preserving sentiment:
   - Maps emojis (`😍` → `love`, `😡` → `angry`)
   - Splits camel-case hashtags (`#GreatService` → `great service`)
   - Strips noisy user handles (`@company`) and URLs
   - Collapses excessive character elongation (`loooove` → `loove`)

6. **`src/nlp/vectorizer.js` & `src/nlp/classifier.js`**:
   Pure JavaScript TF-IDF vectorizer and Multinomial Logistic Regression model.

7. **`src/nlp/train.js` & `src/nlp/predictor.js`**:
   Trains and serializes the vectorizer and classifier to `models/model.json`. Supports both single-utterance prediction and batch dataset inference.

8. **`src/analytics/`**:
   Independent analytical modules:
   - `statistics.js`: Sentiment proportions, counts, dominant tone, average confidence, platform breakdowns.
   - `keywords.js`: Explainable TF-IDF term scoring, filtered against stopwords.
   - `topics.js`: N-gram extraction highlighting key positive themes and negative friction points.
   - `trends.js`: Time-series grouping and net sentiment trajectory detection.
   - `reputation.js`: 0–100 brand reputation index with status levels (Excellent, Good, Average, Poor, Critical).
   - `alerts.js`: Rule-based risk monitoring on negative sentiment spikes, low reputation, and platform outliers.

9. **`src/reports/terminal.js`**:
   Terminal visual presentation powered by `chalk` and `cli-table3`.
