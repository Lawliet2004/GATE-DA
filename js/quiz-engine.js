/* ============================================
   Quiz Engine — Core Quiz Logic
   ============================================ */

const QuizEngine = {
  questions: [],
  currentIndex: 0,
  answers: {},
  markedForReview: new Set(),
  visitedQuestions: new Set(),
  mode: 'practice', // practice | test | review
  startTime: 0,
  questionStartTimes: {},
  questionTimes: {},
  isSubmitted: false,
  config: {},

  async init() {
    const subject = Utils.getQueryParam('subject');
    const topic = Utils.getQueryParam('topic');
    const mode = Utils.getQueryParam('mode') || 'practice';
    const count = Utils.getQueryParam('count') || '20';
    const topics = Utils.getQueryParam('topics');

    this.mode = mode;
    this.config = { subject, topic, mode, count };

    // Load questions
    let allQuestions = [];
    const isCustom = Utils.getQueryParam('custom') === 'true';
    if (isCustom) {
      // Multi-subject custom test
      const configStr = sessionStorage.getItem('customTestConfig');
      if (configStr) {
        const customConfig = JSON.parse(configStr);
        for (const sub of customConfig.subjects) {
          for (const t of sub.topics) {
            const qs = await DataLoader.loadTopic(sub.slug, t);
            allQuestions.push(...qs);
          }
        }
        sessionStorage.removeItem('customTestConfig');
      }
    } else if (topics) {
      const topicList = topics.split(',');
      for (const t of topicList) {
        const qs = await DataLoader.loadTopic(subject, t);
        allQuestions.push(...qs);
      }
    } else if (topic) {
      allQuestions = await DataLoader.loadTopic(subject, topic);
    } else if (subject) {
      allQuestions = await DataLoader.loadSubject(subject);
    }

    if (allQuestions.length === 0) {
      document.getElementById('quizArea').innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><h3>No questions found</h3><p>Questions for this topic are being loaded. Please try another topic.</p><a href="../index.html" class="btn btn-primary">Go Home</a></div>';
      return;
    }

    // Apply filters
    const settings = Storage.getSettings();
    if (settings.shuffleQuestions) allQuestions = Utils.shuffleArray(allQuestions);

    // Select question count
    const num = count === 'all' ? allQuestions.length : Math.min(parseInt(count) || 20, allQuestions.length);
    this.questions = allQuestions.slice(0, num);
    this.currentIndex = 0;
    this.answers = {};
    this.markedForReview = new Set();
    this.visitedQuestions = new Set([0]);
    this.startTime = Date.now();
    this.questionStartTimes = { 0: Date.now() };
    this.questionTimes = {};
    this.isSubmitted = false;

    // Set up UI
    this.updateTitle();
    this.renderQuestion();
    this.renderNavGrid();
    this.updateProgress();
    this.updateSummaryStats();
    this.setupKeyboardShortcuts();

    // Timer
    if (mode === 'test') {
      const duration = parseInt(Utils.getQueryParam('time')) || (num * 120);
      Timer.start(duration, () => this.autoSubmit());
    }

    document.getElementById('loadingState')?.classList.add('hidden');
    document.getElementById('quizArea')?.classList.remove('hidden');
  },

  updateTitle() {
    const el = document.getElementById('quizTitle');
    if (!el) return;
    const info = DataLoader.getSubjectInfo(this.config.subject);
    const topicName = DataLoader.getTopicName(this.config.topic);
    el.textContent = info ? `${info.name} — ${topicName}` : 'Quiz';
  },

  renderQuestion() {
    const q = this.questions[this.currentIndex];
    if (!q) return;

    // Track visit
    this.visitedQuestions.add(this.currentIndex);
    this.questionStartTimes[this.currentIndex] = Date.now();

    // Question header
    document.getElementById('questionNumber').textContent = `Question ${this.currentIndex + 1} of ${this.questions.length}`;
    document.getElementById('questionType').textContent = q.type;
    document.getElementById('questionType').className = `question-type-badge ${q.type.toLowerCase()}`;
    document.getElementById('questionDifficulty').textContent = q.difficulty;
    document.getElementById('questionDifficulty').className = `badge badge-${q.difficulty}`;

    // Question text
    document.getElementById('questionText').innerHTML = Utils.formatQuestion(q.question);

    // Code block
    const codeContainer = document.getElementById('codeBlock');
    if (q.code) {
      codeContainer.innerHTML = Utils.renderCodeBlock(q.code);
      codeContainer.classList.remove('hidden');
    } else {
      codeContainer.innerHTML = '';
      codeContainer.classList.add('hidden');
    }

    // Options or NAT input
    const optionsContainer = document.getElementById('optionsContainer');
    const natContainer = document.getElementById('natContainer');
    const explanationBox = document.getElementById('explanationBox');
    explanationBox.classList.add('hidden');

    if (q.type === 'NAT') {
      optionsContainer.classList.add('hidden');
      natContainer.classList.remove('hidden');
      const natInput = document.getElementById('natInput');
      natInput.value = this.answers[this.currentIndex] || '';
      natInput.className = 'nat-input';
      natInput.disabled = this.isSubmitted;
    } else {
      natContainer.classList.add('hidden');
      optionsContainer.classList.remove('hidden');
      this.renderOptions(q);
    }

    // Bookmark button
    const bmBtn = document.getElementById('bookmarkBtn');
    if (bmBtn) {
      const isBookmarked = Storage.isBookmarked(q.subject || this.config.subject, q.topic || this.config.topic, q.id);
      bmBtn.textContent = isBookmarked ? '🔖' : '🏷️';
      bmBtn.title = isBookmarked ? 'Remove Bookmark' : 'Add Bookmark';
    }

    // Mark for review button
    const markBtn = document.getElementById('markReviewBtn');
    if (markBtn) {
      markBtn.className = this.markedForReview.has(this.currentIndex) ? 'btn btn-danger btn-sm' : 'btn btn-outline btn-sm';
      markBtn.textContent = this.markedForReview.has(this.currentIndex) ? '🚩 Marked' : '🏳️ Mark for Review';
    }

    // Show explanation in practice mode if already answered
    if (this.mode === 'practice' && this.answers[this.currentIndex] !== undefined) {
      const settings = Storage.getSettings();
      if (settings.showAnswerImmediate) this.showCorrectAnswer();
      if (settings.showExplanationImmediate) this.showExplanation();
    }

    // Review mode
    if (this.mode === 'review' || this.isSubmitted) {
      this.showCorrectAnswer();
      this.showExplanation();
    }

    this.renderNavGrid();
    this.updateProgress();
  },

  renderOptions(q) {
    const container = document.getElementById('optionsContainer');
    const letters = ['A', 'B', 'C', 'D'];
    const isMulti = q.type === 'MSQ';
    const userAnswer = this.answers[this.currentIndex];
    const showResult = (this.mode === 'practice' && userAnswer !== undefined && Storage.getSettings().showAnswerImmediate) || this.isSubmitted || this.mode === 'review';

    container.innerHTML = q.options.map((opt, i) => {
      const letter = letters[i];
      let classes = 'option-item';
      let indicator = '';

      if (showResult) {
        const isCorrect = Array.isArray(q.correct) ? q.correct.includes(letter) : q.correct === letter;
        const isSelected = Array.isArray(userAnswer) ? userAnswer.includes(letter) : userAnswer === letter;
        if (isCorrect) { classes += ' correct'; indicator = '✓'; }
        if (isSelected && !isCorrect) { classes += ' incorrect'; indicator = '✗'; }
        if (isSelected && isCorrect) { classes += ' correct'; indicator = '✓'; }
        if (isCorrect && !isSelected) { classes += ' correct-reveal'; indicator = '✓'; }
      } else {
        const isSelected = Array.isArray(userAnswer) ? userAnswer.includes(letter) : userAnswer === letter;
        if (isSelected) classes += ' selected';
      }

      return `<div class="${classes}" onclick="QuizEngine.selectOption('${letter}')" data-letter="${letter}">
        <span class="option-letter">${letter}</span>
        <span class="option-text">${Utils.formatQuestion(opt)}</span>
        ${indicator ? `<span class="option-indicator">${indicator}</span>` : ''}
      </div>`;
    }).join('');
  },

  selectOption(letter) {
    if (this.isSubmitted || this.mode === 'review') return;
    const q = this.questions[this.currentIndex];
    if (!q) return;

    // In practice mode, if already answered and showAnswerImmediate, don't allow re-selection
    if (this.mode === 'practice' && this.answers[this.currentIndex] !== undefined && Storage.getSettings().showAnswerImmediate) return;

    if (q.type === 'MSQ') {
      let current = this.answers[this.currentIndex] || [];
      if (!Array.isArray(current)) current = [];
      if (current.includes(letter)) {
        current = current.filter(l => l !== letter);
      } else {
        current.push(letter);
      }
      this.answers[this.currentIndex] = current.length > 0 ? current : undefined;
    } else {
      this.answers[this.currentIndex] = letter;
    }

    // Practice mode: check immediately
    if (this.mode === 'practice') {
      const settings = Storage.getSettings();
      if (settings.showAnswerImmediate) {
        this.recordCurrentAnswer();
        this.showCorrectAnswer();
      }
      if (settings.showExplanationImmediate) {
        this.showExplanation();
      }
    }

    this.renderOptions(q);
    this.renderNavGrid();
    this.updateSummaryStats();
  },

  saveNatAnswer() {
    if (this.isSubmitted || this.mode === 'review') return;
    const val = document.getElementById('natInput').value.trim();
    this.answers[this.currentIndex] = val || undefined;
    this.renderNavGrid();
    this.updateSummaryStats();

    if (this.mode === 'practice' && val) {
      const settings = Storage.getSettings();
      if (settings.showAnswerImmediate) {
        this.recordCurrentAnswer();
        this.showCorrectAnswer();
      }
      if (settings.showExplanationImmediate) this.showExplanation();
    }
  },

  showCorrectAnswer() {
    const q = this.questions[this.currentIndex];
    if (!q) return;
    if (q.type === 'NAT') {
      const natInput = document.getElementById('natInput');
      const userVal = parseFloat(this.answers[this.currentIndex]);
      const correctVal = parseFloat(q.correct);
      if (!isNaN(userVal) && Math.abs(userVal - correctVal) < 0.01) {
        natInput.className = 'nat-input correct';
      } else if (this.answers[this.currentIndex] !== undefined) {
        natInput.className = 'nat-input incorrect';
      }
    } else {
      this.renderOptions(q);
    }
  },

  showExplanation() {
    const q = this.questions[this.currentIndex];
    if (!q || !q.explanation) return;
    const box = document.getElementById('explanationBox');
    box.innerHTML = `<div class="explanation-header">💡 Explanation</div>
      <div class="explanation-text">${Utils.formatQuestion(q.explanation)}</div>
      ${q.type === 'NAT' ? `<div style="margin-top:8px;font-weight:600;color:var(--color-success)">Correct Answer: ${q.correct}</div>` : ''}`;
    box.classList.remove('hidden');
  },

  recordCurrentAnswer() {
    const q = this.questions[this.currentIndex];
    if (!q) return;
    const userAnswer = this.answers[this.currentIndex];
    if (userAnswer === undefined) return;
    let isCorrect = false;
    if (q.type === 'NAT') {
      isCorrect = Math.abs(parseFloat(userAnswer) - parseFloat(q.correct)) < 0.01;
    } else if (q.type === 'MSQ') {
      const correct = Array.isArray(q.correct) ? q.correct.sort() : [q.correct];
      const user = Array.isArray(userAnswer) ? userAnswer.sort() : [userAnswer];
      isCorrect = JSON.stringify(correct) === JSON.stringify(user);
    } else {
      isCorrect = userAnswer === q.correct;
    }
    const subject = q.subject ? DataLoader.getAllSubjects().find(s => s.name === q.subject)?.slug || this.config.subject : this.config.subject;
    const topicSlug = this.config.topic || 'mixed';
    Storage.recordAnswer(subject, topicSlug, q.id, isCorrect);
  },

  navigate(direction) {
    this.saveCurrentQuestionTime();
    if (direction === 'next' && this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this.renderQuestion();
    } else if (direction === 'prev' && this.currentIndex > 0) {
      this.currentIndex--;
      this.renderQuestion();
    }
  },

  goToQuestion(index) {
    if (index < 0 || index >= this.questions.length) return;
    this.saveCurrentQuestionTime();
    this.currentIndex = index;
    this.renderQuestion();
  },

  saveCurrentQuestionTime() {
    const start = this.questionStartTimes[this.currentIndex];
    if (start) {
      const elapsed = (Date.now() - start) / 1000;
      this.questionTimes[this.currentIndex] = (this.questionTimes[this.currentIndex] || 0) + elapsed;
    }
  },

  toggleMarkForReview() {
    if (this.markedForReview.has(this.currentIndex)) {
      this.markedForReview.delete(this.currentIndex);
    } else {
      this.markedForReview.add(this.currentIndex);
    }
    this.renderQuestion();
  },

  clearResponse() {
    if (this.isSubmitted || this.mode === 'review') return;
    this.answers[this.currentIndex] = undefined;
    this.renderQuestion();
    this.updateSummaryStats();
  },

  toggleBookmark() {
    const q = this.questions[this.currentIndex];
    if (!q) return;
    const subject = this.config.subject;
    const topic = this.config.topic || 'mixed';
    const result = Storage.toggleBookmark(subject, topic, q.id);
    Utils.showToast(result ? 'Question bookmarked!' : 'Bookmark removed', result ? 'success' : 'info');
    const bmBtn = document.getElementById('bookmarkBtn');
    if (bmBtn) {
      bmBtn.textContent = result ? '🔖' : '🏷️';
    }
  },

  renderNavGrid() {
    const grid = document.getElementById('questionGrid');
    if (!grid) return;
    grid.innerHTML = this.questions.map((_, i) => {
      let cls = 'question-grid-btn';
      if (i === this.currentIndex) cls += ' current';
      else if (this.answers[i] !== undefined && this.markedForReview.has(i)) cls += ' answered-marked';
      else if (this.answers[i] !== undefined) cls += ' answered';
      else if (this.markedForReview.has(i)) cls += ' marked';
      else if (this.visitedQuestions.has(i)) cls += '';
      else cls += ' not-visited';
      return `<button class="${cls}" onclick="QuizEngine.goToQuestion(${i})">${i + 1}</button>`;
    }).join('');
  },

  updateProgress() {
    const pct = ((this.currentIndex + 1) / this.questions.length) * 100;
    const bar = document.getElementById('quizProgressFill');
    if (bar) bar.style.width = `${pct}%`;
    const text = document.getElementById('quizProgressText');
    if (text) text.innerHTML = `Question <strong>${this.currentIndex + 1}</strong> of <strong>${this.questions.length}</strong>`;
  },

  updateSummaryStats() {
    const answered = Object.keys(this.answers).filter(k => this.answers[k] !== undefined).length;
    const unanswered = this.questions.length - answered;
    const marked = this.markedForReview.size;
    const el = id => document.getElementById(id);
    if (el('statAnswered')) el('statAnswered').textContent = answered;
    if (el('statUnanswered')) el('statUnanswered').textContent = unanswered;
    if (el('statMarked')) el('statMarked').textContent = marked;
  },

  showSubmitConfirm() {
    const answered = Object.keys(this.answers).filter(k => this.answers[k] !== undefined).length;
    const unanswered = this.questions.length - answered;
    const marked = this.markedForReview.size;
    Utils.createModal('Submit Quiz?',
      `<div class="summary-grid">
        <div class="summary-card"><div class="summary-card-value" style="color:var(--color-success)">${answered}</div><div class="summary-card-label">Answered</div></div>
        <div class="summary-card"><div class="summary-card-value" style="color:var(--color-text-muted)">${unanswered}</div><div class="summary-card-label">Unanswered</div></div>
        <div class="summary-card"><div class="summary-card-value" style="color:var(--color-warning)">${marked}</div><div class="summary-card-label">Marked</div></div>
      </div>
      ${unanswered > 0 ? '<p style="color:var(--color-warning);text-align:center;font-size:14px">⚠️ You have unanswered questions!</p>' : ''}`,
      `<button class="btn btn-outline" onclick="Utils.closeModal(this)">Cancel</button>
       <button class="btn btn-primary" onclick="QuizEngine.submitQuiz();Utils.closeModal(this)">Submit</button>`
    );
  },

  autoSubmit() {
    Utils.showToast('Time is up! Submitting quiz...', 'warning');
    this.submitQuiz();
  },

  submitQuiz() {
    this.saveCurrentQuestionTime();
    this.isSubmitted = true;
    Timer.stop();

    // Calculate score
    const results = Scoring.calculate(this.questions, this.answers);
    const totalTime = (Date.now() - this.startTime) / 1000;

    // Record all answers
    this.questions.forEach((q, i) => {
      if (this.answers[i] !== undefined) {
        this.recordAnswerByIndex(i);
      }
    });

    // Save test result
    Storage.saveTestResult({
      type: this.mode,
      config: this.config,
      questions: this.questions.map(q => q.id),
      answers: this.answers,
      score: results.score,
      maxScore: results.maxScore,
      correct: results.correct,
      wrong: results.wrong,
      skipped: results.skipped,
      timeTaken: totalTime,
      perQuestionTime: this.questionTimes
    });

    // Store results for results page
    sessionStorage.setItem('lastQuizResults', JSON.stringify({
      questions: this.questions,
      answers: this.answers,
      results,
      timeTaken: totalTime,
      questionTimes: this.questionTimes,
      config: this.config
    }));

    // Navigate to results or show inline
    window.location.href = `../results.html`;
  },

  recordAnswerByIndex(index) {
    const q = this.questions[index];
    const userAnswer = this.answers[index];
    if (!q || userAnswer === undefined) return;
    let isCorrect = false;
    if (q.type === 'NAT') {
      isCorrect = Math.abs(parseFloat(userAnswer) - parseFloat(q.correct)) < 0.01;
    } else if (q.type === 'MSQ') {
      const correct = (Array.isArray(q.correct) ? q.correct : [q.correct]).sort();
      const user = (Array.isArray(userAnswer) ? userAnswer : [userAnswer]).sort();
      isCorrect = JSON.stringify(correct) === JSON.stringify(user);
    } else {
      isCorrect = userAnswer === q.correct;
    }
    Storage.recordAnswer(this.config.subject, this.config.topic || 'mixed', q.id, isCorrect);
  },

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.key.toLowerCase()) {
        case 'a': this.selectOption('A'); break;
        case 'b': this.selectOption('B'); break;
        case 'c': this.selectOption('C'); break;
        case 'd': this.selectOption('D'); break;
        case 'n': case 'arrowright': this.navigate('next'); break;
        case 'p': case 'arrowleft': this.navigate('prev'); break;
        case 'm': this.toggleMarkForReview(); break;
        case 's': e.preventDefault(); this.navigate('next'); break;
        case ' ': e.preventDefault(); this.clearResponse(); break;
      }
    });
  }
};

function initQuizEngine() { QuizEngine.init(); }
