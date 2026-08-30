# Portfolio — Kosei Ayabe

Personal portfolio website of Kosei Ayabe, a software engineer based in Canada.
A hand-built **static site** (plain HTML / SCSS / vanilla JS, no framework, no bundler).

**Live:** <https://ayb-fixed-stars.work/> ・ 日本語版 <https://ayb-fixed-stars.work/ja/>

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=fff)
![Sass](https://img.shields.io/badge/Sass-CC6699?logo=sass&logoColor=fff)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000)
![jQuery](https://img.shields.io/badge/jQuery-0769AD?logo=jquery&logoColor=fff)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?logo=cloudflare&logoColor=fff)

🇬🇧 [English](#english) ・ 🇯🇵 [日本語](#日本語)

> Contributor / AI-assistant notes (build gotchas, known issues, refactoring backlog) live in [`CLAUDE.md`](./CLAUDE.md).

---

## English

### Overview

- One-page portfolio (`/`) plus a standalone **"100 Things"** page (`/100/`).
- Fully bilingual: English under `/`, Japanese under `/ja/` (mirrored HTML).
- No build step for HTML/JS. Only the SCSS is compiled (manually) to CSS.
- `public/` is the web root — deploy the contents of that folder as-is.

### Tech stack

| Area | Choice |
| --- | --- |
| Markup | Plain HTML (no template engine) |
| Styling | SCSS → compiled with **Dart Sass** (npm `sass`); theming via CSS custom properties |
| Scripting | Vanilla JS + jQuery 3.7.1 |
| Slider | [Swiper](https://swiperjs.com/) (CDN) — the "History" timeline |
| Modals | [Modaal](https://github.com/humaan/Modaal) (jQuery plugin, vendored) — image gallery + Works cards |
| Icons / fonts | Font Awesome 6, Devicon, Google Fonts (Didact Gothic / M PLUS 1p / Titillium Web) |
| Analytics | Google Analytics (gtag) |
| Contact form | [Formspree](https://formspree.io/) |
| Background video | Cloudflare R2 (per-theme `.mp4`) |
| Instagram feed | Instagram Graph API via a self-hosted **Cloudflare Worker** proxy (access token kept server-side) |

All third-party libraries are loaded from CDNs; nothing is installed via npm.

### Project structure

```
public/                     ← web root (deploy this)
├── index.html              English top page (single-page)
├── ja/index.html           Japanese top page
├── 100/index.html          "100 Things" page (EN)
├── ja/100/index.html       "100 Things" page (JA)
├── css/
│   ├── main.css(.map)      compiled from scss/main.scss — committed
│   ├── 100.css             "100 Things" page styles (hand-written, no SCSS)
│   ├── modaal.css          Modaal styles (vendor)
│   └── ig-embed.css        Instagram embed styles (vendor kit)
├── scss/
│   ├── main.scss           entry: @use _style + theme partials
│   ├── _style.scss         main stylesheet
│   ├── modaal.scss         Modaal v0.4.4 source (vendor; not part of the build)
│   └── themes/_theme_*.scss  5 themes (CSS-variable sets)
├── script/
│   ├── headerScroll.js     shared fixed-header scroll behaviour (initHeaderScroll)
│   ├── script.js           top-page behaviour (typing, skill bars, Swiper init, menu…)
│   ├── hundred.js          "100 Things" page (header scroll + mobile menu)
│   ├── themeSwitcher.js    theme switch + swaps the background video
│   ├── ig-embed.js         Instagram fetch & render (from an external kit)
│   └── modaal.js           Modaal library (vendor)
└── images/                 profile / timeline / works / icons / 100-things
```

### Local development

Serve `public/` with any static server. With VS Code Live Server the port is preset to **5501**
(`public/.vscode/settings.json`), so open `public/index.html` via "Go Live".

Build the CSS (requires Node.js):

```bash
npm install          # one-time: installs Dart Sass
npm run build:css    # compile public/scss/main.scss → public/css/main.css
npm run watch:css    # or: recompile on change
```

- `css/main.css` and `css/main.css.map` are committed — regenerate and commit them together
  after editing any `.scss` file.
- `css/100.css`, `css/modaal.css`, `css/ig-embed.css` are **not** generated from SCSS; edit them directly.

### Sections

Main page: Main visual (video) · Profile · Skills · History (Swiper timeline) · Works (5 projects, modal details) ·
Gallery (Instagram) · 100 Things (preview → `/100/`) · Contact (Formspree) · Footer.

### Themes

Five themes — `normal-day`, `normal-night`, `forest`, `ocean`, `land` — selected via `<html data-theme>`.
Each swaps a set of CSS custom properties (`scss/themes/_theme_*.scss`) **and** the R2 background video.
The initial theme is chosen at random on each load (not persisted).

### External services / endpoints

Everything below is client-side and safe to be public.

| Purpose | Value |
| --- | --- |
| Google Analytics | gtag `G-HEW8DMVSQ0` |
| Contact form | `https://formspree.io/f/xzznwyay` |
| Background video | `https://pub-5ac53b554a7a41cfa02002794e034c48.r2.dev/main/*.mp4` |
| Instagram proxy | `https://ig-proxy.kosei-find20.workers.dev` (`/media`, `/profile`) — token stays in the Worker |

### Maintenance notes

- Content changes usually need to be made in **both** the EN and JA HTML files (and both 100-things
  files). Watch the relative asset paths (`../`, `../../`) between folders.
- Cache-busting is manual via `?v=YYYYMMDD` query strings on CSS/JS links.
- Deployment configuration is **not** in this repo (no CI / hosting config committed).

### License

© Kosei Ayabe. Personal project — content and code are not licensed for reuse.

---

## 日本語

### 概要

- 1 ページ構成のポートフォリオ（`/`）と、独立した **「100 Things」ページ**（`/100/`）。
- 完全バイリンガル: 英語版は `/`、日本語版は `/ja/`（HTML をミラー）。
- HTML / JS にビルド工程はなし。**SCSS だけを手動で CSS にコンパイル**する。
- `public/` が Web ルート。フォルダの中身をそのままデプロイする。

### 技術スタック

| 領域 | 採用技術 |
| --- | --- |
| マークアップ | 素の HTML（テンプレートエンジンなし） |
| スタイル | SCSS → **Dart Sass**（npm `sass`）でコンパイル。テーマは CSS カスタムプロパティ |
| スクリプト | 素の JavaScript ＋ jQuery 3.7.1 |
| スライダー | [Swiper](https://swiperjs.com/)（CDN） — HISTORY のタイムライン |
| モーダル | [Modaal](https://github.com/humaan/Modaal)（jQuery プラグイン、同梱） — 画像ギャラリー＋Works カード |
| アイコン/フォント | Font Awesome 6 / Devicon / Google Fonts（Didact Gothic・M PLUS 1p・Titillium Web） |
| アクセス解析 | Google Analytics（gtag） |
| お問い合わせフォーム | [Formspree](https://formspree.io/) |
| 背景動画 | Cloudflare R2（テーマごとの `.mp4`） |
| Instagram フィード | Instagram Graph API を、自前の **Cloudflare Worker** プロキシ経由で取得（トークンはサーバー側に保持） |

外部ライブラリはすべて CDN 読み込み。npm によるインストールは行っていない。

### ディレクトリ構成

```
public/                     ← Web ルート（ここをデプロイ）
├── index.html              英語トップページ（1ページ構成）
├── ja/index.html           日本語トップページ
├── 100/index.html          「100 Things」ページ（英語）
├── ja/100/index.html       「100 Things」ページ（日本語）
├── css/
│   ├── main.css(.map)      scss/main.scss のコンパイル成果物 — コミット対象
│   ├── 100.css             「100 Things」用スタイル（手書き、SCSS なし）
│   ├── modaal.css          Modaal 用スタイル（ベンダー）
│   └── ig-embed.css        Instagram 埋め込み用（ベンダーキット）
├── scss/
│   ├── main.scss           エントリ: _style とテーマ partial を @use
│   ├── _style.scss         スタイル本体
│   ├── modaal.scss         Modaal v0.4.4 のソース（ベンダー。ビルドには含まれない）
│   └── themes/_theme_*.scss  5 テーマ（CSS 変数セット）
├── script/
│   ├── headerScroll.js     固定ヘッダーのスクロール挙動の共通関数（initHeaderScroll）
│   ├── script.js           トップページの挙動（タイピング、スキルバー、Swiper 初期化、メニュー…）
│   ├── hundred.js          「100 Things」ページ用（ヘッダースクロール＋モバイルメニュー）
│   ├── themeSwitcher.js    テーマ切替＋背景動画の差し替え
│   ├── ig-embed.js         Instagram 取得・描画（外部キット由来）
│   └── modaal.js           Modaal 本体（ベンダー）
└── images/                 profile / timeline / works / icon / 100-things
```

### ローカル開発

`public/` を任意の静的サーバーで配信する。VS Code Live Server の場合はポートが **5501** に設定済み
（`public/.vscode/settings.json`）なので、`public/index.html` を「Go Live」で開く。

CSS のビルド（Node.js が必要）:

```bash
npm install          # 初回のみ: Dart Sass を入れる
npm run build:css    # public/scss/main.scss → public/css/main.css
npm run watch:css    # 変更監視して自動コンパイル
```

- `.scss` を編集したら再コンパイルし、`css/main.css` と `css/main.css.map` を一緒にコミットする。
- `css/100.css` / `css/modaal.css` / `css/ig-embed.css` は SCSS 非経由。直接編集する。

### セクション

トップページ: メインビジュアル（動画）・Profile・Skills・History（Swiper タイムライン）・
Works（案件 5 件、モーダルで詳細）・Gallery（Instagram）・100 Things（予告 →『/100/』）・
Contact（Formspree）・Footer。

### テーマ

`normal-day` / `normal-night` / `forest` / `ocean` / `land` の 5 種を `<html data-theme>` で切替。
テーマごとに CSS カスタムプロパティ（`scss/themes/_theme_*.scss`）と R2 の背景動画を差し替える。
初期テーマはロードごとにランダム選択（保存はしない）。

### 外部サービス / エンドポイント

いずれもクライアント側に露出する値で、公開して問題ないもの。

| 用途 | 値 |
| --- | --- |
| Google Analytics | gtag `G-HEW8DMVSQ0` |
| お問い合わせフォーム | `https://formspree.io/f/xzznwyay` |
| 背景動画 | `https://pub-5ac53b554a7a41cfa02002794e034c48.r2.dev/main/*.mp4` |
| Instagram プロキシ | `https://ig-proxy.kosei-find20.workers.dev`（`/media`, `/profile`） — トークンは Worker 側 |

### メンテナンスメモ

- 内容の変更は通常、**英語版と日本語版の両方**の HTML（および 100 Things の 2 ファイル）に反映が必要。
  フォルダ階層で変わるアセットの相対パス（`../`, `../../`）に注意。
- キャッシュバスターは CSS/JS リンクの `?v=YYYYMMDD` を手動更新。
- デプロイ設定はこのリポジトリに含まれていない（CI・ホスティング設定は未コミット）。

### ライセンス

© Kosei Ayabe. 個人プロジェクトのため、コンテンツおよびコードの再利用ライセンスは付与していません。
