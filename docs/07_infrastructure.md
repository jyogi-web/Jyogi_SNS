# 🏗️ インフラ構成

---

# 0️⃣ 構成前提

| 項目         | 内容                              |
| ---------- | ------------------------------- |
| ホスティング     | Vercel（Next.js）                  |
| BaaS       | Supabase（DB / Auth / Realtime）   |
| オブジェクトストレージ | Cloudflare R2                   |
| 地図         | Google Maps API                 |
| プッシュ通知     | Web Push（VAPID）                  |
| リアルタイム通信   | WebSocket（ws）/ Supabase Realtime |

---

# 1️⃣ システム全体構成

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "background": "#FFFFFF",
    "primaryColor": "#EEF5FF",
    "primaryTextColor": "#0A2540",
    "primaryBorderColor": "#3572EF",
    "lineColor": "#6B7280",
    "tertiaryColor": "#F6FAFF"
  },
  "flowchart": { "curve": "basis", "nodeSpacing": 60, "rankSpacing": 80 }
}}%%
flowchart LR

    %% =======================
    %% Client Layer
    %% =======================
    subgraph CLIENT["Client Layer"]
        BROWSER["ブラウザ / PWA"]:::client
        SW["Service Worker<br/>(Push受信 / オフライン)"]:::client
    end

    %% =======================
    %% Edge / Hosting Layer
    %% =======================
    subgraph VERCEL["Vercel（Edge / Hosting）"]
        EDGE["Edge Network<br/>(CDN / TLS終端)"]:::edge
        NEXT["Next.js App<br/>(App Router / RSC)"]:::app
        API_ROUTES["API Routes<br/>(Route Handlers)"]:::app
    end

    %% =======================
    %% BaaS Layer
    %% =======================
    subgraph SUPABASE["Supabase（BaaS）"]
        AUTH["Auth<br/>(JWT / OAuth)"]:::svc
        PGDB["PostgreSQL<br/>(投稿 / ユーザー / スタンプ)"]:::db
        REALTIME["Realtime<br/>(DM / 通知)"]:::svc
    end

    %% =======================
    %% Storage Layer
    %% =======================
    subgraph STORAGE["Cloudflare R2（Storage）"]
        R2["Object Storage<br/>(画像 / アイコン / スタンプ)"]:::data
    end

    %% =======================
    %% External APIs
    %% =======================
    subgraph EXTERNAL["External APIs"]
        MAPS["Google Maps API<br/>(マップ)"]:::ext
        VAPID["Web Push<br/>(VAPID通知)"]:::ext
    end

    %% =======================
    %% 接続
    %% =======================
    BROWSER --> EDGE
    SW --> VAPID
    EDGE --> NEXT
    NEXT --> API_ROUTES
    NEXT --> AUTH
    API_ROUTES --> PGDB
    API_ROUTES --> R2
    API_ROUTES --> VAPID
    BROWSER --> MAPS
    BROWSER --> REALTIME
    AUTH --> PGDB

    %% =======================
    %% Class Definitions
    %% =======================
    classDef client fill:#fff8e6,stroke:#f59e0b,color:#4a3000;
    classDef edge fill:#fff2e6,stroke:#ff7a00,color:#4a2f00;
    classDef app fill:#e8f1ff,stroke:#3572ef,color:#0a2540;
    classDef svc fill:#eef9f1,stroke:#2a9d8f,color:#073b4c;
    classDef db fill:#f5faff,stroke:#2b6cb0,color:#0a2a4a;
    classDef data fill:#fff0fb,stroke:#b1008a,color:#4a0040;
    classDef ext fill:#f3f0ff,stroke:#7c3aed,color:#2e1065;
```

---

# 2️⃣ 各レイヤーの詳細

---

## Vercel（ホスティング / Edge）

| 項目       | 内容                                    |
| -------- | ------------------------------------- |
| 役割       | Next.js アプリのホスティング・配信                 |
| CDN      | 静的アセット・画像の自動キャッシュ                     |
| Edge     | TLS終端 / ヘッダー制御 / Service Worker配信     |
| API実行環境  | Route Handlers（Serverless Functions）   |
| 画像最適化    | `next/image`（R2ドメインをホワイトリスト登録済み）      |

設計意図：
- サーバー管理不要でフロントとAPIを一体デプロイ
- `next build --turbopack` によるビルド高速化

---

## Supabase（BaaS）

### Auth

| 項目    | 内容                         |
| ----- | -------------------------- |
| 認証方式  | メール / パスワード認証              |
| セッション | JWT（`@supabase/ssr` でSSR対応） |
| 保護    | `ProtectedRoute` コンポーネントで制御 |

### PostgreSQL

| テーブル系    | 用途               |
| -------- | ---------------- |
| 投稿・ユーザー  | SNSのコアデータ        |
| スタンプ     | カスタムリアクション       |
| DM       | メッセージデータ         |
| 通知       | 通知履歴・既読管理        |
| ブックマーク   | 保存投稿             |

### Realtime

- DM・通知のリアルタイム配信に利用
- Supabase の Postgres Changes / Broadcast を使用

---

## Cloudflare R2（オブジェクトストレージ）

| 項目      | 内容                                        |
| ------- | ----------------------------------------- |
| 用途      | 投稿画像 / アイコン / スタンプ画像の保存                   |
| アクセス方法  | AWS SDK（`@aws-sdk/client-s3`）でS3互換APIを使用  |
| URL配信   | `pub-1d11d6a89cf341e7966602ec50afd166.r2.dev` |
| 署名付きURL | `@aws-sdk/s3-request-presigner` で生成        |

設計意図：
- Vercel の帯域コスト回避のため画像はR2直配信
- S3互換なので既存SDKがそのまま使用可能

---

## 外部API

| API                | 用途             | 使用箇所                    |
| ------------------ | -------------- | ----------------------- |
| Google Maps API    | 投稿の地図表示      | `src/app/weather/`       |
| Web Push（VAPID）   | プッシュ通知送信       | `src/app/api/send-notification/` |

---

## PWA / Service Worker

| 項目        | 内容                              |
| --------- | --------------------------------- |
| マニフェスト    | `public/manifest.json`            |
| Service Worker | `public/sw.js`                |
| プッシュ受信    | Service Worker でバックグラウンド受信      |
| キャッシュ制御   | `Cache-Control: no-cache` で常に最新を配信 |

---

# 3️⃣ データフロー

## 投稿フロー

```
ユーザー
  → PostForm（画像選択）
  → /api/upload（R2に画像保存 → URL取得）
  → Supabase PostgreSQL（投稿レコード保存）
  → ホームページに反映
```

## 認証フロー

```
ユーザー
  → /auth/signup or /auth/login
  → Supabase Auth（JWT発行）
  → ProtectedRoute がセッション確認
  → 初回登録時 → /tutorial へリダイレクト
```

## プッシュ通知フロー

```
いいね / フォロー等のアクション
  → /api/send-like-notification or /api/send-notification
  → web-push（VAPID署名）
  → ブラウザの Service Worker
  → プッシュ通知表示
```

---

# 4️⃣ 環境変数一覧（必要なもの）

| 変数名                        | 用途                  |
| -------------------------- | ------------------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトURL  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー    |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase サービスロールキー |
| `R2_ACCESS_KEY_ID`         | Cloudflare R2 アクセスキー |
| `R2_SECRET_ACCESS_KEY`     | Cloudflare R2 シークレット |
| `R2_BUCKET_NAME`           | R2 バケット名            |
| `R2_ENDPOINT`              | R2 エンドポイントURL       |
| `GOOGLE_MAPS_API_KEY`      | Google Maps APIキー   |
| `VAPID_PUBLIC_KEY`         | Web Push 公開鍵        |
| `VAPID_PRIVATE_KEY`        | Web Push 秘密鍵        |

