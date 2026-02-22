/* ============================================
   LocalStorage Management
   ============================================ */

const Storage = {
  KEY: 'gateDAQuiz',

  _getData() {
    try {
      const data = localStorage.getItem(this.KEY);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },

  _setData(data) {
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch (e) { console.error('Storage error:', e); }
  },

  init() {
    if (!this._getData()) {
      this._setData({
        settings: this.getDefaultSettings(),
        progress: {},
        testHistory: [],
        dailyStreak: { currentStreak: 0, longestStreak: 0, lastActiveDate: null, activeDates: [] },
        reports: [],
        bookmarks: {},
        notes: {}
      });
    }
    this.updateStreak();
  },

  getDefaultSettings() {
    return {
      theme: 'light',
      fontSize: 'medium',
      fontFamily: 'system',
      quizMode: 'practice',
      timerEnabled: false,
      timerDuration: 60,
      autoAdvance: false,
      showAnswerImmediate: true,
      showExplanationImmediate: true,
      shuffleQuestions: false,
      shuffleOptions: false,
      markingScheme: {
        mcqCorrect: 2, mcqWrong: -0.67,
        msqCorrect: 2, msqPartial: true, msqPartialValue: 1, msqWrong: 0,
        natCorrect: 2, natWrong: 0
      },
      dailyGoal: 20,
      highContrast: false,
      reduceAnimations: false,
      compactSpacing: false
    };
  },

  getSettings() {
    const data = this._getData();
    return data ? { ...this.getDefaultSettings(), ...data.settings } : this.getDefaultSettings();
  },

  updateSettings(updates) {
    const data = this._getData();
    if (data) { data.settings = { ...data.settings, ...updates }; this._setData(data); }
  },

  getProgress(subject, topic) {
    const data = this._getData();
    if (!data || !data.progress) return { attempted: [], correct: [], wrong: [], bookmarked: [] };
    if (subject && topic) return data.progress[subject]?.[topic] || { attempted: [], correct: [], wrong: [], bookmarked: [] };
    if (subject) return data.progress[subject] || {};
    return data.progress;
  },

  recordAnswer(subject, topic, questionId, isCorrect) {
    const data = this._getData();
    if (!data) return;
    if (!data.progress[subject]) data.progress[subject] = {};
    if (!data.progress[subject][topic]) data.progress[subject][topic] = { attempted: [], correct: [], wrong: [], bookmarked: [] };
    const tp = data.progress[subject][topic];
    if (!tp.attempted.includes(questionId)) tp.attempted.push(questionId);
    if (isCorrect) {
      if (!tp.correct.includes(questionId)) tp.correct.push(questionId);
      tp.wrong = tp.wrong.filter(id => id !== questionId);
    } else {
      if (!tp.wrong.includes(questionId)) tp.wrong.push(questionId);
      tp.correct = tp.correct.filter(id => id !== questionId);
    }
    this._setData(data);
    this.updateStreak();
  },

  toggleBookmark(subject, topic, questionId) {
    const data = this._getData();
    if (!data) return false;
    if (!data.bookmarks) data.bookmarks = {};
    const key = `${subject}::${topic}::${questionId}`;
    if (data.bookmarks[key]) {
      delete data.bookmarks[key];
      this._setData(data);
      return false;
    }
    data.bookmarks[key] = { date: new Date().toISOString(), subject, topic, questionId };
    this._setData(data);
    return true;
  },

  isBookmarked(subject, topic, questionId) {
    const data = this._getData();
    return data?.bookmarks?.[`${subject}::${topic}::${questionId}`] ? true : false;
  },

  getAllBookmarks() {
    const data = this._getData();
    return data?.bookmarks ? Object.values(data.bookmarks) : [];
  },

  saveNote(questionId, note) {
    const data = this._getData();
    if (!data) return;
    if (!data.notes) data.notes = {};
    data.notes[questionId] = note;
    this._setData(data);
  },

  getNote(questionId) {
    const data = this._getData();
    return data?.notes?.[questionId] || '';
  },

  saveTestResult(result) {
    const data = this._getData();
    if (!data) return;
    data.testHistory.push({ ...result, id: Utils.generateId(), date: new Date().toISOString() });
    this._setData(data);
  },

  getTestHistory() {
    const data = this._getData();
    return data?.testHistory || [];
  },

  updateStreak() {
    const data = this._getData();
    if (!data) return;
    const today = new Date().toISOString().split('T')[0];
    if (!data.dailyStreak) data.dailyStreak = { currentStreak: 0, longestStreak: 0, lastActiveDate: null, activeDates: [] };
    const streak = data.dailyStreak;
    if (streak.lastActiveDate === today) { this._setData(data); return; }
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (streak.lastActiveDate === yesterday) {
      streak.currentStreak++;
    } else if (streak.lastActiveDate !== today) {
      streak.currentStreak = 1;
    }
    streak.lastActiveDate = today;
    if (!streak.activeDates.includes(today)) streak.activeDates.push(today);
    if (streak.currentStreak > streak.longestStreak) streak.longestStreak = streak.currentStreak;
    this._setData(data);
  },

  getStreak() {
    const data = this._getData();
    return data?.dailyStreak || { currentStreak: 0, longestStreak: 0, activeDates: [] };
  },

  getTotalStats() {
    const data = this._getData();
    if (!data || !data.progress) return { attempted: 0, correct: 0, wrong: 0 };
    let attempted = 0, correct = 0, wrong = 0;
    for (const subj of Object.values(data.progress)) {
      for (const topic of Object.values(subj)) {
        attempted += (topic.attempted || []).length;
        correct += (topic.correct || []).length;
        wrong += (topic.wrong || []).length;
      }
    }
    return { attempted, correct, wrong };
  },

  getSubjectStats(subject) {
    const data = this._getData();
    if (!data?.progress?.[subject]) return { attempted: 0, correct: 0, wrong: 0 };
    let attempted = 0, correct = 0, wrong = 0;
    for (const topic of Object.values(data.progress[subject])) {
      attempted += (topic.attempted || []).length;
      correct += (topic.correct || []).length;
      wrong += (topic.wrong || []).length;
    }
    return { attempted, correct, wrong };
  },

  getAllWrongQuestions() {
    const data = this._getData();
    if (!data?.progress) return [];
    const wrong = [];
    for (const [subj, topics] of Object.entries(data.progress)) {
      for (const [topic, tp] of Object.entries(topics)) {
        for (const qid of (tp.wrong || [])) {
          wrong.push({ subject: subj, topic, questionId: qid });
        }
      }
    }
    return wrong;
  },

  exportData() {
    const data = this._getData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `gate-da-quiz-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importData(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (data.settings && data.progress) { this._setData(data); return true; }
      return false;
    } catch { return false; }
  },

  resetAll() {
    localStorage.removeItem(this.KEY);
    this.init();
  },

  resetSubject(subject) {
    const data = this._getData();
    if (data?.progress?.[subject]) { delete data.progress[subject]; this._setData(data); }
  }
};
