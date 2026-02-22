/* ============================================
   Utility Functions
   ============================================ */

const Utils = {
  generateId() {
    return (
      "id_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).substr(2, 9)
    );
  },

  formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  },

  formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  },

  formatTimerDisplay(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const pad = (n) => n.toString().padStart(2, "0");
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  },

  shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  },

  setQueryParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.replaceState({}, "", url);
  },

  truncate(str, len = 80) {
    return str.length > len ? str.substring(0, len) + "..." : str;
  },

  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  },

  showToast(message, type = "info", duration = 3000) {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-message">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  createModal(title, content, actions) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">${content}</div>
        ${actions ? `<div class="modal-footer">${actions}</div>` : ""}
      </div>
    `;
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("active"));
    return overlay;
  },

  closeModal(el) {
    const overlay = el.closest(".modal-overlay");
    if (overlay) {
      overlay.classList.remove("active");
      setTimeout(() => overlay.remove(), 200);
    }
  },

  highlightCode(code) {
    if (!code) return "";
    let html = Utils.escapeHtml(code);
    // Python keywords
    const keywords = [
      "def",
      "class",
      "return",
      "if",
      "elif",
      "else",
      "for",
      "while",
      "in",
      "not",
      "and",
      "or",
      "is",
      "None",
      "True",
      "False",
      "import",
      "from",
      "as",
      "try",
      "except",
      "finally",
      "raise",
      "with",
      "yield",
      "lambda",
      "pass",
      "break",
      "continue",
      "del",
      "global",
      "nonlocal",
      "assert",
    ];
    const builtins = [
      "print",
      "len",
      "range",
      "int",
      "str",
      "float",
      "list",
      "dict",
      "set",
      "tuple",
      "type",
      "isinstance",
      "sorted",
      "enumerate",
      "zip",
      "map",
      "filter",
      "sum",
      "min",
      "max",
      "abs",
      "round",
      "input",
      "open",
      "super",
      "property",
      "staticmethod",
      "classmethod",
    ];
    // Comments
    html = html.replace(/(#.*)$/gm, '<span class="token-comment">$1</span>');
    // Strings (triple and single/double)
    html = html.replace(
      /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
      '<span class="token-string">$1</span>',
    );
    // Numbers
    html = html.replace(
      /\b(\d+\.?\d*)\b/g,
      '<span class="token-number">$1</span>',
    );
    // Decorators
    html = html.replace(/(@\w+)/g, '<span class="token-decorator">$1</span>');
    // self
    html = html.replace(/\b(self)\b/g, '<span class="token-self">$1</span>');
    // Keywords
    keywords.forEach((kw) => {
      html = html.replace(
        new RegExp(`\\b(${kw})\\b`, "g"),
        '<span class="token-keyword">$1</span>',
      );
    });
    // Builtins
    builtins.forEach((b) => {
      html = html.replace(
        new RegExp(`\\b(${b})\\b(?=\\s*\\()`, "g"),
        '<span class="token-builtin">$1</span>',
      );
    });
    // Function defs
    html = html.replace(
      /(?<=def\s+)(\w+)/g,
      '<span class="token-function">$1</span>',
    );
    // Class defs
    html = html.replace(
      /(?<=class\s+)(\w+)/g,
      '<span class="token-class">$1</span>',
    );
    return html;
  },

  renderCodeBlock(code, lang = "python") {
    if (!code) return "";
    const lines = code.split("\n");
    const lineNums = lines.map((_, i) => `<span>${i + 1}</span>`).join("");
    const highlighted = Utils.highlightCode(code);
    const codeLines = highlighted
      .split("\n")
      .map((l) => `<div class="line">${l || " "}</div>`)
      .join("");
    return `<div class="code-block">
      <div class="code-block-header">
        <span class="code-block-lang">${lang}</span>
        <button class="code-copy-btn" onclick="Utils.copyCode(this)">Copy</button>
      </div>
      <div class="code-content">
        <div class="code-line-numbers">${lineNums}</div>
        <div class="code-lines">${codeLines}</div>
      </div>
    </div>`;
  },

  copyCode(btn) {
    const codeBlock = btn.closest(".code-block");
    const lines = codeBlock.querySelector(".code-lines");
    const text = lines.textContent;
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = "Copied!";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = "Copy";
        btn.classList.remove("copied");
      }, 2000);
    });
  },

  formatQuestion(text) {
    if (!text) return "";
    let html = Utils.escapeHtml(text);
    html = html.replace(/\n/g, "<br>");
    html = html.replace(/•/g, '<span style="margin-right:4px">•</span>');
    return html;
  },
};
