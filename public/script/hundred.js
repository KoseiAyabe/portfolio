// 100 THINGS ページ（/100/, /ja/100/）専用のスクリプト。
// index 側の script.js は Swiper 等このページに無い要素を前提とするため読み込まない。
// headerScroll.js を先に読み込んでおくこと。

// ヘッダーのスクロール挙動（共通関数）
initHeaderScroll(document.getElementById('likes-header'), { hideMinY: 80 });

// モバイルメニュー開閉
const hamburger = document.getElementById('likes-hamburger');
const mobileMenu = document.getElementById('likes-mobile-menu');
const closeBtn = document.getElementById('likes-mobile-close');

hamburger.addEventListener('click', () => mobileMenu.classList.add('open'));
closeBtn.addEventListener('click', () => mobileMenu.classList.remove('open'));
mobileMenu.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') mobileMenu.classList.remove('open');
});
