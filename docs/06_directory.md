# 📁 ディレクトリ構成図

---

# 0️⃣ 設計前提

| 項目      | 内容                                 |
| ------- | ---------------------------------- |
| リポジトリ構成 | Monorepo（単一リポジトリ）                   |
| アーキテクチャ | Next.js App Router（Feature分割）        |
| デプロイ単位  | 単一サービス（フロントエンド＋APIルート一体型）           |
| 言語      | TypeScript                         |
| MVP方針   | P0に必要なディレクトリのみ                     |

---

# 1️⃣ 全体構成

```
Jyogi_SNS/
├── src/               # アプリケーションソース
├── public/            # 静的ファイル（画像・PWA関連）
├── docs/              # 設計書
├── next.config.ts     # Next.js設定
├── package.json       # 依存パッケージ管理
├── eslint.config.mjs  # ESLintルール設定
├── postcss.config.mjs # PostCSS設定（Tailwind等）
├── .nvmrc             # Node.jsバージョン固定
└── README.md          # プロジェクト概要
```

---

# 2️⃣ フロントエンド構成（Next.js App Router）

```
src/
├── app/               # ルーティング層（App Router）
│   ├── layout.tsx     # グローバルレイアウト
│   ├── page.tsx       # ホーム（タイムライン）
│   ├── globals.css    # グローバルスタイル
│   ├── favicon.ico    # ファビコン
│   │
│   ├── auth/          # 認証関連ページ
│   │   ├── login/             # ログインページ
│   │   ├── signup/            # 新規登録ページ
│   │   ├── reset-password/    # パスワードリセット
│   │   └── verify/            # メール認証確認
│   │
│   ├── profile/       # プロフィールページ
│   │   ├── page.tsx           # 自分のプロフィール
│   │   └── [userId]/          # 他ユーザーのプロフィール
│   │
│   ├── messages/      # DM・メッセージ
│   │   ├── page.tsx           # DM一覧
│   │   └── [userId]/          # 個別チャット
│   │
│   ├── tutorial/      # チュートリアル
│   │   ├── page.tsx           # チュートリアル本体
│   │   └── complete/
│   │       └── page.tsx       # 完了ページ
│   │
│   ├── notifications/ # 通知ページ
│   ├── bookmarks/     # ブックマーク
│   ├── search/        # 検索
│   ├── reactions/     # リアクション一覧
│   ├── settings/      # 設定
│   ├── gallery/       # 画像ギャラリー
│   │   ├── DbImage.tsx        # DB画像取得コンポーネント
│   │   └── GalleryClient.tsx  # ギャラリークライアントコンポーネント
│   │
│   ├── realction/     # スタンプ機能（カスタムリアクション）
│   │   └── fonts.ts           # スタンプ用フォント定義
│   │
│   └── api/           # APIルート（Next.js Route Handlers）
│       ├── realction/[id]/    # スタンプリアクション（投稿IDで絞り込み）
│       ├── send-notification/ # プッシュ通知送信
│       ├── send-like-notification/ # いいね通知送信
│       ├── upload/            # 投稿画像アップロード
│       ├── upload-icon/       # アイコン画像アップロード
│       ├── upload-reaction/   # リアクション画像アップロード
│       ├── vapid-public-key/  # Web Push公開鍵の配信
│
├── components/        # 共通UIコンポーネント
│   ├── Post.tsx               # 投稿カード
│   ├── PostForm.tsx           # 投稿フォーム
│   ├── Sidebar.tsx            # サイドバーナビゲーション（PC）
│   ├── MobileNavigation.tsx   # モバイルナビ（下部タブバー）
│   ├── MobileExtendedNavigation.tsx  # モバイル拡張ナビ
│   ├── Message.tsx            # メッセージアイテム
│   ├── MessageListItem.tsx    # DM一覧の行コンポーネント
│   ├── Notification.tsx       # 通知アイテム
│   ├── NotificationSettings.tsx      # 通知設定UI
│   ├── ProtectedRoute.tsx     # 認証ガード（未ログイン時リダイレクト）
│   ├── AuthLoadingFallback.tsx       # 認証確認中のフォールバック表示
│   ├── LoadingScreen.tsx      # ローディング画面
│   ├── LoadingScreenWrapper.tsx      # ローディング制御ラッパー
│   ├── WebcamUploader.tsx     # カメラ撮影・アップロード
│   ├── PWAInstaller.tsx       # PWAインストール促進UI
│   └── ServiceWorkerRegistration.tsx # Service Worker登録処理
│
├── contexts/          # Reactコンテキスト
│   └── AuthContext.tsx        # 認証状態管理
│
├── hooks/             # 共通カスタムフック
│   └── usePushNotifications.ts       # Web Pushの購読・解除フック
│
├── lib/               # 外部サービスクライアント
│   ├── supabase/
│   │   └── client.ts          # Supabaseクライアント
│   └── tikuribar/
│       └── websocketServer.ts # WebSocketサーバー
│
├── utils/             # ユーティリティ
│   └── supabase/
│       ├── client.ts          # ブラウザ用Supabaseクライアント
│       └── server.ts          # サーバー用Supabaseクライアント
│
├── data/              # モックデータ
│   ├── mockData.ts            # 投稿・ユーザーのモックデータ
│   ├── mockMessageData.ts     # DMのモックデータ
│   └── mockNotificationData.ts # 通知のモックデータ
│
├── scripts/           # スクリプト
│   └── startTikuriBarServer.ts # TikuriBarのWebSocketサーバー起動スクリプト
│
└── types/             # 型定義
    ├── index.ts               # 共通型定義（ユーザー・投稿等）
    ├── post.ts                # 投稿関連の型定義
    ├── stanp.ts               # スタンプ関連の型定義
    └── tutorial.ts            # チュートリアルのステップ型定義
```

---

# 3️⃣ 静的ファイル構成

```
public/
├── Tikuru24logo.png           # ロゴ
├── manifest.json              # PWAマニフェスト
├── sw.js                      # Service Worker
├── android-launchericon-*.png # PWAアイコン各サイズ
├── canvas.html / .css / .js   # キャンバス機能
└── *.svg                      # SVGアイコン
```

---

# 4️⃣ ドキュメント構成

```
docs/
├── 01_feature-list_md.md      # 機能一覧
├── 03_screen-flow_md.md       # 画面遷移図
├── 04_permission-design.md    # 権限設計
├── 05_erd.md                  # ERD
├── 06_directory.md            # ディレクトリ構成（本ファイル）
├── 07_infrastructure.md       # インフラ構成
├── 08_logging.md              # ログ設計
├── 09_schedule_and_issues_md.md # スケジュール・課題管理
├── stanp_table_design.md      # スタンプテーブル設計
└── create_tables.sql          # テーブル作成SQL
```
