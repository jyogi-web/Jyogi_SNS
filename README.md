# Tikuru24

**Tikuru24** は、24時間で消える投稿を中心とした、リアルタイムコミュニケーション特化型のソーシャルネットワークサービス（SNS）です。

---

## 概要

Tikuru24 は「24時間」という時間制限を軸にした SNS プラットフォームです。投稿は作成から24時間が経過すると自動的に消えるため、気軽に発信しやすい環境を提供します。テキスト・画像投稿に加え、AI チャット・天気共有・ボイスチャットなど、多彩なコミュニケーション手段を備えています。

### 主な特徴

- **24時間投稿** — 投稿はタイムライン上にカウントダウン付きで表示され、24時間後に自動削除されます
- **リアルタイム更新** — Supabase Realtime を利用したリアルタイムフィード更新
- **マルチメディア対応** — テキスト・画像・スタンプリアクション・カメラキャプチャによる投稿に対応
- **PWA 対応** — スマートフォンへインストール可能なプログレッシブウェブアプリ
- **プッシュ通知** — ブラウザプッシュ通知によるリアルタイムアラート

---

## 機能一覧

### コア SNS 機能

#### ホームフィード
- 24時間限定の投稿をタイムライン形式で表示
- 残り時間をカウントダウンで確認可能
- リアルタイムで新着投稿が反映される

#### 投稿
- テキスト投稿・画像添付・タグ付けに対応
- 楽観的 UI による即時反映でストレスフリーな投稿体験

#### リアクション・スタンプ
- Discord ライクなカスタム絵文字スタンプによるリアクション機能
- スタンプ一覧ページからリアクション履歴を閲覧可能

#### いいね・ブックマーク
- 投稿へのいいね
- ブックマーク保存（後から見返す用）

#### リプライ
- 投稿へのネスト形式コメント

#### 検索
- 投稿・ユーザーのキーワード検索

#### ギャラリー
- 画像付き投稿をギャラリービューで一覧表示

#### ユーザープロフィール
- プロフィール情報（アイコン・ユーザー名・自己紹介）の閲覧・編集
- 自分の投稿履歴の確認

---

### 特徴的な機能

#### Glok（AI チャット）
- Google Gemini 2.0 Flash を利用した AI との会話機能
- チャット履歴はブラウザのローカルストレージに保存
- スレッド管理・削除に対応

#### 天気 Yohoo!（天気共有）
- 位置情報と Google Maps を連携した天気投稿機能
- 気温・湿度・視程などの気象データを投稿
- マップビュー・リストビューの切り替え対応
- 天気投稿へのコメント機能

#### TikuriBAR（ボイスチャット）
- WebSocket を用いたリアルタイムボイスチャット
- 音声レベルのビジュアライザー表示
- 複数のバールーム対応
- 通知音・効果音あり

#### REALction（リアルタイムリアクションカメラ）
- カメラで撮影したリアクション画像を投稿に添付する機能

---

### コミュニケーション

#### ダイレクトメッセージ（DM）
- ユーザー間の 1 対 1 メッセージ機能

#### 通知
- いいね・リプライ・メンション・システム通知
- 通知設定のカスタマイズ対応

---

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フロントエンド | Next.js 15 (App Router), React 19, TypeScript 5 |
| スタイリング | Tailwind CSS 4 |
| バックエンド | Next.js API Routes (Node.js) |
| データベース | Supabase (PostgreSQL) |
| 認証 | Supabase Auth (Twitter/X OAuth) |
| リアルタイム | Supabase Realtime |
| ストレージ | Cloudflare R2 (画像) |
| AI | Google Gemini 2.0 Flash |
| 地図 | Google Maps JavaScript API |
| ボイスチャット | WebSocket (ws) |
| プッシュ通知 | Web Push API |
| アイコン | Lucide React |

---

## セットアップ

### 必要な環境

- Node.js 18 以上
- Supabase プロジェクト
- Cloudflare R2 バケット
- Google Gemini API キー
- Google Maps API キー
- VAPID キー（Web Push 用）

### 環境変数

プロジェクトルートに `.env.local` を作成し、以下の変数を設定してください。

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudflare R2
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ACCOUNT_ID=

# Google API
GEMINI_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Web Push
WEB_PUSH_VAPID_PUBLIC_KEY=
WEB_PUSH_VAPID_PRIVATE_KEY=
```

### インストール・起動

```bash
# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev
```

`http://localhost:3000` をブラウザで開いてください。

### ビルド・本番起動

```bash
npm run build
npm start
```

---

## ディレクトリ構成

```
src/
├── app/
│   ├── api/          # バックエンド API ルート
│   ├── auth/         # 認証ページ（ログイン・サインアップ等）
│   ├── weather/      # 天気 Yohoo!
│   ├── tikuribar/    # TikuriBAR（ボイスチャット）
│   ├── messages/     # ダイレクトメッセージ
│   ├── notifications/ # 通知
│   ├── bookmarks/    # ブックマーク
│   ├── gallery/      # ギャラリー
│   ├── reactions/    # リアクション一覧
│   ├── realction/    # REALction
│   ├── search/       # 検索
│   ├── profile/      # ユーザープロフィール
│   ├── settings/     # 設定
│   └── page.tsx      # ホームフィード
├── components/       # 共通 React コンポーネント
├── contexts/         # React Context（認証状態等）
├── hooks/            # カスタムフック
├── lib/              # ライブラリ設定（Supabase 等）
└── types/            # TypeScript 型定義
```
