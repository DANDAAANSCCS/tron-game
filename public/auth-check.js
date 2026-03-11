// Auth check — redirects to login if not authenticated
// Also provides window.currentUser for pages that need it
(async function() {
  try {
    const res = await fetch('/api/me');
    if (!res.ok) {
      window.location.href = '/login.html';
      return;
    }
    window.currentUser = await res.json();
  } catch (e) {
    window.location.href = '/login.html';
  }
})();
