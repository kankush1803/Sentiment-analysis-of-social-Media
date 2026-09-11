/**
 * SocialSentinel — TF-IDF Vectorizer
 * Supports unigrams + bigrams, sublinear TF scaling, custom stopwords, and JSON serialization.
 */

export class TfidfVectorizer {
  constructor(options = {}) {
    this.maxFeatures = options.maxFeatures || 8000;
    this.ngramRange = options.ngramRange || [1, 2];
    this.sublinearTf = options.sublinearTf ?? true;
    this.stopWords = options.stopWords ? new Set(options.stopWords) : null;
    this.tokenPattern = options.tokenPattern || /\b[a-zA-Z][a-zA-Z0-9']{1,}\b/g;

    this.vocabulary = new Map(); // word -> feature_index
    this.featureNames = [];      // feature_index -> word
    this.idf = [];               // feature_index -> idf_value
    this.numDocs = 0;
  }

  /**
   * Tokenize text and generate n-grams within specified range.
   * @param {string} text
   * @returns {string[]}
   */
  _extractNgrams(text) {
    if (!text || typeof text !== 'string') return [];

    const matches = text.match(this.tokenPattern) || [];
    const tokens = matches.map(t => t.toLowerCase());

    const ngrams = [];
    const [minN, maxN] = this.ngramRange;

    for (let n = minN; n <= maxN; n++) {
      for (let i = 0; i <= tokens.length - n; i++) {
        const slice = tokens.slice(i, i + n);

        // If stopwords are provided, skip unigram stopwords or bigrams containing only stopwords
        if (this.stopWords) {
          if (n === 1 && this.stopWords.has(slice[0])) {
            continue;
          }
          if (n === 2 && this.stopWords.has(slice[0]) && this.stopWords.has(slice[1])) {
            continue;
          }
        }

        ngrams.push(slice.join(' '));
      }
    }

    return ngrams;
  }

  /**
   * Fit the vectorizer on a corpus of text documents.
   * @param {string[]} documents
   */
  fit(documents) {
    this.numDocs = documents.length;
    const docFrequency = new Map(); // term -> document count
    const termFrequencyTotal = new Map();

    for (const doc of documents) {
      const ngrams = this._extractNgrams(doc);
      const seenInDoc = new Set(ngrams);

      for (const term of seenInDoc) {
        docFrequency.set(term, (docFrequency.get(term) || 0) + 1);
      }
      for (const term of ngrams) {
        termFrequencyTotal.set(term, (termFrequencyTotal.get(term) || 0) + 1);
      }
    }

    // Sort terms by total frequency descending to respect maxFeatures
    const sortedTerms = Array.from(docFrequency.keys()).sort((a, b) => {
      const freqA = termFrequencyTotal.get(a) || 0;
      const freqB = termFrequencyTotal.get(b) || 0;
      return freqB - freqA;
    });

    const selectedTerms = sortedTerms.slice(0, this.maxFeatures);

    this.vocabulary.clear();
    this.featureNames = [];
    this.idf = [];

    const N = this.numDocs;
    for (let idx = 0; idx < selectedTerms.length; idx++) {
      const term = selectedTerms[idx];
      this.vocabulary.set(term, idx);
      this.featureNames.push(term);

      const df = docFrequency.get(term) || 1;
      // Smooth IDF: log((1 + N) / (1 + df)) + 1
      const idfVal = Math.log((1 + N) / (1 + df)) + 1;
      this.idf.push(idfVal);
    }

    return this;
  }

  /**
   * Transform documents into sparse or dense TF-IDF vectors.
   * @param {string[]} documents
   * @returns {Array<Map<number, number>>} Array of sparse vectors (featureIndex -> tfidf)
   */
  transform(documents) {
    const matrix = [];

    for (const doc of documents) {
      const ngrams = this._extractNgrams(doc);
      const termCounts = new Map();

      for (const term of ngrams) {
        if (this.vocabulary.has(term)) {
          const idx = this.vocabulary.get(term);
          termCounts.set(idx, (termCounts.get(idx) || 0) + 1);
        }
      }

      // Compute TF-IDF values
      const sparseVector = new Map();
      let sumSquares = 0;

      for (const [idx, count] of termCounts.entries()) {
        const tf = this.sublinearTf ? 1 + Math.log(count) : count;
        const tfidf = tf * this.idf[idx];
        sparseVector.set(idx, tfidf);
        sumSquares += tfidf * tfidf;
      }

      // L2 Normalization
      const norm = Math.sqrt(sumSquares);
      if (norm > 0) {
        for (const [idx, val] of sparseVector.entries()) {
          sparseVector.set(idx, val / norm);
        }
      }

      matrix.push(sparseVector);
    }

    return matrix;
  }

  /**
   * Fit and transform in one step.
   * @param {string[]} documents
   * @returns {Array<Map<number, number>>}
   */
  fitTransform(documents) {
    this.fit(documents);
    return this.transform(documents);
  }

  /**
   * Serialize vectorizer to JSON object.
   */
  toJSON() {
    return {
      maxFeatures: this.maxFeatures,
      ngramRange: this.ngramRange,
      sublinearTf: this.sublinearTf,
      numDocs: this.numDocs,
      featureNames: this.featureNames,
      idf: this.idf,
      vocabulary: Array.from(this.vocabulary.entries()),
    };
  }

  /**
   * Deserialize vectorizer from JSON object.
   */
  static fromJSON(data) {
    const vec = new TfidfVectorizer({
      maxFeatures: data.maxFeatures,
      ngramRange: data.ngramRange,
      sublinearTf: data.sublinearTf,
    });
    vec.numDocs = data.numDocs;
    vec.featureNames = data.featureNames;
    vec.idf = data.idf;
    vec.vocabulary = new Map(data.vocabulary);
    return vec;
  }
}
