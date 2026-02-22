/* Bookmarks page logic */
function initBookmarks() {
  const bookmarks = Storage.getAllBookmarks();
  const list = document.getElementById('bookmarksList');
  if (!list) return;
  if (bookmarks.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔖</div><h3>No bookmarks yet</h3><p>Bookmark questions during quizzes to review them later.</p><a href="index.html" class="btn btn-primary">Start a Quiz</a></div>';
    return;
  }
  list.innerHTML = bookmarks.map(bm => {
    const topicName = DataLoader.getTopicName(bm.topic);
    const subjectInfo = DataLoader.getSubjectInfo(bm.subject);
    return `<div class="bookmark-item">
      <div class="bookmark-item-content">
        <div class="bookmark-item-text">${bm.questionId}</div>
        <div class="bookmark-item-meta"><span>${subjectInfo?.name || bm.subject}</span><span>${topicName}</span><span>${Utils.formatDate(bm.date)}</span></div>
      </div>
      <div class="bookmark-actions">
        <button class="btn btn-sm btn-outline" onclick="Storage.toggleBookmark('${bm.subject}','${bm.topic}','${bm.questionId}');initBookmarks()">Remove</button>
      </div>
    </div>`;
  }).join('');
}
