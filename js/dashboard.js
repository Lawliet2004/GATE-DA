/* Dashboard logic */
function initDashboard() {
  renderDashboardStats();
  renderStreak();
  renderSubjectProgress();
  renderRecentTests();
}

function renderDashboardStats() {
  const stats = Storage.getTotalStats();
  const accuracy = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;
  const history = Storage.getTestHistory();
  const totalTime = history.reduce((sum, t) => sum + (t.timeTaken || 0), 0);
  const el = document.getElementById('dashboardStats');
  if (!el) return;
  el.innerHTML = `
    <div class="dashboard-stat-card primary"><div class="dashboard-stat-icon">📝</div><div class="dashboard-stat-value">${stats.attempted}</div><div class="dashboard-stat-label">Questions Attempted</div></div>
    <div class="dashboard-stat-card success"><div class="dashboard-stat-icon">✅</div><div class="dashboard-stat-value">${accuracy}%</div><div class="dashboard-stat-label">Accuracy Rate</div></div>
    <div class="dashboard-stat-card warning"><div class="dashboard-stat-icon">⏱️</div><div class="dashboard-stat-value">${Utils.formatTime(totalTime)}</div><div class="dashboard-stat-label">Total Time Spent</div></div>
    <div class="dashboard-stat-card info"><div class="dashboard-stat-icon">📊</div><div class="dashboard-stat-value">${history.length}</div><div class="dashboard-stat-label">Tests Completed</div></div>`;
}

function renderStreak() {
  const streak = Storage.getStreak();
  const el = document.getElementById('streakValue');
  if (el) el.textContent = streak.currentStreak;
  const settings = Storage.getSettings();
  const goal = settings.dailyGoal || 20;
  const today = new Date().toISOString().split('T')[0];
  const history = Storage.getTestHistory();
  const todayQuestions = history.filter(t => t.date && t.date.startsWith(today)).reduce((sum, t) => sum + (t.questions?.length || 0), 0);
  const goalText = document.getElementById('dailyGoalText');
  if (goalText) goalText.innerHTML = `<strong>${todayQuestions}</strong> / ${goal} questions`;
  const goalFill = document.getElementById('dailyGoalFill');
  if (goalFill) goalFill.style.width = Math.min(100, (todayQuestions / goal) * 100) + '%';
}

function renderSubjectProgress() {
  const grid = document.getElementById('subjectProgressGrid');
  if (!grid) return;
  const subjects = DataLoader.getAllSubjects();
  grid.innerHTML = subjects.map(subj => {
    const stats = Storage.getSubjectStats(subj.slug);
    const pct = Math.round((stats.attempted / subj.questions) * 100);
    const accuracy = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;
    return `<div class="subject-progress-card">
      <div style="font-size:28px">${subj.icon}</div>
      <div class="subject-progress-info"><div class="subject-progress-name">${subj.name}</div>
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
        <div class="subject-progress-stats"><span>${stats.attempted}/${subj.questions} done</span><span>Accuracy: ${accuracy}%</span></div>
      </div>
      <div class="subject-progress-percent">${pct}%</div>
    </div>`;
  }).join('');
}

function renderRecentTests() {
  const list = document.getElementById('recentTestsList');
  if (!list) return;
  const history = Storage.getTestHistory().slice(-10).reverse();
  if (history.length === 0) { list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><h3>No tests yet</h3><p>Complete a quiz to see your history here.</p></div>'; return; }
  list.innerHTML = history.map(test => {
    const pct = test.maxScore > 0 ? Math.round((test.score / test.maxScore) * 100) : 0;
    const cls = pct >= 70 ? 'good' : pct >= 40 ? 'average' : 'poor';
    return `<div class="test-item"><div class="test-item-info"><div class="test-item-title">${test.type || 'Quiz'}</div><div class="test-item-meta">${Utils.formatDate(test.date)} · ${test.questions?.length || 0} Qs · ${Utils.formatTime(test.timeTaken || 0)}</div></div><div class="test-item-score ${cls}">${pct}%</div></div>`;
  }).join('');
}
