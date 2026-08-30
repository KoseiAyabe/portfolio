// 固定ヘッダーのスクロール挙動（index.html / 100 THINGS ページ共通）
// - スクロール方向で `.hidden`（スライドアップ）をトグル
// - scrolledAtY を指定すると、閾値越えで `.scrolled`（背景差し替え）をトグル
//
// initHeaderScroll(el, {
//   hideMinY:    この位置より上では隠さない（既定 0）
//   revealDelta: この移動量より小さい方向の揺れは無視＝ちらつき防止（既定 0）
//   scrolledAtY: これを越えたら .scrolled を付ける。null なら .scrolled を扱わない（既定 null）
// })
function initHeaderScroll(el, { hideMinY = 0, revealDelta = 0, scrolledAtY = null } = {}) {
  if (!el) return;

  let prevY = window.scrollY;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;

    if (scrolledAtY !== null) {
      el.classList.toggle('scrolled', y > scrolledAtY);
    }

    if (Math.abs(y - prevY) > revealDelta) {
      el.classList.toggle('hidden', y > prevY && y > hideMinY);
      prevY = y;
    }
  });
}
