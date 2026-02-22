/* ============================================
   Data Loader — Fetch & Cache JSON Questions
   ============================================ */

const DataLoader = {
  cache: {},
  subjectMap: {
    'probability-statistics': { name: 'Probability and Statistics', icon: '🎲', questions: 1020,
      topics: ['counting','probability-axioms','independent-mutually-exclusive','conditional-joint-marginal','bayes-theorem','expectation-variance','mean-median-mode-std','correlation-covariance','discrete-random-variables','discrete-distributions','continuous-random-variables','continuous-distributions','cdf','conditional-pdf','central-limit-theorem','confidence-intervals','hypothesis-testing']
    },
    'linear-algebra': { name: 'Linear Algebra', icon: '📐', questions: 660,
      topics: ['vector-spaces','linear-dependence','matrices-properties','quadratic-forms','linear-equations','gaussian-elimination','eigenvalues-eigenvectors','determinant-rank-nullity','projections','lu-decomposition','svd']
    },
    'calculus-optimization': { name: 'Calculus and Optimization', icon: '📈', questions: 300,
      topics: ['functions-single-variable','limits-continuity-differentiability','taylor-series','maxima-minima','optimization']
    },
    'programming-dsa': { name: 'Programming, DS & Algorithms', icon: '💻', questions: 900,
      topics: ['python-programming','stacks','queues','linked-lists','trees','hash-tables','linear-search','binary-search','selection-sort','bubble-sort','insertion-sort','merge-sort','quick-sort','graph-theory','graph-algorithms']
    },
    'dbms-warehousing': { name: 'Database Management & Warehousing', icon: '🗄️', questions: 660,
      topics: ['er-model','relational-algebra','tuple-calculus','sql','integrity-constraints','normal-forms','file-organization-indexing','data-transformation','warehouse-modelling','concept-hierarchies','measures']
    },
    'ml-supervised': { name: 'ML — Supervised Learning', icon: '🤖', questions: 840,
      topics: ['regression-classification-concepts','simple-linear-regression','multiple-linear-regression','ridge-regression','logistic-regression','knn','naive-bayes','lda','svm','decision-trees','bias-variance','cross-validation','mlp','feed-forward-nn']
    },
    'ml-unsupervised': { name: 'ML — Unsupervised Learning', icon: '🔬', questions: 240,
      topics: ['kmeans-kmedoid','hierarchical-clustering','dimensionality-reduction','pca']
    },
    'artificial-intelligence': { name: 'Artificial Intelligence', icon: '🧠', questions: 480,
      topics: ['informed-search','uninformed-search','adversarial-search','propositional-logic','predicate-logic','conditional-independence','variable-elimination','approximate-inference']
    }
  },

  topicNames: {
    'counting': 'Counting: Permutations & Combinations',
    'probability-axioms': 'Probability Axioms, Sample Space, Events',
    'independent-mutually-exclusive': 'Independent & Mutually Exclusive Events',
    'conditional-joint-marginal': 'Marginal, Conditional & Joint Probability',
    'bayes-theorem': "Bayes' Theorem",
    'expectation-variance': 'Conditional Expectation & Variance',
    'mean-median-mode-std': 'Mean, Median, Mode & Standard Deviation',
    'correlation-covariance': 'Correlation & Covariance',
    'discrete-random-variables': 'Discrete Random Variables & PMF',
    'discrete-distributions': 'Discrete Distributions (Uniform, Bernoulli, Binomial)',
    'continuous-random-variables': 'Continuous Random Variables & PDF',
    'continuous-distributions': 'Continuous Distributions (Normal, Exponential, etc.)',
    'cdf': 'Cumulative Distribution Function',
    'conditional-pdf': 'Conditional PDF',
    'central-limit-theorem': 'Central Limit Theorem',
    'confidence-intervals': 'Confidence Intervals',
    'hypothesis-testing': 'Hypothesis Testing (z, t, chi-squared)',
    'vector-spaces': 'Vector Spaces & Subspaces',
    'linear-dependence': 'Linear Dependence & Independence',
    'matrices-properties': 'Matrices & Properties',
    'quadratic-forms': 'Quadratic Forms',
    'linear-equations': 'Systems of Linear Equations',
    'gaussian-elimination': 'Gaussian Elimination',
    'eigenvalues-eigenvectors': 'Eigenvalues & Eigenvectors',
    'determinant-rank-nullity': 'Determinant, Rank & Nullity',
    'projections': 'Projections',
    'lu-decomposition': 'LU Decomposition',
    'svd': 'Singular Value Decomposition',
    'functions-single-variable': 'Functions of a Single Variable',
    'limits-continuity-differentiability': 'Limits, Continuity & Differentiability',
    'taylor-series': 'Taylor Series',
    'maxima-minima': 'Maxima & Minima',
    'optimization': 'Optimization (Single Variable)',
    'python-programming': 'Python Programming',
    'stacks': 'Stacks', 'queues': 'Queues', 'linked-lists': 'Linked Lists',
    'trees': 'Trees', 'hash-tables': 'Hash Tables',
    'linear-search': 'Linear Search', 'binary-search': 'Binary Search',
    'selection-sort': 'Selection Sort', 'bubble-sort': 'Bubble Sort',
    'insertion-sort': 'Insertion Sort', 'merge-sort': 'Merge Sort',
    'quick-sort': 'Quick Sort', 'graph-theory': 'Graph Theory',
    'graph-algorithms': 'Graph Algorithms (BFS, DFS, Shortest Path)',
    'er-model': 'ER Model', 'relational-algebra': 'Relational Model & Algebra',
    'tuple-calculus': 'Tuple Calculus',
    'sql': 'SQL (Queries, Joins, Subqueries)',
    'integrity-constraints': 'Integrity Constraints',
    'normal-forms': 'Normal Forms (1NF–BCNF)',
    'file-organization-indexing': 'File Organization & Indexing',
    'data-transformation': 'Data Transformation',
    'warehouse-modelling': 'Data Warehouse Modelling',
    'concept-hierarchies': 'Concept Hierarchies',
    'measures': 'Measures: Categorization & Computations',
    'regression-classification-concepts': 'Regression & Classification Concepts',
    'simple-linear-regression': 'Simple Linear Regression',
    'multiple-linear-regression': 'Multiple Linear Regression',
    'ridge-regression': 'Ridge Regression',
    'logistic-regression': 'Logistic Regression',
    'knn': 'K-Nearest Neighbour',
    'naive-bayes': 'Naive Bayes Classifier',
    'lda': 'Linear Discriminant Analysis',
    'svm': 'Support Vector Machine',
    'decision-trees': 'Decision Trees',
    'bias-variance': 'Bias-Variance Trade-off',
    'cross-validation': 'Cross-Validation (LOO, k-Fold)',
    'mlp': 'Multi-Layer Perceptron',
    'feed-forward-nn': 'Feed-Forward Neural Network',
    'kmeans-kmedoid': 'k-Means & k-Medoid Clustering',
    'hierarchical-clustering': 'Hierarchical Clustering',
    'dimensionality-reduction': 'Dimensionality Reduction',
    'pca': 'Principal Component Analysis',
    'informed-search': 'Informed Search (A*, Greedy)',
    'uninformed-search': 'Uninformed Search (BFS, DFS)',
    'adversarial-search': 'Adversarial Search (Minimax, Alpha-Beta)',
    'propositional-logic': 'Propositional Logic',
    'predicate-logic': 'Predicate Logic',
    'conditional-independence': 'Conditional Independence',
    'variable-elimination': 'Variable Elimination',
    'approximate-inference': 'Approximate Inference (Sampling)'
  },

  getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/chapters/') || path.includes('/quiz/')) return '../';
    return '';
  },

  async loadTopic(subject, topic) {
    const key = `${subject}/${topic}`;
    if (this.cache[key]) return this.cache[key];
    try {
      const base = this.getBasePath();
      const res = await fetch(`${base}data/${subject}/${topic}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.cache[key] = data;
      return data;
    } catch (e) {
      console.warn(`Failed to load ${key}:`, e.message);
      return [];
    }
  },

  async loadSubject(subject) {
    const info = this.subjectMap[subject];
    if (!info) return [];
    const all = [];
    for (const topic of info.topics) {
      const questions = await this.loadTopic(subject, topic);
      all.push(...questions);
    }
    return all;
  },

  async loadMultipleTopics(pairs) {
    const all = [];
    for (const { subject, topic } of pairs) {
      const questions = await this.loadTopic(subject, topic);
      all.push(...questions);
    }
    return all;
  },

  getSubjectInfo(slug) {
    return this.subjectMap[slug] || null;
  },

  getTopicName(slug) {
    return this.topicNames[slug] || slug;
  },

  getAllSubjects() {
    return Object.entries(this.subjectMap).map(([slug, info]) => ({ slug, ...info }));
  }
};
