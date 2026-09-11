/**
 * SocialSentinel — Multinomial Logistic Regression Classifier
 * High-performance pure JavaScript implementation of multinomial logistic regression
 * with Softmax probabilities, class weighting, and L2 regularization.
 */

export class LogisticRegression {
  constructor(options = {}) {
    this.C = options.C || 1.0;
    this.maxIter = options.maxIter || 200;
    this.learningRate = options.learningRate || 0.1;
    this.classWeight = options.classWeight || 'balanced';

    this.classes = [];
    this.weights = []; // [classIndex][featureIndex]
    this.biases = [];  // [classIndex]
    this.numFeatures = 0;
  }

  /**
   * Numerically stable Softmax calculation.
   * @param {number[]} logits
   * @returns {number[]} probabilities
   */
  static softmax(logits) {
    const maxVal = Math.max(...logits);
    const expVals = logits.map(v => Math.exp(v - maxVal));
    const sumExp = expVals.reduce((a, b) => a + b, 0);
    return expVals.map(v => v / (sumExp || 1));
  }

  /**
   * Fit the logistic regression model on sparse training vectors and string labels.
   *
   * @param {Array<Map<number, number>>} X - Array of sparse feature vectors
   * @param {string[]} y - Array of target class labels
   * @param {number} numFeatures - Total number of features in vocabulary
   */
  fit(X, y, numFeatures) {
    this.numFeatures = numFeatures;
    this.classes = Array.from(new Set(y)).sort();
    const numClasses = this.classes.length;
    const numSamples = X.length;

    const classToIndex = new Map(this.classes.map((c, i) => [c, i]));
    const yIndices = y.map(c => classToIndex.get(c));

    // Initialize weights and biases
    this.weights = Array.from({ length: numClasses }, () => new Float64Array(numFeatures));
    this.biases = new Float64Array(numClasses);

    // Compute class weights
    const classWeights = new Float64Array(numClasses).fill(1.0);
    if (this.classWeight === 'balanced') {
      const counts = new Float64Array(numClasses);
      for (const idx of yIndices) {
        counts[idx]++;
      }
      for (let c = 0; c < numClasses; c++) {
        classWeights[c] = numSamples / (numClasses * (counts[c] || 1));
      }
    }

    const regLambda = 1.0 / (this.C * numSamples);
    const lr = this.learningRate;

    // Gradient descent
    for (let iter = 0; iter < this.maxIter; iter++) {
      // Step size decay
      const stepSize = lr / (1 + 0.001 * iter);

      for (let i = 0; i < numSamples; i++) {
        const x_i = X[i];
        const y_i = yIndices[i];
        const sampleWeight = classWeights[y_i];

        // Compute logits: z_k = bias_k + sum(w_kj * x_ij)
        const logits = new Float64Array(numClasses);
        for (let c = 0; c < numClasses; c++) {
          let dot = this.biases[c];
          for (const [featIdx, featVal] of x_i.entries()) {
            dot += this.weights[c][featIdx] * featVal;
          }
          logits[c] = dot;
        }

        // Softmax probabilities
        const probs = LogisticRegression.softmax(Array.from(logits));

        // Gradients: (P_c - 1(y=c)) * sampleWeight + regLambda * w_cj
        for (let c = 0; c < numClasses; c++) {
          const target = c === y_i ? 1.0 : 0.0;
          const error = (probs[c] - target) * sampleWeight;

          // Update bias
          this.biases[c] -= stepSize * error;

          // Update weights for active sparse features
          for (const [featIdx, featVal] of x_i.entries()) {
            const grad = error * featVal + regLambda * this.weights[c][featIdx];
            this.weights[c][featIdx] -= stepSize * grad;
          }
        }
      }
    }

    return this;
  }

  /**
   * Predict probabilities for an array of sparse feature vectors.
   *
   * @param {Array<Map<number, number>>} X
   * @returns {Array<Object<string, number>>}
   */
  predictProba(X) {
    const numClasses = this.classes.length;
    const results = [];

    for (const x_i of X) {
      const logits = new Float64Array(numClasses);
      for (let c = 0; c < numClasses; c++) {
        let dot = this.biases[c];
        for (const [featIdx, featVal] of x_i.entries()) {
          dot += this.weights[c][featIdx] * featVal;
        }
        logits[c] = dot;
      }

      const probs = LogisticRegression.softmax(Array.from(logits));
      const probMap = {};
      for (let c = 0; c < numClasses; c++) {
        probMap[this.classes[c]] = probs[c];
      }
      results.push(probMap);
    }

    return results;
  }

  /**
   * Predict top class labels for an array of sparse feature vectors.
   *
   * @param {Array<Map<number, number>>} X
   * @returns {string[]}
   */
  predict(X) {
    const probas = this.predictProba(X);
    return probas.map(probMap => {
      let maxClass = this.classes[0];
      let maxVal = -1;
      for (const [cls, val] of Object.entries(probMap)) {
        if (val > maxVal) {
          maxVal = val;
          maxClass = cls;
        }
      }
      return maxClass;
    });
  }

  /**
   * Serialize classifier to JSON object.
   */
  toJSON() {
    return {
      classes: this.classes,
      numFeatures: this.numFeatures,
      biases: Array.from(this.biases),
      weights: this.weights.map(w => Array.from(w)),
      C: this.C,
      learningRate: this.learningRate,
    };
  }

  /**
   * Deserialize classifier from JSON object.
   */
  static fromJSON(data) {
    const model = new LogisticRegression({
      C: data.C,
      learningRate: data.learningRate,
    });
    model.classes = data.classes;
    model.numFeatures = data.numFeatures;
    model.biases = new Float64Array(data.biases);
    model.weights = data.weights.map(w => new Float64Array(w));
    return model;
  }
}
