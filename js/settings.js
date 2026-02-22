/* Settings page logic */
function initSettings() {
  const s = Storage.getSettings();
  const el = id => document.getElementById(id);
  if (el('showAnswerImmediate')) el('showAnswerImmediate').checked = s.showAnswerImmediate;
  if (el('showExplanationImmediate')) el('showExplanationImmediate').checked = s.showExplanationImmediate;
  if (el('shuffleQuestions')) el('shuffleQuestions').checked = s.shuffleQuestions;
  if (el('shuffleOptions')) el('shuffleOptions').checked = s.shuffleOptions;
  if (el('dailyGoal')) { el('dailyGoal').value = s.dailyGoal || 20; el('dailyGoalVal').textContent = s.dailyGoal || 20; }
  if (s.markingScheme) {
    if (el('mcqCorrect')) el('mcqCorrect').value = s.markingScheme.mcqCorrect;
    if (el('mcqWrong')) el('mcqWrong').value = s.markingScheme.mcqWrong;
    if (el('msqCorrect')) el('msqCorrect').value = s.markingScheme.msqCorrect;
    if (el('msqWrong')) el('msqWrong').value = s.markingScheme.msqWrong;
    if (el('natCorrect')) el('natCorrect').value = s.markingScheme.natCorrect;
    if (el('natWrong')) el('natWrong').value = s.markingScheme.natWrong;
  }
  // Highlight active theme
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.getAttribute('data-theme-opt') === s.theme);
  });
}

function changeTheme(theme) {
  Theme.apply(theme);
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.getAttribute('data-theme-opt') === theme);
  });
}

function saveSetting(key, value) {
  Storage.updateSettings({ [key]: value });
  Utils.showToast('Setting saved', 'success');
}

function saveMarking() {
  const el = id => parseFloat(document.getElementById(id)?.value || 0);
  Storage.updateSettings({ markingScheme: { mcqCorrect: el('mcqCorrect'), mcqWrong: el('mcqWrong'), msqCorrect: el('msqCorrect'), msqWrong: el('msqWrong'), msqPartial: true, msqPartialValue: 1, natCorrect: el('natCorrect'), natWrong: el('natWrong') }});
  Utils.showToast('Marking scheme saved', 'success');
}

function importData(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    if (Storage.importData(e.target.result)) { Utils.showToast('Data imported successfully!', 'success'); location.reload(); }
    else Utils.showToast('Invalid data file', 'error');
  };
  reader.readAsText(file);
}

function confirmReset() {
  Utils.createModal('Reset All Progress?', '<p>This will permanently delete all your progress, bookmarks, and test history. This cannot be undone.</p>',
    `<button class="btn btn-outline" onclick="Utils.closeModal(this)">Cancel</button><button class="btn btn-danger" onclick="Storage.resetAll();Utils.showToast('All data reset','success');Utils.closeModal(this);setTimeout(()=>location.reload(),500)">Reset Everything</button>`);
}
