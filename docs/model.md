# Machine Learning & NLP Specifications — SocialSentinel

## Model Overview

- **Feature Extractor**: `TfidfVectorizer`
  - Unigrams & Bigrams (`ngram_range=(1, 2)`)
  - Sublinear Term Frequency (`sublinear_tf=True`)
  - Accent stripping: Unicode
  - Max features: 8,000
- **Classifier**: `LogisticRegression`
  - Multinomial formulation
  - Solver: `lbfgs`
  - Balanced class weights (`class_weight='balanced'`)
  - Random seed: `42` (deterministic reproducibility)

## Preprocessing Pipeline

1. **Emoji Translation**: Known sentiment emojis are converted to representative polarity tokens (`😍` → `love`, `😡` → `angry`, `💯` → `perfect`).
2. **Hashtag Normalization**: CamelCase hashtags are split (`#BestProductEver` → `best product ever`).
3. **Handle & URL Stripping**: User tags (`@mention`) and HTTP URLs are scrubbed to prevent noisy or overfitting features.
4. **Elongation Reduction**: Repeated characters (e.g. `awwwesome` → `awwesome`) are condensed to max 2 occurrences.

## Model Limitations

- **Sarcasm & Irony**: Sarcastic expressions (e.g., *"Great, another 3-hour flight delay 🙃"*) may be misclassified by bag-of-words/n-gram linear models due to literal positive token presence.
- **Multilingual / Hinglish**: The primary TF-IDF model is optimized for English social media text.
- **Complex Negations**: Long-distance dependencies and nuanced double negations are better handled by deep transformers.
