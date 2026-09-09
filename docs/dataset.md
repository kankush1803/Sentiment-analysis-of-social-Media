# Dataset Specifications — SocialSentinel

## 1. Training Dataset (`data/training.csv`)

Used by `node bin/socialsentinel.js train <path>`.

### Required Columns
- `text` (string): The training text or social media utterance.
- `label` (string): Ground truth label. Must be one of `positive`, `negative`, or `neutral`.

### Format
```csv
text,label
"I absolutely love this product",positive
"The service was excellent",positive
"I hate this service",negative
"Very poor experience",negative
"The product arrived today",neutral
"I received the update",neutral
```

---

## 2. Social Media Posts Dataset (`data/sample_posts.csv`)

Used by analysis commands like `analyze-csv`, `stats`, `keywords`, `topics`, `trends`, `reputation`, `alerts`, `platform`, `report`.

### Columns
- `id` *(optional)*: Unique identifier for the post.
- `text` *(required)*: The raw content of the social media post.
- `date` *(optional)*: Post timestamp in `YYYY-MM-DD` format (required for `trends` command).
- `platform` *(optional)*: Name of the social media platform (e.g. `Twitter`, `Instagram`, `Facebook`, `LinkedIn`).

### Format
```csv
id,text,date,platform
1,"Amazing service! Really impressed. 😍 #GreatExperience",2026-01-01,Twitter
2,"The delivery was extremely slow. 😡 #BadService",2026-01-02,Instagram
3,"Received my order today.",2026-01-03,Facebook
```
