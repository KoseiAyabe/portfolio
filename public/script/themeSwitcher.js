// =============================
// Theme Switcher JS 
// =============================


/**
 * Applies the given theme to the document and updates background video.
 * @param {string} theme Theme key
 */
const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  updateMainVideo(theme);
};

/**
 * Updates the main background video source according to the theme.
 * @param {string} theme Theme key
 */
const updateMainVideo = (theme) => {
  const video = document.getElementById('main-video');
  if (!video) return;

  const R2_BASE = 'https://pub-5ac53b554a7a41cfa02002794e034c48.r2.dev/main';

  const videoMap = {
    'normal-day': `${R2_BASE}/normal.mp4`,
    'normal-night': `${R2_BASE}/night.mp4`,
    'forest': `${R2_BASE}/forest.mp4`,
    'ocean': `${R2_BASE}/ocean.mp4`,
    'land': `${R2_BASE}/sand.mp4`,
  };

  const newSrc = videoMap[theme] || videoMap['normal-day'];
  if (!video.src.includes(newSrc)) {
    video.src = newSrc;
    video.load();
    video.play();
  }
};

/**
 * Initializes the theme with a random selection.
 */
const initTheme = () => {
  const themes = ['normal-day', 'normal-night', 'forest', 'ocean', 'land'];
  const randomTheme = themes[Math.floor(Math.random() * themes.length)];
  applyTheme(randomTheme);
};


/**
 * Sets up event listeners for both nav and modal theme selection buttons.
 */
const themeButtons = document.querySelectorAll('.mode-btn, .mode-select');

themeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const theme = button.getAttribute('data-theme');
    applyTheme(theme);
  });
});

initTheme();
