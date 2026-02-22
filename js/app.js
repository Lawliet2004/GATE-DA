/* ============================================
   Main App Initialization
   ============================================ */

// Initialize app on every page
document.addEventListener('DOMContentLoaded', () => {
  Storage.init();
  Theme.init();
  initPage();
});

function initPage() {
  const page = getPageName();
  switch (page) {
    case 'index': initHomePage(); break;
    case 'dashboard': if (typeof initDashboard === 'function') initDashboard(); break;
    case 'settings': if (typeof initSettings === 'function') initSettings(); break;
    case 'quiz-engine': if (typeof initQuizEngine === 'function') initQuizEngine(); break;
    case 'test-series': if (typeof initTestSeries === 'function') initTestSeries(); break;
    case 'custom-test': if (typeof initCustomTest === 'function') initCustomTest(); break;
    case 'results': if (typeof initResults === 'function') initResults(); break;
    case 'bookmarks': if (typeof initBookmarks === 'function') initBookmarks(); break;
    case 'review': if (typeof initReview === 'function') initReview(); break;
    default:
      if (page && typeof initChapterPage === 'function') initChapterPage(page);
  }
}

function getPageName() {
  const path = window.location.pathname;
  const file = path.split('/').pop().replace('.html', '');
  if (!file || file === '' || file === 'index') return 'index';
  return file;
}

/* === Home Page === */
function initHomePage() {
  renderSubjectCards();
  renderHomeStats();
  renderRecentActivity();
}

function renderSubjectCards() {
  const grid = document.getElementById('subjectsGrid');
  if (!grid) return;
  const subjects = DataLoader.getAllSubjects();
  grid.innerHTML = subjects.map((subj, i) => {
    const stats = Storage.getSubjectStats(subj.slug);
    const total = subj.questions;
    const pct = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;
    const progressPct = Math.round((stats.attempted / total) * 100);
    return `
      <a href="chapters/${subj.slug}.html" class="subject-card animate-slide-up stagger-${i + 1}" data-subject="${subj.slug}">
        <div class="subject-card-icon">${subj.icon}</div>
        <h3>${subj.name}</h3>
        <p class="subject-card-desc">${total} questions · ${subj.topics.length} topics</p>
        <div class="subject-card-meta">
          <span class="subject-card-count">${stats.attempted}/${total} done</span>
          <div class="subject-card-progress">
            <div class="progress-bar"><div class="progress-bar-fill" style="width:${progressPct}%"></div></div>
            <span class="subject-card-score">${pct > 0 ? pct + '%' : '—'}</span>
          </div>
        </div>
      </a>`;
  }).join('');
}

function renderHomeStats() {
  const stats = Storage.getTotalStats();
  const streak = Storage.getStreak();
  const el = id => document.getElementById(id);
  if (el('questionsAttempted')) el('questionsAttempted').textContent = stats.attempted;
  if (el('accuracyRate')) el('accuracyRate').textContent = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) + '%' : '—';
  if (el('streakCount')) el('streakCount').textContent = streak.currentStreak;
}

function renderRecentActivity() {
  const history = Storage.getTestHistory();
  const list = document.getElementById('activityList');
  const empty = document.getElementById('emptyActivity');
  if (!list) return;
  if (history.length === 0) return;
  if (empty) empty.style.display = 'none';
  const recent = history.slice(-5).reverse();
  list.innerHTML = recent.map(test => {
    const pct = test.maxScore > 0 ? Math.round((test.score / test.maxScore) * 100) : 0;
    const cls = pct >= 70 ? 'good' : pct >= 40 ? 'average' : 'poor';
    return `
      <div class="activity-item">
        <div class="activity-icon quiz">📝</div>
        <div class="activity-content">
          <div class="activity-title">${test.type || 'Quiz'} — ${test.config?.subject || 'Mixed'}</div>
          <div class="activity-meta">${Utils.formatDate(test.date)} · ${test.questions?.length || 0} questions · ${Utils.formatTime(test.timeTaken || 0)}</div>
        </div>
        <div class="activity-score test-item-score ${cls}">${pct}%</div>
      </div>`;
  }).join('');
}

/* === Quick Actions === */
function startRandomQuiz() {
  const subjects = Object.keys(DataLoader.subjectMap);
  const randSubj = subjects[Math.floor(Math.random() * subjects.length)];
  const info = DataLoader.subjectMap[randSubj];
  const randTopic = info.topics[Math.floor(Math.random() * info.topics.length)];
  window.location.href = `quiz/quiz-engine.html?subject=${randSubj}&topic=${randTopic}&mode=practice&count=20`;
}

function continueLast() {
  const history = Storage.getTestHistory();
  if (history.length > 0) {
    const last = history[history.length - 1];
    Utils.showToast('Continuing with a new quiz in the same topic', 'info');
    if (last.config?.subject && last.config?.topic) {
      window.location.href = `quiz/quiz-engine.html?subject=${last.config.subject}&topic=${last.config.topic}&mode=practice&count=20`;
      return;
    }
  }
  startRandomQuiz();
}

function handleSearch(event) {
  if (event.key === 'Enter') {
    const q = event.target.value.trim();
    if (q) window.location.href = `bookmarks.html?search=${encodeURIComponent(q)}`;
  }
}

/* === Chapter Page Init (used by chapter HTML files) === */
function initChapterPage(slug) {
  const subjectSlug = slug;
  const info = DataLoader.getSubjectInfo(subjectSlug);
  if (!info) return;
  renderTopicList(subjectSlug, info);
}

function renderTopicList(subjectSlug, info) {
  const container = document.getElementById('topicsList');
  if (!container) return;
  container.innerHTML = info.topics.map(topic => {
    const name = DataLoader.getTopicName(topic);
    const progress = Storage.getProgress(subjectSlug, topic);
    const attempted = (progress.attempted || []).length;
    return `
      <div class="topic-card" id="topic-${topic}">
        <div class="topic-card-header" onclick="toggleTopic('${topic}')">
          <div class="topic-card-left">
            <div class="topic-icon" style="background:var(--color-primary-light);color:var(--color-primary)">📖</div>
            <div>
              <div class="topic-name">${name}</div>
              <div class="topic-subtitle">${attempted} attempted</div>
            </div>
          </div>
          <div class="topic-card-right">
            <span class="topic-expand-icon">▼</span>
          </div>
        </div>
        <div class="topic-card-body">
          <div class="topic-actions">
            <a href="../quiz/quiz-engine.html?subject=${subjectSlug}&topic=${topic}&mode=practice&count=20" class="btn btn-primary btn-sm">Practice (20 Qs)</a>
            <a href="../quiz/quiz-engine.html?subject=${subjectSlug}&topic=${topic}&mode=test&count=20" class="btn btn-outline btn-sm">Test Mode</a>
            <a href="../quiz/quiz-engine.html?subject=${subjectSlug}&topic=${topic}&mode=practice&count=all" class="btn btn-ghost btn-sm">All Questions</a>
          </div>
        </div>
      </div>`;
  }).join('');
}

function toggleTopic(topic) {
  const card = document.getElementById(`topic-${topic}`);
  if (card) card.classList.toggle('expanded');
}
