/* Results page logic */
function initResults() {
  const data = sessionStorage.getItem('lastQuizResults');
  if (!data) {
    document.querySelector('.page-content').innerHTML = '<div class="container"><div class="empty-state"><div class="empty-state-icon">📭</div><h3>No results to display</h3><p>Complete a quiz to see your results here.</p><a href="index.html" class="btn btn-primary">Go Home</a></div></div>';
    return;
  }
  const { questions, answers, results, timeTaken, questionTimes, config } = JSON.parse(data);
  renderResultsHero(results, timeTaken);
  renderQuestionReview(questions, answers, results);
}

function renderResultsHero(results, timeTaken) {
  const pct = results.maxScore > 0 ? Math.round((results.score / results.maxScore) * 100) : 0;
  const hero = document.getElementById('resultsHero');
  if (!hero) return;
  hero.innerHTML = `
    <div class="results-score-circle">
      <div class="results-score-value">${results.score}</div>
      <div class="results-score-label">out of ${results.maxScore}</div>
    </div>
    <div class="results-score-percent">${pct}%</div>
    <div class="results-summary-cards">
      <div class="results-summary-card"><div class="results-summary-card-value correct">${results.correct}</div><div class="results-summary-card-label">Correct</div></div>
      <div class="results-summary-card"><div class="results-summary-card-value incorrect">${results.wrong}</div><div class="results-summary-card-label">Wrong</div></div>
      <div class="results-summary-card"><div class="results-summary-card-value skipped">${results.skipped}</div><div class="results-summary-card-label">Skipped</div></div>
      <div class="results-summary-card"><div class="results-summary-card-value" style="color:var(--color-info)">${Utils.formatTime(timeTaken)}</div><div class="results-summary-card-label">Time Taken</div></div>
    </div>`;
}

function renderQuestionReview(questions, answers) {
  const container = document.getElementById('reviewList');
  if (!container) return;
  container.innerHTML = questions.map((q, i) => {
    const userAnswer = answers[i];
    let isCorrect = false;
    if (userAnswer === undefined) { /* skipped */ }
    else if (q.type === 'NAT') { isCorrect = Math.abs(parseFloat(userAnswer) - parseFloat(q.correct)) < 0.01; }
    else if (q.type === 'MSQ') { const c = (Array.isArray(q.correct) ? q.correct : [q.correct]).sort(); const u = (Array.isArray(userAnswer) ? userAnswer : [userAnswer]).sort(); isCorrect = JSON.stringify(c) === JSON.stringify(u); }
    else { isCorrect = userAnswer === q.correct; }
    const status = userAnswer === undefined ? 'skipped' : isCorrect ? 'correct' : 'incorrect';
    const icon = status === 'correct' ? '✓' : status === 'incorrect' ? '✗' : '—';
    return `<div class="review-item" onclick="this.classList.toggle('expanded')">
      <div class="review-item-header">
        <div class="review-item-left">
          <div class="review-item-status ${status}">${icon}</div>
          <div><div class="review-item-question">Q${i+1}: ${Utils.truncate(q.question, 60)}</div>
          <div class="review-item-meta"><span>${q.type}</span><span>${q.difficulty}</span></div></div>
        </div>
      </div>
      <div class="review-item-body">
        <div class="question-text" style="font-size:14px;margin-bottom:12px">${Utils.formatQuestion(q.question)}</div>
        ${q.code ? Utils.renderCodeBlock(q.code) : ''}
        ${q.options ? q.options.map((opt, j) => {
          const letter = ['A','B','C','D'][j];
          const isCorr = Array.isArray(q.correct) ? q.correct.includes(letter) : q.correct === letter;
          const isSel = Array.isArray(userAnswer) ? userAnswer.includes(letter) : userAnswer === letter;
          let cls = '';
          if (isCorr) cls = 'correct';
          if (isSel && !isCorr) cls = 'incorrect';
          return `<div class="option-item ${cls}" style="cursor:default;margin-bottom:4px"><span class="option-letter">${letter}</span><span class="option-text">${opt}</span></div>`;
        }).join('') : `<p><strong>Your Answer:</strong> ${userAnswer || 'Not answered'} | <strong>Correct:</strong> ${q.correct}</p>`}
        <div class="explanation-box" style="display:block"><div class="explanation-header">💡 Explanation</div><div class="explanation-text">${Utils.formatQuestion(q.explanation || 'No explanation available.')}</div></div>
      </div>
    </div>`;
  }).join('');
}
