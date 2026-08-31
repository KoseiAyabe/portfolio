# CLAUDE.md

このファイルは、Claude Code（claude.ai/code）がこのリポジトリで作業する際の前提知識をまとめたものです。

## 概要

Kosei Ayabe の個人ポートフォリオサイト。出力は**純粋な静的 HTML / CSS / JS**。
HTML は **Eleventy（11ty）** で `src/` のテンプレ＋データから生成し、CSS は **Dart Sass** で
`scss/` から生成する。どちらも成果物（`public/*.html`, `public/css/main.css`）を**コミットする**。

- 公開 URL: <https://ayb-fixed-stars.work/>（日本語版は <https://ayb-fixed-stars.work/ja/>）
- リポジトリ: <https://github.com/KoseiAyabe/portfolio>
- 公開ディレクトリ: `public/`（この配下がそのまま Web ルート）
- **文言の1ソース化**: EN/JA の本文は `src/_data/*.json` にまとまっている。テンプレはマークアップのみ。

## ディレクトリ構成

```
portfolio/
├── README.md                     ← 対外向け説明（日英併記）
├── CLAUDE.md                     ← このファイル
├── eleventy.config.mjs           ← 11ty 設定（input: src / output: public / Nunjucks）
├── package.json                  ← devDep: eleventy, sass, concurrently。build / build:css / build:html / dev
├── package-lock.json             ← バージョン固定（★コミット対象）
├── node_modules/                 ← gitignore
├── .gitignore
├── src/                          ← ★ HTML のソース（ここを編集する）
│   ├── index.njk / ja/index.njk / 100/index.njk / ja/100/index.njk   ← 各 3 行の front matter のみ
│   ├── _includes/
│   │   ├── base.njk              ← トップページ（EN/JA 共通）の全マークアップ
│   │   ├── hundred-layout.njk    ← 100 THINGS ページ（EN/JA 共通）の全マークアップ
│   │   └── partials/macros.njk   ← nav / テーマボタン / SNS / section-title の共通マクロ
│   └── _data/
│       ├── site.json             ← domain / gaId / formspree / r2Base / swiperVersion / v(キャッシュバスター) / sns[]
│       ├── meta.json             ← ページ×ロケール別 title / description / og
│       ├── i18n.json             ← UI 文字列・本文（{ en: {...}, ja: {...} }）
│       ├── skills.json           ← SKILL 10 件（アイコン markup 共通、text は en/ja）
│       ├── timeline.json         ← HISTORY 6 件（画像共通、title/text は en/ja）
│       ├── works.json            ← WORKS 5 件（thumb/badges/url 共通、title/description は en/ja）
│       ├── ticker.json           ← 100 THINGS プレビューの流れる帯（画像×alt、24×2 トラック）
│       └── hundred.json          ← 100 THINGS ページの 100 件（n/label/wide/image + en/ja の title/desc/alt）
└── public/                       ← ★ ビルド出力（配信先）。*.html は 11ty 生成物、コミット対象
    ├── index.html                ← 生成（src/index.njk 由来）
    ├── ja/index.html             ← 生成
    ├── 100/index.html            ← 生成
    ├── ja/100/index.html         ← 生成
    ├── css/
    │   ├── main.css              scss/main.scss のコンパイル成果物（★コミット対象）
    │   ├── main.css.map          同上のソースマップ（コミット対象）
    │   ├── 100.css               「100 THINGS」ページ専用。手書き（SCSS ソースなし）
    │   ├── modaal.css            Modaal 用スタイル（手書き/ベンダー。scss/modaal.scss とは別管理）
    │   └── ig-embed.css          Instagram 埋め込みキット付属
    ├── scss/
    │   ├── main.scss             _style と 5 テーマ partial を @use で読み込むだけのエントリ
    │   ├── _style.scss           スタイル本体（約2,150行の単一ファイル）
    │   ├── modaal.scss           Modaal v0.4.4 のベンダーソース（main.scss には import されず、ビルド非対象）
    │   └── themes/
    │       ├── _theme_normal-day.scss
    │       ├── _theme_normal-night.scss
    │       ├── _theme_forest.scss
    │       ├── _theme_ocean.scss
    │       └── _theme_land.scss  各テーマの :root[data-theme="..."] CSS 変数セット
    ├── script/
    │   ├── headerScroll.js       固定ヘッダーのスクロール挙動（共通 initHeaderScroll()）
    │   ├── script.js             トップページの挙動（下記参照）
    │   ├── hundred.js            100 THINGS ページ用（ヘッダー＋モバイルメニュー）
    │   ├── themeSwitcher.js      テーマ切替＋背景動画差し替え
    │   ├── ig-embed.js           Instagram 取得・描画（外部キット由来）
    │   └── modaal.js             Modaal 本体（ベンダー、jQuery プラグイン）
    └── images/
        ├── profile.png
        ├── timeline/             HISTORY セクション用（6枚）
        ├── works/                WORKS セクション用（6枚）
        ├── icon/                 favicon / SNS アイコン（svg・png）
        └── 100/                  「100 THINGS」用（約100枚。番号ズレ・未使用の重複あり。後述）
```

補足:
- 背景動画はリポジトリに含まれず、Cloudflare R2 から配信（後述）。
- `public/` 配下の `css/` `images/` `script/` `scss/` は 11ty の管理外。11ty は生成した
  `*.html` のみ書き込み、既存ディレクトリには一切触れない（＝配信先を `public/` に固定できる）。

## 技術スタック

| 種別 | 内容 |
| --- | --- |
| マークアップ | **Eleventy 3.x（Nunjucks）**。`src/` のテンプレ＋`_data/*.json` から `public/*.html` を生成 |
| スタイル | SCSS → **Dart Sass**（npm `sass`）でコンパイル。CSS カスタムプロパティでテーマ切替 |
| スクリプト | 素の JavaScript（バンドラーなし）＋ jQuery |
| CDN: jQuery | 3.7.1（`code.jquery.com`） |
| CDN: Swiper | `unpkg.com/swiper@{{ site.swiperVersion }}/swiper-bundle`（`site.json` で固定。現在 14.2.0）。HISTORY スライダー |
| CDN: Font Awesome | 6.5.1（cdnjs） |
| CDN: Devicon | 2.15.1（jsDelivr）。SKILL セクションの技術アイコン |
| Google Fonts | Didact Gothic / M PLUS 1p / Titillium Web |
| 同梱ベンダー: Modaal | `script/modaal.js` + `css/modaal.css` + `scss/modaal.scss`。画像ギャラリー（`.gallery`）と WORKS モーダル（`.work-modal-trigger`） |
| Instagram 埋め込み | `script/ig-embed.js`（+ `css/ig-embed.css`）。外部キット `~/Dev/ig-embed-kit` からコピーして使用 |

## ビルド手順

初回のみ（リポジトリ直下）:

```bash
npm install          # eleventy / sass / concurrently
```

編集後にビルド:

```bash
npm run build        # build:css + build:html（= sass → public/css/main.css, eleventy → public/*.html）
npm run build:css    # CSS だけ
npm run build:html   # HTML だけ（eleventy）
npm run dev          # sass --watch と eleventy --serve を並行起動（http://localhost:8080）
```

- HTML を触ったら `src/` を編集し `npm run build:html`（または `npm run build`）。
  `src/index.njk` 等は front matter だけ。マークアップは `_includes/`、文言は `_data/*.json`。
- SCSS を触ったら `npm run build:css`。使用コンパイラは **Dart Sass**（Ruby / rbenv 不要）。
- **`public/*.html` と `public/css/main.css` / `.map` はコミット対象**（デプロイ工程が無く `public/` を
  直接配信するため）。コミット前に必ず `npm run build` を実行し、`src` と `public` を揃える。
- `file://` 直開きは不可（アセットがルート絶対パス `/css/...`）。`npm run dev` か静的サーバーを使う。
  SCSS を変更したら必ず `npm run build:css` を実行して両方をコミットすること。
- `css/100.css` / `css/modaal.css` / `css/ig-embed.css` は SCSS を経由しない。**直接編集**する。
- `scss/modaal.scss` は Modaal v0.4.4 のベンダーソースで、`main.scss` からは import していない。
  Modaal の見た目調整は `css/modaal.css` を直接触るか、`_style.scss` 側のスコープ付き上書き
  （`.work-modaal { .modaal-* { ... } }`）で行う。

## JavaScript の構成

`index.html` 末尾での読み込み順:

```
ig-embed.js  →  jQuery  →  Swiper(bundle)  →  headerScroll.js  →  script.js  →  themeSwitcher.js(defer)  →  modaal.js
```

その後インラインで `$(".gallery").modaal(...)` と `$(".work-modal-trigger").modaal(...)` を初期化。

- **`script/headerScroll.js`** … 固定ヘッダーのスクロール挙動の共通関数 `initHeaderScroll(el, opts)`。
  `opts` は `hideMinY`（この位置より上では隠さない）/ `revealDelta`（ちらつき防止の移動量閾値）/
  `scrolledAtY`（越えたら `.scrolled` 付与、`null` で無効）。index と 100 ページの両方が読み込む。
- **`script/script.js`** … トップページの挙動をまとめて担当:
  - ヘッダーのスクロール挙動 → `initHeaderScroll(#header, { revealDelta: 100, scrolledAtY: 800 })`
  - メインビジュアルのタイピングアニメーション（`#typing-text`）
  - セクションタイトルのスクロール連動フェードイン（`.section-title h1[data-text]` を汎用取得。`--after-opacity` を更新）
  - スキルバーのアニメーション（IntersectionObserver、`.skill-fill` に `.animate` 付与）
  - スキルボックスのクリックで詳細（`.skill-details`）を一括開閉
  - Swiper（`.timeline .swiper-container`）初期化。768px 未満は横方向、以上は縦方向
  - ハンバーガーメニュー（`.mobile-menu` に `.open`）
- **`script/themeSwitcher.js`** … `<html data-theme>` の切替と、テーマに応じた背景動画（R2）の差し替え。
  `.mode-btn`（ナビ／モバイルメニューのテーマボタン）のクリックを購読。**ページ読み込みのたびにランダムでテーマを選択**（永続化なし）。
- **`script/ig-embed.js`** … Instagram プロキシから投稿とプロフィールを取得して `#ig-root` 内に描画。
  ファイル冒頭の `isShow*` 定数群（`isShowCaption`, `isShowLikeCount`, `displayPostsMode` など）で表示項目を制御。
  `displayPostsMode = 2`（カード＝スライダー表示）が現在の設定。
- **`script/hundred.js`** … 100 THINGS ページ（`100/`・`ja/100/`）専用。`initHeaderScroll(#likes-header,
  { hideMinY: 80 })` の呼び出しと、モバイルメニュー開閉（`#likes-mobile-menu` に `.open`）。
  100 ページは `headerScroll.js` → `hundred.js` の2本だけを読み込む（`script.js` は Swiper 等
  このページに無い要素を前提とするため読み込まない）。

## トップページのセクション

`index.html` / `ja/index.html` は 1 ページ構成。`#id` の順:

1. `#mainvisual` … 背景動画（`#main-video`）＋タイトル＋タイピングテキスト
2. `#profile` … 自己紹介文＋SNS リンク（`.fas_sns_circlecolor`）
3. `#skill` … スキル 10 件。`.skill-box` ごとにバー（`.skill-90` 等の % クラス）＋クリックで詳細
4. `#timeline-section` … HISTORY。Swiper。タイトルスライド＋年代スライド 6 枚（`data-year`）
5. `#works` … 制作事例 5 件（HANA\*HANA / negura campground / Queue management / IELTS Writing Lab / Aina）。
   各カードに Modaal のインラインモーダル（`#work-modal-*`, `display:none`）
6. `#gallery` … Instagram 埋め込み（`#ig-root` > `#ig-title` / `#ig-profile` / `#ig-embed`）
7. `#hundred-things` … 「100 THINGS」の予告。無限スクロールのティッカー 2 段 → `100/` へのリンク
8. `#contact` … Formspree へ POST するフォーム
9. `#footer` … SNS アイコン＋コピーライト

## テーマ機構

- テーマは 5 種: `normal-day` / `normal-night` / `forest` / `ocean` / `land`
- `<html data-theme="...">` を切り替えると、`scss/themes/_theme_*.scss` で定義された CSS 変数
  （`--main-color1`, `--font-color1`, `--skill-*`, `--title-color*` など）が差し替わる。
- 同時に `themeSwitcher.js` が背景動画を差し替える:

  | data-theme | 動画 URL（`https://pub-5ac53b554a7a41cfa02002794e034c48.r2.dev/main/`） |
  | --- | --- |
  | normal-day | `normal.mp4` |
  | normal-night | `night.mp4` |
  | forest | `forest.mp4` |
  | ocean | `ocean.mp4` |
  | land | `sand.mp4` |

- `_style.scss` の `:root`（無指定時のデフォルト）に `normal-day` と同じ値が**重複定義**されている。
- テーマ選択は初回ロード時にランダム。`localStorage` 等での保持はしていない。

## 外部サービス / エンドポイント

すべてクライアント側に直書き（いずれも公開して問題ない値）。

| 用途 | 値 |
| --- | --- |
| Google Analytics | gtag `G-HEW8DMVSQ0`（全 4 ページの `<head>` 付近に直書き） |
| Contact フォーム | Formspree `https://formspree.io/f/xzznwyay`（`#contact-form` の action） |
| 背景動画 | Cloudflare R2 バケット `pub-5ac53b554a7a41cfa02002794e034c48.r2.dev/main/*.mp4` |
| Instagram | 自前の Cloudflare Worker プロキシ `https://ig-proxy.kosei-find20.workers.dev`（`/media`, `/profile`）。**アクセストークンは Worker 側に隠蔽**。`ig-embed.js` の `IG_PROXY_URL` |

## 編集時の注意（重要）

- **`public/*.html` を直接編集しない**（11ty の生成物）。編集先は必ず `src/`:
  - 文言・翻訳 → `src/_data/*.json`（`i18n.json` / `skills.json` / `timeline.json` / `works.json` /
    `hundred.json` / `ticker.json` / `meta.json`）。EN/JA は同じファイル内の `en` / `ja` に隣り合わせ。
  - マークアップ・構造 → `src/_includes/base.njk`（トップ）/ `hundred-layout.njk`（100）/
    `partials/macros.njk`（nav・テーマボタン・SNS）。EN/JA 共通の 1 本。
  - サイト共通値（GA ID・Formspree・R2・Swiper バージョン・`sns[]` 等）→ `src/_data/site.json`。
  - 編集後 `npm run build` → `src` と `public` を両方コミット。
- **アセットはルート絶対パス**（`/css/...` `/images/...` `/script/...`）。階層ごとの `../` は無い。
- **キャッシュバスターは `src/_data/site.json` の `v` 一箇所**。値を変えて `npm run build` すると
  全ページの `?v=` が一括更新される。
- **SCSS を触ったら `npm run build:css`（または `npm run build`）で `css/main.css` / `.map` を再生成してコミット**。
- **デプロイ手順はリポジトリ外**。ホスティング/CI/CDN の設定ファイル（CNAME, netlify, vercel, wrangler,
  GitHub Actions 等）はリポジトリに存在しない。デプロイ方法が判明したらこの節に追記すること。（TODO）

