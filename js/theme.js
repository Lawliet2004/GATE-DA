/* Theme Management */
const Theme = {
  init() {
    const settings = Storage.getSettings();
    this.apply(settings.theme || 'light');
    const btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', () => this.toggle());
  },

  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : theme === 'blue' ? '🌊' : theme === 'green' ? '🌿' : '🌙';
    Storage.updateSettings({ theme });
  },

  toggle() {
    const themes = ['light', 'dark', 'blue', 'green'];
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = themes[(themes.indexOf(current) + 1) % themes.length];
    this.apply(next);
  },

  get() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }
};
