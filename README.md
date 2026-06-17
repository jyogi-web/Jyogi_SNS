# Jyogi SNS (じょぎSNS)

Jyogi SNS は、Tikuru24 をフォークして部内利用向けに改造したプライベートSNSです。
リアルタイム投稿、DM、通知、検索、プロフィール、地図投稿、カメラ撮影・スタンプ作成などを1つに統合したNext.jsアプリケーションです。

---

## ⚠️ 動作仕様と制限（現状）

### 24時間自動削除について
**本リポジトリでは、投稿やスタンプが24時間で自動削除される機能（TTL）は無効です。**
- 投稿は自動削除されず、手動削除のみ可能です。
- 過去投稿の自動クリーンアップとバックアップは、別リポジトリ（`Jyogi_SNS_backup`）で開発・運用されています。
- **残存している24時間関連UI**: DMチャット画面 (`/messages/[userId]`) のメッセージ表示部に「砂時計アイコン」と「24時間ベースの残り時間」が表示されていますが、これはUI上の表示（残り時間計算）だけであり、**実際のDMメッセージは自動削除されません**。

---

## 🗑️ 削除予定機能（リファクタリング対象）

現在コードベースに残っていますが、将来的に削除（廃止）が予定されている機能です。

### 1. Glok (AIチャット) / Clock
- **表記揺れ**: サイドバーなどのナビゲーションメニューでは「Clock」（Clockアイコン）と表記されていますが、リンク先は `/glok` （Glok機能）となっています。これらは同じAIチャット機能を指しています。
- **関連ファイル**:
  - `src/app/glok/*` (画面・コンポーネント・hooks)
  - `src/app/api/gemini-api/route.ts` (API連携)
  - `src/components/Sidebar.tsx`（ナビゲーション項目）
  - `src/components/MobileExtendedNavigation.tsx`（ナビゲーション項目）
  - `src/app/tutorial/data.ts`（チュートリアル定義内の `/glok`）

### 2. DMチャットの残り時間・砂時計表示
- `src/app/messages/[userId]/page.tsx` に残存している、メッセージごとの残り時間表示ロジック（`getRemainingTime` など）および砂時計アイコン。

---

## ✨ 実装機能一覧（現状ベース）

### 📱 SNS コア
- **投稿作成**: テキスト、画像、ハッシュタグの投稿が可能。画像は R2 ストレージへアップロードされます。
- **タイムライン表示**: 新着順に投稿を表示。Supabase Realtime を用いたリアルタイム連携に対応。
- **いいね**: 投稿に対するいいね機能。楽観的更新により即座にUIに反映されます。
- **ブックマーク**: お気に入り投稿の保存機能。
- **リプライ**: 投稿への返信機能。スレッド形式で表示されます。
- **スタンプリアクション**: 投稿に対するスタンプリアクション機能。
- **投稿検索**: ハッシュタグやキーワードによる全文検索（PGroonga RPC を使用）。
- **ユーザー検索**: 登録ユーザーの検索。

### 💬 コミュニケーション
- **DM (1対1チャット)**: ユーザー同士でのリアルタイムダイレクトメッセージ機能。
- **通知**: いいねやリプライの受信時に通知リストへ登録、および Web Push API を利用したプッシュ通知機能。

### 🗺️ 拡張機能
- **Map (スポット投稿)**: Google Maps API を連携し、地図上に位置情報付きのスポット投稿やいいねができる機能。
- **ニュース表示**: ニュースフィードを取得し、サイドバー（または検索画面）に表示。
- **REALction (カメラ投稿)**: カメラで撮影した画像を即時アップロードして共有する機能。
- **Reactions (スタンプ作成)**: キャンバス上に自由に描いたイラストまたは画像をアップロードしてスタンプとして共有する機能。
- **Glok (AIチャット)**: Gemini API を用いたAIアシスタント対話機能（※削除予定）。

---

## 🛤️ 主要画面ルート

- `/` : ホーム（タイムライン、新規投稿、タブ切り替え [新着 / 成果物紹介ch]）
- `/auth/login`, `/auth/signup`, `/auth/reset-password`, `/auth/verify` : 認証関連
- `/messages`, `/messages/[userId]` : DM一覧 / 個別チャット
- `/notifications` : 通知一覧
- `/bookmarks` : ブックマーク一覧
- `/search` : 投稿およびトレンド、ニュースの検索
- `/gallery` : REALction や Reactions の画像一覧ギャラリー
- `/profile`, `/profile/[userId]` : ユーザープロフィール表示・編集
- `/settings` : 通知設定等の環境設定
- `/glok` : AIチャット（Clock） ※削除予定
- `/map` : スポット地図投稿
- `/realction` : REALction（カメラ投稿）
- `/reactions` : Reactions（スタンプ）
- `/tutorial`, `/tutorial/[feature]`, `/tutorial/complete` : チュートリアル画面

---

## 🔗 主要 API エンドポイント

| メソッド | パス | 用途 |
|---|---|---|
| `GET` | `/api/news` | RSS ニュースの取得（キャッシュ制御・フォールバックあり） |
| `GET` | `/api/search` | 投稿検索（PGroonga RPC） |
| `POST` | `/api/gemini-api` | AI応答生成 ※削除予定 |
| `POST` | `/api/send-notification` | Web Push 通知送信（個別） |
| `POST` | `/api/send-like-notification` | いいね通知の作成とPush通知の送信 |
| `GET` | `/api/vapid-public-key` | VAPID公開鍵の返却 |
| `POST` | `/api/upload` | 投稿用の画像アップロード（Cloudflare R2） |
| `POST` | `/api/upload-reaction` | リアクション用の画像アップロード |
| `GET`/`POST` | `/api/upload-stamp` | スタンプ一覧の取得およびアップロード |
| `GET` | `/api/stamp-url` | スタンプ取得用のS3署名URL発行 |
| `GET` | `/api/realction/[id]` | REALction画像バイナリの取得 |
| `POST` | `/api/upload-icon` | ユーザーアイコンのアップロード（Cloudflare R2） |

---

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 16.1.6 (App Router), React 19.1.0, TypeScript 5.x
- **スタイリング**: Tailwind CSS 4.0.0
- **BaaS / データベース**: Supabase (Auth / Postgres / Realtime)
- **オブジェクトストレージ**: Cloudflare R2 (@aws-sdk/client-s3 を使用)
- **AI / LLM**: Google Gemini API (@google/genai, @google/generative-ai)
- **地図**: Google Maps JavaScript API (@googlemaps/js-api-loader)
- **プッシュ通知**: Service Worker + Web Push API

---

## ⚙️ 環境変数セットアップ

ローカル開発環境で動作させるには、プロジェクトルートに `.env.local` ファイルを作成し、以下の変数を定義してください。

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Gemini API (Glok機能で使用)
GEMINI_API_KEY=your_gemini_api_key

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_DEFAULT_CENTER=35.681236,139.767125
NEXT_PUBLIC_MAPS_LANG=ja
NEXT_PUBLIC_MAPS_REGION=JP

# Cloudflare R2 (S3互換)
R2_TEMP_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
R2_TEMP_ACCESS_KEY_ID=your_access_key_id
R2_TEMP_SECRET_ACCESS_KEY=your_secret_access_key
R2_TEMP_BUCKET_NAME=your_bucket_name
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxxxxx.r2.dev

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

---

## 🚀 起動とビルド

### 1. 依存パッケージのインストール
```bash
npm install
```

### 2. 開発サーバーの起動 (Turbopack 有効)
```bash
npm run dev
```
起動後、ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

### 3. プロダクションビルドと実行
```bash
npm run build
npm run start
```

---

## 📂 データベーステーブル構造（主要）

- `usels` : ユーザープロフィール情報（表示名、ID、紹介文、アイコンURL）
- `todos` : 投稿データ（タイトル、作成日時、タグ、R2画像URL）
- `likes` : いいねの紐付けデータ
- `bookmarks` : ブックマークの紐付けデータ
- `replies` : 投稿に対するリプライデータ
- `stamp` : 投稿に対するスタンプリアクションの記録
- `make_stamp` : ユーザーが作成したカスタムスタンプデータ
- `notifications` : システムおよびアクション通知
- `notification_settings` : ユーザーごとの通知設定
- `push_subscriptions` : プッシュ通知用のWeb Push購読情報
- `messages` : DMメッセージ（送信者、受信者、本文、作成日時）
- `follows` : フォロー・フォロワー関係データ
- `realction` : REALction機能でアップロードされた画像データ
