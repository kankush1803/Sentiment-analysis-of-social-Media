# CLI Command Reference — SocialSentinel

## Global Help
```bash
node bin/socialsentinel.js --help
# Or with npm link / npx:
socialsentinel --help
```

## 1. Train Model
Trains a new sentiment classifier on labelled CSV data and saves artifacts to `models/model.json`.
```bash
node bin/socialsentinel.js train data/training.csv
```

## 2. Analyze Single Utterance
Evaluates sentiment polarity and model confidence for a single string.
```bash
node bin/socialsentinel.js analyze "I absolutely love this product!"
```

## 3. Batch Analyze CSV
Runs inference over an entire posts CSV and outputs a formatted table.
```bash
node bin/socialsentinel.js analyze-csv data/sample_posts.csv --limit 20
```

## 4. Sentiment Statistics
Calculates distribution percentages and dominant sentiment.
```bash
node bin/socialsentinel.js stats data/sample_posts.csv
```

## 5. Keyword Extraction
Extracts top TF-IDF keywords overall, for positive posts, and for negative posts.
```bash
node bin/socialsentinel.js keywords data/sample_posts.csv --top 10
```

## 6. Topic & Issue Discovery
Identifies positive themes and negative customer issues.
```bash
node bin/socialsentinel.js topics data/sample_posts.csv --top 5
```

## 7. Sentiment Trends
Plots daily sentiment breakdown and determines if brand sentiment is improving, declining, or stable.
```bash
node bin/socialsentinel.js trends data/sample_posts.csv
```

## 8. Reputation Score
Computes a 0–100 brand reputation score and qualitative rating.
```bash
node bin/socialsentinel.js reputation data/sample_posts.csv
```

## 9. Sentiment Alerts
Scans for high negative sentiment spikes, low reputation scores, or declining trends.
```bash
node bin/socialsentinel.js alerts data/sample_posts.csv --negative-threshold 35.0
```

## 10. Platform Breakdown
Compares sentiment distribution across Twitter, Instagram, LinkedIn, Facebook, etc.
```bash
node bin/socialsentinel.js platform data/sample_posts.csv
```

## 11. Full Executive Report
Runs all analytical modules and prints a comprehensive terminal dashboard.
```bash
node bin/socialsentinel.js report data/sample_posts.csv
```
Optional JSON export:
```bash
node bin/socialsentinel.js report data/sample_posts.csv --json report.json
```
