// ヘッダースクロール時の背景色切り替え
let prevScrollPos = window.scrollY;
window.addEventListener('scroll', () => {
  const currentScrollPos = window.scrollY;
  const header = document.getElementById('header');
  if (currentScrollPos > 800) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
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
  const sections = [
    { class: 'skill-title', flag: false },
    { class: 'profile-title', flag: false },
    { class: 'history-title', flag: false },
    { class: 'works-title', flag: false },
    { class: 'contact-title', flag: false }
  ];
  
  document.fonts.ready.then(() => {
    sections.forEach(s => {
      const el = document.querySelector(`.${s.class}`);
      if (el) el.style.opacity = 1;
    });
  });
  
  const options = { threshold: 0 };
  
  sections.forEach(section => {
    const el = document.querySelector(`.${section.class}`);
    if (!el) return;
    
    const titleObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const handler = () => updateProgress(section, el);
        if (entry.isIntersecting) {
          window.addEventListener('scroll', handler);
        } else {
          window.removeEventListener('scroll', handler);
        }
      });
    }, options);
    
    titleObserver.observe(el);
  });
  
  const updateProgress = (section, el) => {
    if (section.flag) return;
    const rect = el.getBoundingClientRect();
    const middle = rect.top + rect.height / 2;
    const centerY = window.innerHeight / 2;
    const range = window.innerHeight - centerY;
    const offset = middle - centerY;
    
    if (middle < window.innerHeight && middle > centerY) {
      const progress = 1 - (offset / range);
      el.style.setProperty('--after-opacity', progress);
    } else if (middle <= centerY) {
      el.style.setProperty('--after-opacity', 1);
      section.flag = true;
    } else {
      el.style.setProperty('--after-opacity', 0);
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
  const timelineSwiper = new Swiper('.timeline .swiper-container', {
    direction: 'vertical',
    loop: false,
    speed: 1600,
    allowTouchMove: true,
    mousewheel: true,
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
