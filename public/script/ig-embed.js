// カスタマイズ用の変数
const isShowLoadMoreButton = true; // LoadMoreボタンの表示/非表示
const isShowTitle = false; // タイトルの表示/非表示
const TitleText = "Instagram Embed-Kit Sample";
const isShowCaption = false; // キャプションの表示/非表示
const isShowLikeCount = false; // イイネ数の表示/非表示
const isShowCommentsCount = false; // コメント数の表示/非表示
const isShowMultiMedia = true; // 複数メディアの切り替えボタン表示/非表示
const isShowReel = false; // リール動画の表示/非表示
const isShowProfile = true; // プロフィールセクションの表示/非表示
const isShowProfileBiography = true; // プロフィールの自己紹介文の表示/非表示
const isShowFollow = false; // フォロワー / フォロー数の表示/非表示
const isShowVisitProfileButton = false; // プロフィールのVisitボタンの表示/非表示
const displayPostsMode = 2; // 投稿の表示方法: 1=グリッド（既存）, 2=カード, 3=ウィンドウ

const DEFAULT_PAGE_SIZE = 6;
const MEDIA_PAGE_LIMIT = 5;
const MAX_MEDIA_ITEMS = DEFAULT_PAGE_SIZE * 3;

// Cloudflare Worker プロキシ経由でInstagram APIを呼び出す
const IG_PROXY_URL = "https://ig-proxy.kosei-find20.workers.dev";

const buildMediaListUrl = (nextUrl = null) => {
  if (typeof nextUrl === "string" && nextUrl) {
    return nextUrl;
  }
  return `${IG_PROXY_URL}/media`;
};

const buildProfileUrl = () => `${IG_PROXY_URL}/profile`;

const resolveMediaCover = (node) => {
  if (!node || typeof node !== "object") return null;
  const type = node.media_type;

  if (type === "VIDEO") {
    if (typeof node.thumbnail_url === "string" && node.thumbnail_url) {
      return node.thumbnail_url;
    }
    if (typeof node.media_url === "string" && node.media_url) {
      return node.media_url;
    }
    return null;
  }

  if (typeof node.media_url === "string" && node.media_url) {
    return node.media_url;
  }
  if (typeof node.thumbnail_url === "string" && node.thumbnail_url) {
    return node.thumbnail_url;
  }
  return null;
};

const pickCarouselCover = (children) => {
  if (!Array.isArray(children) || children.length === 0) return null;

  const preferredOrder = ["IMAGE", "CAROUSEL_ALBUM", "VIDEO"];
  for (const type of preferredOrder) {
    const candidate = children.find((child) => child?.media_type === type);
    const cover = resolveMediaCover(candidate);
    if (cover) {
      return cover;
    }
  }

  for (const child of children) {
    const cover = resolveMediaCover(child);
    if (cover) return cover;
  }

  return null;
};

const normalizeMediaItem = (item) => {
  if (!item || typeof item !== "object") return null;

  const id = typeof item.id === "string" ? item.id : null;
  if (!id) return null;

  const mediaType = item.media_type;
  const carouselChildren = Array.isArray(item?.children?.data)
    ? item.children.data
    : [];

  let primaryMediaUrl = null;
  if (mediaType === "CAROUSEL_ALBUM") {
    primaryMediaUrl = pickCarouselCover(carouselChildren);
  }
  if (!primaryMediaUrl) {
    primaryMediaUrl = resolveMediaCover(item);
  }

  if (!primaryMediaUrl) return null;

  const mediaUrls =
    mediaType === "CAROUSEL_ALBUM"
      ? carouselChildren
          .map((child) => resolveMediaCover(child))
          .filter((url) => typeof url === "string" && url)
      : [];

  if (mediaUrls.length === 0 && primaryMediaUrl) {
    mediaUrls.push(primaryMediaUrl);
  }

  const likeCount = Number.isFinite(Number(item.like_count))
    ? Number(item.like_count)
    : 0;
  const commentsCount = Number.isFinite(Number(item.comments_count))
    ? Number(item.comments_count)
    : 0;

  return {
    id,
    url:
      typeof item.permalink === "string" && item.permalink
        ? item.permalink
        : typeof item.media_url === "string"
          ? item.media_url
          : "#",
    cover: primaryMediaUrl,
    caption: typeof item.caption === "string" ? item.caption : "",
    username:
      typeof item.username === "string" && item.username ? item.username : "",
    timestamp: item.timestamp,
    mediaType,
    mediaUrls,
    srcset: [],
    likeCount,
    commentsCount,
  };
};

const normalizeProfile = (payload) => {
  if (!payload || typeof payload !== "object") return null;

  const biography =
    typeof payload.biography === "string" ? payload.biography : "";
  const profilePictureUrl =
    typeof payload.profile_picture_url === "string"
      ? payload.profile_picture_url
      : "";
  const username = typeof payload.username === "string" ? payload.username : "";
  const website = typeof payload.website === "string" ? payload.website : "";
  const mediaCount = Number.isFinite(Number(payload.media_count))
    ? Number(payload.media_count)
    : null;
  const followersCount = Number.isFinite(Number(payload.followers_count))
    ? Number(payload.followers_count)
    : null;
  const followsCount = Number.isFinite(Number(payload.follows_count))
    ? Number(payload.follows_count)
    : null;
  const name = typeof payload.name === "string" ? payload.name : "";

  return {
    biography,
    profilePictureUrl,
    username,
    website,
    mediaCount,
    followersCount,
    followsCount,
    name,
  };
};

async function fetchInstagramMediaItems() {
  const normalizedItems = [];
  const seenIds = new Set();

  // APIエラーレスポンスの確認
  let requestUrl = buildMediaListUrl();

  while (requestUrl && normalizedItems.length < MAX_MEDIA_ITEMS) {
    const response = await fetch(requestUrl, { cache: "no-cache" });
    const payload = await response.json();

    // APIエラーレスポンスの確認
    if (!response.ok || payload.error) {
      const errorMsg = payload.error
        ? `${payload.error.type}: ${payload.error.message} (code: ${payload.error.code})`
        : `HTTP ${response.status}: Failed to load media list`;
      throw new Error(errorMsg);
    }

    const entries = Array.isArray(payload?.data) ? payload.data : [];
    for (const entry of entries) {
      const normalized = normalizeMediaItem(entry);
      if (!normalized || seenIds.has(normalized.id)) {
        continue;
      }
      normalizedItems.push(normalized);
      seenIds.add(normalized.id);
      if (normalizedItems.length >= MAX_MEDIA_ITEMS) {
        break;
      }
    }
    if (normalizedItems.length >= MAX_MEDIA_ITEMS) {
      break;
    }
    const nextUrl =
      typeof payload?.paging?.next === "string" && payload.paging.next
        ? payload.paging.next
        : null;

    requestUrl = nextUrl ? buildMediaListUrl(nextUrl) : null;
  }

  normalizedItems.sort((a, b) => {
    const aTime = a?.timestamp ? Date.parse(a.timestamp) : 0;
    const bTime = b?.timestamp ? Date.parse(b.timestamp) : 0;
    return bTime - aTime;
  });

  const filtered = isShowReel
    ? normalizedItems
    : normalizedItems.filter((item) => item.mediaType !== "VIDEO");

  return filtered;
}

async function fetchInstagramProfile() {
  const response = await fetch(buildProfileUrl(), { cache: "no-cache" });
  const payload = await response.json();

  if (!response.ok || payload.error) {
    const errorMsg = payload.error
      ? `${payload.error.type}: ${payload.error.message} (code: ${payload.error.code})`
      : `HTTP ${response.status}: Failed to load profile`;
    throw new Error(errorMsg);
  }

  return normalizeProfile(payload);
}

const formatProfileCount = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toLocaleString("ja-JP");
  }
  return null;
};

const resolveDisplayMode = () => {
  const mode = Number(displayPostsMode);
  if (mode === 2) return 2;
  if (mode === 3) return 3;
  return 1;
};

const getDisplayModeClassName = (mode) => {
  if (mode === 2) return "ig-mode-card";
  if (mode === 3) return "ig-mode-window";
  return "ig-mode-grid";
};

const getDisplayModeName = (mode) => {
  if (mode === 2) return "card";
  if (mode === 3) return "window";
  return "grid";
};

const renderProfileLoading = (container) => {
  if (!container) return;
  container.innerHTML = "";
  const loading = document.createElement("div");
  loading.className = "ig-profile__loading";
  loading.textContent = "プロフィールを読み込んでいます…";
  container.appendChild(loading);
};

const renderProfileError = (container, message = "") => {
  if (!container) return;
  container.innerHTML = "";
  const errorWrapper = document.createElement("div");
  errorWrapper.className = "ig-profile__error";

  const title = document.createElement("strong");
  title.textContent = "プロフィールを読み込めませんでした。";
  errorWrapper.appendChild(title);

  if (message) {
    const detail = document.createElement("div");
    detail.className = "ig-profile__error-detail";
    detail.textContent = message;
    errorWrapper.appendChild(detail);
  }

  container.appendChild(errorWrapper);
};

const renderProfile = (profile, container) => {
  if (!container) return;
  container.innerHTML = "";

  if (!isShowProfile) {
    container.style.display = "none";
    return;
  }

  if (!profile) {
    renderProfileError(container);
    return;
  }

  container.style.display = "";

  const wrapper = document.createElement("div");
  wrapper.className = "ig-profile";

  const avatar = document.createElement("div");
  avatar.className = "ig-profile__avatar";

  const applyAvatarFallback = () => {
    avatar.innerHTML = "";
    avatar.classList.add("ig-profile__avatar--placeholder");
    const initial = profile.username
      ? profile.username.charAt(0).toUpperCase()
      : "IG";
    const initialSpan = document.createElement("span");
    initialSpan.textContent = initial;
    avatar.appendChild(initialSpan);
  };

  if (profile.profilePictureUrl) {
    const img = document.createElement("img");
    img.src = profile.profilePictureUrl;
    img.alt = profile.username
      ? `${profile.username}のプロフィール画像`
      : "Instagram profile picture";
    img.addEventListener("error", applyAvatarFallback, { once: true });
    avatar.appendChild(img);
  } else {
    applyAvatarFallback();
  }

  const details = document.createElement("div");
  details.className = "ig-profile__details";

  const header = document.createElement("div");
  header.className = "ig-profile__header";
  const usernameEl = document.createElement("span");
  usernameEl.className = "ig-profile__username";
  usernameEl.textContent = "@" + profile.username || "";
  header.appendChild(usernameEl);
  details.appendChild(header);

  if (profile.name) {
    const nameEl = document.createElement("p");
    nameEl.className = "ig-profile__name";
    nameEl.textContent = profile.name;
    details.appendChild(nameEl);
  }

  const statsList = document.createElement("ul");
  statsList.className = "ig-profile__stats";

  const createStatItem = (label, valueText, suffix = "") => {
    if (valueText === null || valueText === undefined) return null;
    const item = document.createElement("li");
    item.className = "ig-profile__stats-item";

    // labelに<br>タグが含まれている場合はHTMLとして解釈し、flex-directionをcolumnに変更
    const hasBrTag = typeof label === "string" && label.includes("<br>");
    if (hasBrTag) {
      item.style.flexDirection = "column";
      item.style.alignItems = "flex-start";
      const labelContainer = document.createElement("span");
      labelContainer.innerHTML = label;
      item.appendChild(labelContainer);
    } else {
      const labelNode = document.createTextNode(label);
      item.appendChild(labelNode);
    }

    const valueEl = document.createElement("span");
    valueEl.className = "ig-profile__stats-value";
    valueEl.textContent = valueText;
    item.appendChild(valueEl);

    const suffixNode = document.createTextNode(suffix);
    item.appendChild(suffixNode);

    return item;
  };

  const mediaCountText = formatProfileCount(profile.mediaCount);
  // const mediaItem = createStatItem("投稿<br>", mediaCountText, "件");
  const mediaItem = createStatItem("Posts", mediaCountText);
  if (mediaItem) {
    statsList.appendChild(mediaItem);
  }

  if (isShowFollow) {
    const followersCountText = formatProfileCount(profile.followersCount);
    const followsCountText = formatProfileCount(profile.followsCount);
    // const followersItem = createStatItem(
    //   "フォロワー<br>",
    //   followersCountText,
    //   "人"
    // );
    const followersItem = createStatItem("followers", followersCountText);
    // const followsItem = createStatItem(
    //   "フォロー中<br>",
    //   followsCountText,
    //   "人"
    // );
    const followsItem = createStatItem("following", followsCountText);
    if (followersItem) statsList.appendChild(followersItem);
    if (followsItem) statsList.appendChild(followsItem);
  }

  if (statsList.children.length > 0) {
    details.appendChild(statsList);
  }

  if (isShowProfileBiography && profile.biography) {
    const bio = document.createElement("p");
    bio.className = "ig-profile__bio";
    const lines = profile.biography.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (index > 0) {
        bio.appendChild(document.createElement("br"));
      }
      bio.appendChild(document.createTextNode(line));
    });
    details.appendChild(bio);
  }

  if (profile.website) {
    const websiteEl = document.createElement("a");
    websiteEl.className = "ig-profile__website";
    websiteEl.href = profile.website;
    websiteEl.target = "_blank";
    websiteEl.rel = "noopener noreferrer";
    websiteEl.textContent = profile.website;
    details.appendChild(websiteEl);
  }

  if (isShowVisitProfileButton) {
    const visitButton = document.createElement("a");
    visitButton.className = "ig-profile__visit-btn";
    visitButton.href = "https://www.instagram.com/koseiayabe/";
    visitButton.target = "_blank";
    visitButton.rel = "noopener noreferrer";
    visitButton.textContent = "Visit Profile";
    details.appendChild(visitButton);
  }

  wrapper.append(avatar, details);
  container.appendChild(wrapper);
};

async function loadIgEmbed() {
  const container = document.getElementById("ig-embed");
  if (!container) return;

  const displayMode = resolveDisplayMode();
  const displayModeClass = getDisplayModeClassName(displayMode);
  const displayModeName = getDisplayModeName(displayMode);

  container.classList.remove("ig-mode-grid", "ig-mode-card", "ig-mode-window");
  container.classList.add(displayModeClass);

  let loadMoreButton = null;
  let nextRenderIndex = 0;
  let items = [];
  let pageSize = DEFAULT_PAGE_SIZE; // 1ページあたりの表示件数
  const isSliderMode = displayMode === 2;

  let sliderViewport = null;
  let sliderTrack = null;
  let sliderDots = null;
  let sliderPrevBtn = null;
  let sliderNextBtn = null;
  let sliderCta = null;
  const sliderItems = [];
  const sliderDotButtons = [];
  let currentSlideIndex = 0;

  // displayMode = 3 の場合は4件のみ表示
  if (displayMode === 3) {
    pageSize = 4;
  }

  const ensureTitle = () => {
    if (!isShowTitle) return;
    const titleContainer = document.getElementById("ig-title");
    if (!titleContainer) return;
    // 既にタイトルが存在する場合はスキップ
    if (titleContainer.querySelector("#site-title")) return;
    titleContainer.innerHTML = "";
    const title = document.createElement("h1");
    title.id = "site-title";
    title.textContent = typeof TitleText === "string" ? TitleText : "";
    titleContainer.appendChild(title);
  };

  // タイトルを最初に設定
  ensureTitle();

  const profileContainer = document.getElementById("ig-profile");
  if (profileContainer) {
    if (!isShowProfile) {
      profileContainer.innerHTML = "";
      profileContainer.style.display = "none";
    } else {
      profileContainer.style.display = "";
      renderProfileLoading(profileContainer);
      fetchInstagramProfile()
        .then((profile) => {
          renderProfile(profile, profileContainer);

          // displayMode=2 のスライダーCTAをプロフィールへリンク
          if (isSliderMode && sliderCta) {
            const profileUrl = profile?.username
              ? `https://www.instagram.com/${profile.username}/`
              : profile?.website || "#";
            sliderCta.href = profileUrl;
          }
        })
        .catch((err) => {
          console.error("Instagram Profile Error:", err);
          renderProfileError(
            profileContainer,
            err.message || "Instagram APIのプロフィール取得に失敗しました。",
          );
        });
    }
  }

  const updateSliderActiveState = (activeIndex) => {
    sliderItems.forEach((item, idx) => {
      item.classList.toggle("is-active", idx === activeIndex);
    });
    sliderDotButtons.forEach((dot, idx) => {
      dot.classList.toggle("is-active", idx === activeIndex);
    });

    if (sliderPrevBtn)
      sliderPrevBtn.disabled = activeIndex <= 0 || sliderItems.length === 0;
    if (sliderNextBtn)
      sliderNextBtn.disabled =
        activeIndex >= sliderItems.length - 1 || sliderItems.length === 0;
  };

  const goToSlide = (index, smooth = true) => {
    if (!isSliderMode) return;
    if (!sliderTrack || !sliderItems[index]) return;
    const target = sliderItems[index];
    // offsetLeftは親要素（sliderTrack）からの相対位置
    const offset =
      target.offsetLeft - (sliderTrack.clientWidth - target.clientWidth) / 2;

    sliderTrack.scrollTo({
      left: offset,
      behavior: smooth ? "smooth" : "auto",
    });
    updateSliderActiveState(index);
    currentSlideIndex = index;
  };

  const setupSliderShell = () => {
    if (!isSliderMode || sliderViewport) return;

    container.innerHTML = "";

    const slider = document.createElement("div");
    slider.className = "ig-card-slider";

    sliderViewport = document.createElement("div");
    sliderViewport.className = "ig-card-slider__viewport";

    sliderTrack = document.createElement("div");
    sliderTrack.className = "ig-card-slider__track";
    sliderViewport.appendChild(sliderTrack);

    const createNavButton = (direction) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `ig-card-slider__nav ig-card-slider__nav--${direction}`;
      btn.setAttribute(
        "aria-label",
        direction === "next" ? "次の投稿へ" : "前の投稿へ",
      );
      const icon = document.createElement("span");
      icon.className = "ig-card-slider__nav-icon";
      icon.textContent = direction === "next" ? ">" : "<";
      btn.appendChild(icon);
      return btn;
    };

    sliderPrevBtn = createNavButton("prev");
    sliderNextBtn = createNavButton("next");

    sliderPrevBtn.addEventListener("click", () => {
      if (currentSlideIndex <= 0) return;
      requestAnimationFrame(() => {
        goToSlide(currentSlideIndex - 1);
      });
    });
    sliderNextBtn.addEventListener("click", () => {
      if (currentSlideIndex >= sliderItems.length - 1) return;
      requestAnimationFrame(() => {
        goToSlide(currentSlideIndex + 1);
      });
    });

    sliderDots = document.createElement("div");
    sliderDots.className = "ig-card-slider__dots";

    slider.append(sliderPrevBtn, sliderViewport, sliderNextBtn, sliderDots);
    container.appendChild(slider);

    sliderCta = document.createElement("a");
    sliderCta.className = "ig-card-slider__cta";
    sliderCta.href = "https://www.instagram.com/koseiayabe/";
    sliderCta.target = "_blank";
    sliderCta.rel = "noopener noreferrer";
    sliderCta.textContent = "SEE ALL ON INSTAGRAM";
    container.appendChild(sliderCta);

    let scrollTimer = null;
    sliderTrack.addEventListener("scroll", () => {
      if (!isSliderMode) return;
      if (scrollTimer) window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        const trackCenter =
          sliderTrack.scrollLeft + sliderTrack.clientWidth / 2;
        let closestIndex = currentSlideIndex;
        let minDiff = Number.POSITIVE_INFINITY;
        sliderItems.forEach((item, idx) => {
          const itemCenter = item.offsetLeft + item.clientWidth / 2;
          const diff = Math.abs(itemCenter - trackCenter);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = idx;
          }
        });
        updateSliderActiveState(closestIndex);
        currentSlideIndex = closestIndex;
      }, 100);
    });
  };

  const removeLoadMoreButton = () => {
    if (!loadMoreButton) return;
    loadMoreButton.removeEventListener("click", handleLoadMore);
    loadMoreButton.remove();
    loadMoreButton = null;
  };

  const createCard = (item) => {
    const href = typeof item.url === "string" ? item.url : "#";
    const cover = typeof item.cover === "string" ? item.cover : "";
    const caption = typeof item.caption === "string" ? item.caption : "";
    const likeCount = typeof item.likeCount === "number" ? item.likeCount : 0;
    const commentsCount =
      typeof item.commentsCount === "number" ? item.commentsCount : 0;

    const mediaUrls = Array.isArray(item.mediaUrls) ? item.mediaUrls : [];
    const availableMedia =
      mediaUrls.length > 0 ? mediaUrls : cover ? [cover] : [];
    const effectiveMedia = isShowMultiMedia
      ? availableMedia
      : availableMedia.slice(0, 1);

    // カード全体を囲むラッパーdiv
    const wrapper = document.createElement("div");
    wrapper.className = `ig-card-wrapper ig-card-wrapper--${displayModeName}`;
    if (isSliderMode) {
      wrapper.classList.add("ig-card-slider__item");
    }

    // 画像リンク用のaタグ
    const card = document.createElement("a");
    card.className = `ig-card ig-card--${displayModeName}`;
    card.href = href;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    const media = document.createElement("div");
    media.className = `ig-media ig-media--${displayModeName}`;

    const img = document.createElement("img");
    img.alt = caption || "Instagram post";
    img.addEventListener("load", () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      if (w > 0 && h > 0) {
        media.style.aspectRatio = `${w} / ${h}`;
      }
    });
    const hasSrcset = Array.isArray(item.srcset) && item.srcset.length > 0;
    const applyImageSource = (url, useSrcset = false) => {
      if (!url) return;
      if (useSrcset && hasSrcset) {
        const srcsetStr = item.srcset
          .filter((s) => s && typeof s.src === "string" && Number.isFinite(s.w))
          .map((s) => `${s.src} ${s.w}w`)
          .join(", ");
        if (srcsetStr) {
          img.srcset = srcsetStr;
          img.sizes = "(max-width: 767px) 50vw, 33vw";
        }
      } else {
        img.removeAttribute("srcset");
        img.removeAttribute("sizes");
      }
      img.src = url;
    };

    let currentMediaIndex = 0;
    const updateNavVisibility = (prevBtn, nextBtn) => {
      const lastIndex = effectiveMedia.length - 1;
      if (prevBtn) {
        prevBtn.style.display = currentMediaIndex > 0 ? "flex" : "none";
      }
      if (nextBtn) {
        nextBtn.style.display = currentMediaIndex < lastIndex ? "flex" : "none";
      }
    };

    const goToMedia = (index, prevBtn, nextBtn) => {
      if (index < 0 || index >= effectiveMedia.length) return;
      currentMediaIndex = index;
      applyImageSource(
        effectiveMedia[currentMediaIndex],
        currentMediaIndex === 0,
      );
      updateNavVisibility(prevBtn, nextBtn);
    };

    applyImageSource(effectiveMedia[0], true);

    img.addEventListener("error", () => {
      // 一度だけフォールバックを適用
      if (img.dataset.fallbackApplied === "1") return;
      img.dataset.fallbackApplied = "1";
      // 解像度指定は外す（プレースホルダーは単一サイズ）
      img.removeAttribute("srcset");
      img.removeAttribute("sizes");
      // シンプルなSVGプレースホルダー
      const svg = encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">\n' +
          '  <rect width="100%" height="100%" fill="#e5e7eb"/>\n' +
          '  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-size="48">No Image</text>\n' +
          "</svg>",
      );
      img.src = `data:image/svg+xml;charset=utf-8,${svg}`;
      img.style.display = "block";
    });

    media.appendChild(img);

    if (isShowMultiMedia && effectiveMedia.length > 1) {
      const createNavButton = (direction) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `ig-media-nav ig-media-nav--${direction}`;
        btn.setAttribute(
          "aria-label",
          direction === "next" ? "次のメディアへ" : "前のメディアへ",
        );
        const icon = document.createElement("i");
        icon.className =
          direction === "next"
            ? "fa-solid fa-chevron-right"
            : "fa-solid fa-chevron-left";
        icon.setAttribute("aria-hidden", "true");
        btn.appendChild(icon);
        return btn;
      };

      const prevBtn = createNavButton("prev");
      const nextBtn = createNavButton("next");

      prevBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        goToMedia(currentMediaIndex - 1, prevBtn, nextBtn);
      });

      nextBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        goToMedia(currentMediaIndex + 1, prevBtn, nextBtn);
      });

      media.appendChild(prevBtn);
      media.appendChild(nextBtn);
      updateNavVisibility(prevBtn, nextBtn);
    }

    // ホバー時のオーバーレイ（いいね数とコメント数）
    const overlay = document.createElement("div");
    overlay.className = "ig-media-overlay";

    const stats = document.createElement("div");
    stats.className = "ig-media-stats";

    // いいね数の表示
    if (isShowLikeCount) {
      const likeStat = document.createElement("div");
      likeStat.className = "ig-media-stat";
      const likeIcon = document.createElement("i");
      likeIcon.className = "fa-solid fa-heart";
      likeIcon.setAttribute("aria-hidden", "true");
      const likeText = document.createElement("span");
      likeText.className = "ig-media-stat-text";
      likeText.textContent = likeCount.toLocaleString("ja-JP");
      likeStat.appendChild(likeIcon);
      likeStat.appendChild(likeText);
      stats.appendChild(likeStat);
    }

    // コメント数の表示
    if (isShowCommentsCount) {
      const commentStat = document.createElement("div");
      commentStat.className = "ig-media-stat";
      const commentIcon = document.createElement("i");
      commentIcon.className = "fa-solid fa-comment";
      commentIcon.setAttribute("aria-hidden", "true");
      const commentText = document.createElement("span");
      commentText.className = "ig-media-stat-text";
      commentText.textContent = commentsCount.toLocaleString("ja-JP");
      commentStat.appendChild(commentIcon);
      commentStat.appendChild(commentText);
      stats.appendChild(commentStat);
    }

    overlay.appendChild(stats);

    if (isSliderMode) {
      overlay.classList.add("ig-media-overlay--card");
    }
    media.appendChild(overlay);
    card.appendChild(media);
    wrapper.appendChild(card);

    // isShowCaptionがtrueの場合、キャプションを追加
    if (isShowCaption && caption) {
      const cap = document.createElement("div");
      cap.className = "ig-caption";
      const lines = caption.split(/\r?\n/);
      lines.forEach((line, index) => {
        if (index > 0) {
          cap.appendChild(document.createElement("br"));
        }
        cap.appendChild(document.createTextNode(line));
      });
      wrapper.appendChild(cap);
    }

    return wrapper;
  };

  const renderNextBatch = () => {
    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      nextRenderIndex >= items.length
    ) {
      return false;
    }
    const slice = items.slice(nextRenderIndex, nextRenderIndex + pageSize);
    if (slice.length === 0) {
      return false;
    }
    const createdCards = slice.map((item) => createCard(item));

    if (nextRenderIndex === 0 && !isSliderMode) {
      container.innerHTML = "";
    }

    if (isSliderMode) {
      setupSliderShell();
      for (const card of createdCards) {
        sliderTrack.appendChild(card);
        sliderItems.push(card);

        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "ig-card-slider__dot";
        dot.addEventListener("click", () => {
          const idx = sliderDotButtons.indexOf(dot);
          if (idx >= 0) {
            goToSlide(idx);
          }
        });
        sliderDotButtons.push(dot);
        sliderDots.appendChild(dot);
      }

      // 初期アクティブ状態をセット
      requestAnimationFrame(() => {
        goToSlide(currentSlideIndex, false);
      });
    } else {
      const fragment = document.createDocumentFragment();
      for (const card of createdCards) {
        fragment.appendChild(card);
      }
      container.appendChild(fragment);
    }

    nextRenderIndex += createdCards.length;

    return nextRenderIndex < items.length;
  };

  const handleLoadMore = () => {
    const hasMore = renderNextBatch();
    if (!hasMore) {
      removeLoadMoreButton();
    }
  };

  const ensureLoadMoreButton = () => {
    if (!isShowLoadMoreButton || isSliderMode) return;
    if (loadMoreButton) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ig-load-more";
    btn.textContent = "Load More";
    btn.addEventListener("click", handleLoadMore);
    container.insertAdjacentElement("afterend", btn);
    loadMoreButton = btn;
  };

  try {
    items = await fetchInstagramMediaItems();
    nextRenderIndex = 0;

    // displayMode = 3 の場合は4件のみに制限
    if (displayMode === 3) {
      items = items.slice(0, 4);
    }

    if (items.length === 0) {
      container.textContent = "投稿が見つかりませんでした。";
      removeLoadMoreButton();
      return;
    }

    const hasMore = renderNextBatch();
    // displayMode = 3 の場合はLoadMoreボタンを表示しない
    if (displayMode === 3) {
      removeLoadMoreButton();
    } else if (isShowLoadMoreButton && hasMore) {
      ensureLoadMoreButton();
    } else {
      removeLoadMoreButton();
    }
  } catch (err) {
    console.error("Instagram API Error:", err);
    const errorMessage = err.message || "データの読み込みに失敗しました。";
    container.innerHTML = `<div style="text-align: center; padding: 20px; color: #dc2626;">
      <strong>エラーが発生しました</strong><br>
      ${errorMessage}<br>
      <small style="color: #6b7280; margin-top: 8px; display: block;">
        Instagram APIの認証情報（アクセストークン）を確認してください。
      </small>
    </div>`;
    removeLoadMoreButton();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadIgEmbed);
} else {
  loadIgEmbed();
}
