# Jyogi SNS

Jyogi SNS は、Tikuru24 をフォークして部内利用向けに改造した SNS です。
リアルタイム投稿、DM、通知、検索、プロフィール、AI チャット、地図投稿を 1 つのアプリに統合しています。

## 重要: 24時間自動削除について

このリポジトリでは「投稿が 24 時間で自動削除される機能」は現在無効です。

- 投稿は自動削除されません（手動削除のみ）
- 24時間関連の表示やロジックが一部画面に残っています（下記参照）
- README は「現在の実装」を優先して記載しています

### 無料枠運用向けの外部開発について

Supabase と Cloudflare R2 の無料枠に収めるため、
「過去投稿のDB自動削除 + バックアップ」機能は別リポジトリで開発中です。

- 開発リポジトリ: https://github.com/tyumu/Jyogi_SNS_backup
- 目的: ストレージ/DB容量の圧迫を抑えつつ、必要データを退避して運用継続すること

### 残存している24時間関連（2026-03時点）

- DMチャット画面 (`/messages/[userId]`)
	- 各メッセージに砂時計アイコンと「24時間ベースの残り時間」を表示
- 投稿フォーム (`PostForm`)
	- 「24時間以内に投稿しないと制限」系のBANロジックと文言が残存
	- モーダルにも24時間関連メッセージを表示
- ホーム画面 (`/`)
	- 24時間経過を前提とした期限切れチェックのデバッグログが残存（表示UIではなくログ）

注: 認証画面の「リンク期限切れ」表示は認証トークン期限の話であり、投稿TTLとは別です。

## 削除予定一覧（24時間関連 + Glok）

以下は「削除予定機能」として、現時点でコード上に残っている主な箇所です。

### A. 24時間関連（投稿TTL/24h表示）

- DMチャット画面
	- `src/app/messages/[userId]/page.tsx`
	- 残り時間計算 (`24 * 60 * 60 * 1000`) と砂時計表示
- 投稿フォーム
	- `src/components/PostForm.tsx`
	- 24時間未投稿時のBANロジック、24時間関連モーダル文言
- ホーム画面
	- `src/app/page.tsx`
	- 24時間経過チェックのデバッグログ（表示UIではなくログ）

### B. Glok（AIチャット）

- 画面本体/配下実装
	- `src/app/glok/page.tsx`
	- `src/app/glok/types.ts`
	- `src/app/glok/components/*`
	- `src/app/glok/hooks/*`
	- `src/app/glok/globals.css`
- API連携
	- `src/app/api/gemini-api/route.ts`
- 他画面からの参照
	- `src/components/Sidebar.tsx`（`/glok` ナビ項目）
	- `src/components/MobileExtendedNavigation.tsx`（`/glok` ナビ項目）
	- `src/app/tutorial/data.ts`（Glokチュートリアル定義）

### 補足

- この一覧は「削除対象の棚卸し」です。
- 実際の削除時は、画面本体だけでなくナビゲーション・チュートリアル・関連API・補助スクリプトの参照切れを同時に解消してください。

## 実装機能一覧（現状ベース）

### SNS コア

| 機能 | 状態 | 備考 |
|---|---|---|
| 投稿作成（テキスト/画像/タグ） | 実装済み | 画像は `/api/upload` 経由で R2 に保存 |
| タイムライン表示 | 実装済み | `todos` を新着順で表示、Realtime 連携あり |
| いいね | 実装済み | `likes` と `todos.likes` を更新 |
| ブックマーク | 実装済み | `bookmarks` の on/off 管理 |
| リプライ | 実装済み | `replies` へ保存、楽観的更新あり |
| スタンプリアクション | 実装済み | `stamp` と `make_stamp` を利用 |
| 投稿検索 | 実装済み | `/api/search` + Supabase RPC `search_todos_pgroonga` |
| ユーザー検索 | 実装済み | DM画面・検索画面でユーザー一覧を利用 |

### コミュニケーション

| 機能 | 状態 | 備考 |
|---|---|---|
| 通知一覧 | 実装済み | `notifications` を取得し既読管理 |
| プッシュ通知 | 実装済み | `push_subscriptions` と Web Push API |
| いいね通知送信 | 実装済み | `/api/send-like-notification` |
| DM（1対1） | 実装済み | `messages` テーブル + Realtime |
| DM 一覧UI | 部分実装 | 一覧画面に「準備中」表現が一部残存 |

### 拡張機能

| 機能 | 状態 | 備考 |
|---|---|---|
| Glok（AIチャット） | 実装済み | `/api/gemini-api`、履歴は localStorage |
| Map（スポット投稿） | 実装済み | Google Maps API 利用、投稿・いいね対応 |
| ニュース表示 | 実装済み | `/api/news` で RSS 取得（失敗時フォールバック） |
| REALction（カメラ投稿） | 実装済み | カメラ撮影/アップロード、ギャラリー連携 |
| Reactions（お絵描き） | 実装済み | キャンバス描画 + 画像アップロード |

## 主要画面ルート

- `/` ホーム
- `/auth/login`, `/auth/signup`, `/auth/reset-password`, `/auth/verify`
- `/messages`, `/messages/[userId]`
- `/notifications`
- `/bookmarks`
- `/search`
- `/gallery`
- `/profile`, `/profile/[userId]`
- `/settings`
- `/glok`
- `/map`
- `/realction`
- `/reactions`
- `/tutorial`, `/tutorial/[feature]`, `/tutorial/complete`

## API エンドポイント

| Method | Path | 用途 |
|---|---|---|
| GET | `/api/news` | RSS ニュース取得 |
| GET | `/api/search` | 投稿検索（PGroonga RPC） |
| POST | `/api/gemini-api` | AI 応答生成 |
| POST | `/api/send-notification` | Web Push 通知送信 |
| POST | `/api/send-like-notification` | いいね通知作成 + Push |
| GET | `/api/vapid-public-key` | VAPID 公開鍵返却 |
| POST | `/api/upload` | 画像アップロード（R2） |
| POST | `/api/upload-reaction` | リアクション画像アップロード |
| GET/POST | `/api/upload-stamp` | スタンプ一覧/アップロード |
| GET | `/api/stamp-url` | スタンプ取得用署名URL |
| GET | `/api/realction/[id]` | REALction画像バイナリ取得 |
| POST | `/api/upload-icon` | アイコンアップロードAPI（プレースホルダ設定、運用前要調整） |

## 技術スタック

| カテゴリ | 採用技術 |
|---|---|
| フロントエンド | Next.js 16 (App Router), React 19, TypeScript 5 |
| スタイリング | Tailwind CSS 4 |
| BaaS | Supabase (Auth / Postgres / Realtime / Storage) |
| ストレージ | Cloudflare R2 |
| AI | Google Gemini API |
| 地図 | Google Maps JavaScript API |
| 通知 | Service Worker + Web Push |
## セットアップ

### 前提

- Node.js 18 以上（推奨 20 以上）
- npm
- Supabase プロジェクト
- Cloudflare R2

### インストール

```bash
npm install
```

### 環境変数

ルートに `.env.local` を作成し、少なくとも以下を設定してください。

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Gemini
GEMINI_API_KEY=

# Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_DEFAULT_CENTER=35.681236,139.767125
NEXT_PUBLIC_MAPS_LANG=ja
NEXT_PUBLIC_MAPS_REGION=JP

# R2 (実装は R2_TEMP_* を参照)
R2_TEMP_ENDPOINT=
R2_TEMP_ACCESS_KEY_ID=
R2_TEMP_SECRET_ACCESS_KEY=
R2_TEMP_BUCKET_NAME=

# Web Push
NEXT_PUBLIC_VAPID_KEY=
VAPID_PRIVATE_KEY=

# Optional
LOG_LEVEL=INFO
```

### 起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

### ビルド

```bash
npm run build
npm run start
```

## 新規共同開発者向けガイド

### 0. 最初に読むファイル

- `README.md`（このファイル）
- `docs/01_feature-list.md` 〜 `docs/09_schedule_and_issues.md`
- `docs/create_tables.sql`（DB 初期構築の参考）

### 1. 初日セットアップ手順

1. リポジトリを clone して `npm install` を実行
2. `.env.local` を作成し、上記環境変数を設定
3. `npm run dev` で起動
4. ログイン/サインアップ、投稿、いいね、DM、通知画面を一通り確認

### 2. 実装確認の最低チェックリスト

- ログイン/ログアウトできる
- ホームで投稿作成・いいね・ブックマーク・リプライができる
- 検索タブで検索できる
- DM 送受信できる
- 通知一覧が取得できる
- 設定画面で通知設定を保存できる

### 3. 日常開発コマンド

```bash
npm run dev
npm run lint
npm run build
```

## データモデル（主要テーブル）

- `usels` ユーザープロフィール
- `todos` 投稿
- `likes` いいね
- `bookmarks` ブックマーク
- `replies` リプライ
- `stamp` / `make_stamp` スタンプ
- `notifications` 通知
- `notification_settings` 通知設定
- `push_subscriptions` Push 購読情報
- `messages` DM
- `follows` フォロー
- `realction` リアクション画像

## 現在の注意点

- 24時間自動削除は無効です（削除は手動）
- 24時間関連の残存は「DM残り時間表示」「投稿フォームの24時間BAN文言/ロジック」「ホームのデバッグログ」です
- `/api/upload-icon` はプレースホルダ定数が残っているため、運用前に実値へ置換が必要です
