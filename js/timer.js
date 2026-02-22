/* Timer */
const Timer = {
  remaining: 0, interval: null, callback: null,
  start(seconds, onEnd) {
    this.remaining = seconds; this.callback = onEnd; this.update();
    this.interval = setInterval(() => {
      this.remaining--;
      this.update();
      if (this.remaining <= 0) { this.stop(); if (this.callback) this.callback(); }
    }, 1000);
  },
  stop() { if (this.interval) { clearInterval(this.interval); this.interval = null; } },
  update() {
    const el = document.getElementById('timerDisplay');
    if (!el) return;
    el.textContent = Utils.formatTimerDisplay(this.remaining);
    const container = document.getElementById('quizTimer');
    if (container) {
      container.classList.remove('warning', 'danger');
      if (this.remaining <= 60) container.classList.add('danger');
      else if (this.remaining <= 300) container.classList.add('warning');
    }
  }
};
