# 🛡️ SocialSentinel — Social Media Sentiment & Reputation Intelligence CLI

> **Problem Statement #271: Sentiment Analysis of Social Media Presence**  
> An NLP-powered terminal application that analyzes social media posts, classifies sentiment as **Positive**, **Negative**, or **Neutral**, and converts the predictions into actionable reputation, trend, keyword, topic, issue, platform, and alert intelligence.

---

## 📑 Table of Contents
1. [Overview](#-overview)
2. [Key Features](#-key-features)
3. [Architecture](#-architecture)
4. [Installation & Setup](#-installation--setup)
5. [Quick Start & Training](#-quick-start--training)
6. [CLI Command Reference](#-cli-command-reference)
7. [Dataset Specifications](#-dataset-specifications)
8. [Machine Learning Details](#-machine-learning-details)
9. [Analytics & Formulas](#-analytics--formulas)
10. [Automated Testing](#-automated-testing)
11. [License](#-license)

---

## 🌟 Overview

**SocialSentinel** provides brand managers, data analysts, and engineering teams with a high-performance, **100% terminal-based** sentiment intelligence engine. Built in modern **JavaScript (Node.js ESM)**, it operates without external web frameworks, databases, or cloud dependencies.

```text
What are people saying?
        ↓
Is the sentiment positive or negative?
        ↓
How strong is the sentiment?
        ↓
What topics are people discussing?
        ↓
What problems are people reporting?
        ↓
Is sentiment improving or declining?
        ↓
How is the organization's reputation?
        ↓
Are there any critical alerts?
        ↓
Which platform has the strongest negative sentiment?
```

---

## 🚀 Key Features

- 🎯 **Multinomial Sentiment Classifier**: TF-IDF + Logistic Regression trained on realistic social media feedback with probabilistic confidence scores.
- 🧹 **Social-Media Aware NLP Preprocessing**: Retains emoji sentiment tokens, segments CamelCase hashtags, and cleans handles/URLs.
- 📊 **Sentiment Statistics**: Distribution counts, percentages, and Unicode bar graphs.
- 🔑 **Explainable Keyword Extraction**: TF-IDF relevance ranking across overall, positive, and negative subsets.
- 💡 **Topic & Issue Discovery**: N-gram extraction highlighting key customer praise and friction points.
- 📅 **Time-Series Sentiment Trends**: Date-wise trajectory analysis to spot improving or declining brand sentiment.
- 🏆 **Brand Reputation Index**: A transparent 0–100 brand score with clear status tiers (*Excellent, Good, Average, Poor, Critical*).
- 🚨 **Risk Alert System**: Configurable threshold alerts for negative surges, reputation drops, and platform outliers.
- 🌐 **Cross-Platform Breakdown**: Comparative sentiment breakdowns across Twitter, Instagram, LinkedIn, and Facebook.
- 📄 **Executive Terminal Report**: All-in-one visual dashboard with optional JSON export.

---

## 🏛 Architecture

```text
CSV / Text Input
       ↓
  Data Loader       (Checks format, existence, UTF-8/Latin-1 encodings)
       ↓
 Data Validator     (Schema verification, blank removal, label normalization)
       ↓
Text Preprocessor   (Emoji mapping, hashtag split, mention/URL scrubbing)
       ↓
TF-IDF Vectorizer   (Unigrams + Bigrams, Sublinear TF)
       ↓
Logistic Regression (Multinomial Softmax, class-weighted, L2 regularized)
       ↓
Sentiment Predictor (Class inference + Probability confidence)
       ↓
 Analytics Engine   (Stats, Keywords, Topics, Trends, Reputation, Alerts, Platforms)
       ↓
  Terminal UI       (Visual tables, panels, bar charts, executive dashboard)
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 18+ (tested on Node v25)
- npm

### Setup Instructions

```bash
# Clone repository
git clone https://github.com/kankush1803/Sentiment-analysis-of-social-Media.git
cd social-media-sentiment

# Install dependencies
npm install

# (Optional) Link CLI command globally
npm link
```

---

## 🎯 Quick Start & Training

### 1. Train the Classifier
```bash
node bin/socialsentinel.js train data/training.csv
```

### 2. Generate Full Executive Report
```bash
node bin/socialsentinel.js report data/sample_posts.csv
```

---

## 📖 CLI Command Reference

| Command | Description | Example |
|---|---|---|
| `train` | Train sentiment model & vectorizer | `node bin/socialsentinel.js train data/training.csv` |
| `analyze` | Classify single text string | `node bin/socialsentinel.js analyze "I love this product!"` |
| `analyze-csv` | Batch classify posts CSV | `node bin/socialsentinel.js analyze-csv data/sample_posts.csv --limit 20` |
| `stats` | Calculate sentiment distribution | `node bin/socialsentinel.js stats data/sample_posts.csv` |
| `keywords` | Extract top TF-IDF keywords | `node bin/socialsentinel.js keywords data/sample_posts.csv --top 10` |
| `topics` | Extract positive topics & negative issues | `node bin/socialsentinel.js topics data/sample_posts.csv --top 5` |
| `trends` | Sentiment changes over time | `node bin/socialsentinel.js trends data/sample_posts.csv` |
| `reputation` | Compute 0-100 brand score | `node bin/socialsentinel.js reputation data/sample_posts.csv` |
| `alerts` | Risk alerts for negative spikes | `node bin/socialsentinel.js alerts data/sample_posts.csv --negative-threshold 35` |
| `platform` | Compare Twitter, Instagram, etc. | `node bin/socialsentinel.js platform data/sample_posts.csv` |
| `report` | Full terminal executive report | `node bin/socialsentinel.js report data/sample_posts.csv [--json out.json]` |

---

## 📁 Dataset Specifications

### Training CSV (`data/training.csv`)
Must contain `text` and `label` (`positive`, `negative`, or `neutral`):
```csv
text,label
"I absolutely love this product",positive
"Customer service was terrible",negative
"Received my shipment confirmation",neutral
```

### Posts CSV (`data/sample_posts.csv`)
Requires `text`. Supports optional `id`, `date` (`YYYY-MM-DD`), and `platform`:
```csv
id,text,date,platform
1,"Amazing service! Really impressed. 😍 #GreatExperience",2026-01-01,Twitter
2,"The delivery was extremely slow. 😡 #BadService",2026-01-02,Instagram
3,"Received my order today.",2026-01-03,Facebook
```

---

## 🧮 Analytics & Formulas

### Brand Reputation Index (0–100)
SocialSentinel implements a transparent analytical formula:

$$\text{Reputation Score} = (\text{Positive \%} \times 1.0) + (\text{Neutral \%} \times 0.5) + (\text{Negative \%} \times 0.0)$$

| Score Range | Reputation Status | Recommended Action |
|---|---|---|
| **75 – 100** | `EXCELLENT` | High customer advocacy; continue successful strategy. |
| **60 – 74** | `GOOD` | Healthy brand health; monitor feedback trends. |
| **45 – 59** | `AVERAGE` | Neutral perception; address common customer issues. |
| **30 – 44** | `POOR` | Negative feedback dominant; review service operations. |
| **0 – 29** | `CRITICAL` | Severe brand crisis; immediate intervention required. |

---

## 🧪 Automated Testing

SocialSentinel comes with a comprehensive native Node.js test suite covering all modules:

```bash
npm test
```

Test coverage includes:
- `tests/test_loader.test.js`: CSV parsing, encoding fallbacks, empty files, validation rules.
- `tests/test_preprocess.test.js`: Emoji expansion, hashtag segmentation, URL/mention scrubbing, character normalization.
- `tests/test_predictor.test.js`: Single and batch inference, confidence intervals, missing model error paths.
- `tests/test_analytics.test.js`: Distribution stats, reputation formula, TF-IDF keywords, n-gram topics, trends, and alerts.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
