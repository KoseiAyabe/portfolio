// =============================
// Theme Switcher JS 
// =============================

/**
 * Gets the preferred theme from the OS settings.
 * @return {string} Theme key ('normal-day' or 'normal-night')
 */
const getSystemTheme = () => {
  const prefersDark = window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'normal-night' : 'normal-day';
};

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
 * Initializes the theme using system setting and shows modal always.
 */
const initTheme = () => {
  let systemTheme = getSystemTheme();

  // systemThemeが 'normal' の場合はOSの設定に応じて切り替える
  if (systemTheme === 'normal') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    systemTheme = prefersDark ? 'normal-night' : 'normal-day';
  }

  applyTheme(systemTheme);
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
