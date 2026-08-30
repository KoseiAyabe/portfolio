// ヘッダースクロール時の背景色切り替え・表示/非表示切り替え
let prevScrollPos = window.scrollY;
const HIDE_THRESHOLD = 100; // この値未満のスクロール量では表示/非表示を切り替えない（ちらつき防止）
window.addEventListener('scroll', () => {
  const currentScrollPos = window.scrollY;
  const header = document.getElementById('header');

  if (currentScrollPos > 800) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }

  if (Math.abs(currentScrollPos - prevScrollPos) > HIDE_THRESHOLD) {
    if (currentScrollPos > prevScrollPos) {
      header.classList.add('hidden');
    } else {
      header.classList.remove('hidden');
    }
    prevScrollPos = currentScrollPos;
  }
});

// メインビジュアルのタイピングアニメーション

document.addEventListener('DOMContentLoaded', () => {
  const text = 'Welcome to my portfolio website. Feel free to take your time.';
  const target = document.getElementById('typing-text');
  const typingSpeed = 70;
  const waitTime = 10000;
  let index = 0;
  const parts = text.match(/<[^>]*>|[^<]/g);

  const typeText = () => {
    if (index < parts.length) {
      target.innerHTML += parts[index++];
      setTimeout(typeText, typingSpeed);
    } else {
      setTimeout(() => {
        target.innerHTML = '';
        index = 0;
        setTimeout(typeText, typingSpeed);
      }, waitTime);
    }
  };

  typeText();
});

// タイトル文字のフェードアニメーション

document.addEventListener('DOMContentLoaded', () => {
  // すべてのセクション見出し（<div class="section-title"><h1 data-text="…">）を汎用取得
  const titles = [...document.querySelectorAll('.section-title h1[data-text]')]
    .map(el => ({ el, done: false }));

  document.fonts.ready.then(() => {
    titles.forEach(t => { t.el.style.opacity = 1; });
  });

  const options = { threshold: 0 };

  titles.forEach(t => {
    const handler = () => updateProgress(t);

    const titleObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          window.addEventListener('scroll', handler);
        } else {
          window.removeEventListener('scroll', handler);
        }
      });
    }, options);

    titleObserver.observe(t.el);
  });

  const updateProgress = (t) => {
    if (t.done) return;
    const rect = t.el.getBoundingClientRect();
    const middle = rect.top + rect.height / 2;
    const centerY = window.innerHeight / 2;
    const range = window.innerHeight - centerY;
    const offset = middle - centerY;

    if (middle < window.innerHeight && middle > centerY) {
      const progress = 1 - (offset / range);
      t.el.style.setProperty('--after-opacity', progress);
    } else if (middle <= centerY) {
      t.el.style.setProperty('--after-opacity', 1);
      t.done = true;
    } else {
      t.el.style.setProperty('--after-opacity', 0);
    }
  };
});

// スキルバーアニメーション（Intersection Observer）
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate');
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.4
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.skill-fill').forEach(el => {
    observer.observe(el);
  });
});

// スキル詳細開閉処理

document.addEventListener('DOMContentLoaded', () => {
  const skillBoxes = document.querySelectorAll('.skill-box');
  const skillDetails = document.querySelectorAll('.skill-details');
  let isOpened = false;
  
  skillBoxes.forEach(box => {
    box.addEventListener('click', () => {
      skillDetails.forEach(detail => {
        detail.classList.toggle('show', !isOpened);
      });
      isOpened = !isOpened;
    });
  });
});

// Swiper（タイムライン）初期化

document.addEventListener('DOMContentLoaded', () => {
  const isMobile = window.innerWidth < 768;
  const timelineSwiper = new Swiper('.timeline .swiper-container', {
    direction: isMobile ? 'horizontal' : 'vertical',
    loop: false,
    speed: 1600,
    allowTouchMove: true,
    mousewheel: !isMobile,
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev'
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
      renderBullet: (index, className) => {
        const slide = document.querySelectorAll('.swiper-slide')[index];
        const year = slide.getAttribute('data-year');
        return year ? `<span class="${className}">${year}</span>` : `<span class="${className}"></span>`;
      }
    },
    on: {
      init: () => {
        const firstSlide = document.querySelector('.timeline .swiper-slide:first-child');
        if (firstSlide) {
          firstSlide.style.boxShadow = 'none';
        }
      }
    }
  });
});

// ハンバーガーメニュー
document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.querySelector('.hamburger-menu');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav .navtext');
  const modeButtons = document.querySelectorAll('.mobile-nav .mode-btn');

  // ハンバーガーメニューのクリックイベント
  hamburger.addEventListener('click', function() {
    mobileMenu.classList.toggle('active');
  });

  // モバイルメニューのリンクをクリックしたときにメニューを閉じる
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', function() {
      mobileMenu.classList.remove('active');
    });
  });

  // モード切り替えボタンのクリックイベント
  modeButtons.forEach(button => {
    button.addEventListener('click', function() {
      mobileMenu.classList.remove('active');
    });
  });
});
