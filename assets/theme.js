(() => {
  try {
    const saved = localStorage.getItem('infrayard-theme');
    const dark = saved === 'dark' || (!saved && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', dark);
  } catch {
    document.documentElement.dataset.theme = 'light';
  }
})();
