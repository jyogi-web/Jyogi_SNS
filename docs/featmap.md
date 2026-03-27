# 📍 おすすめスポット機能（/map）実装ドキュメント

---

## 0️⃣ 機能概要

### なにをする機能か

ログインユーザーが「お気に入りの場所」を写真・説明文・位置情報付きで投稿し、マップまたはリスト形式で他のユーザーと共有できる機能。

### なぜ作ったか

既存の「天気Yohoo!（/weather）」はマップ上に天気情報を投稿する機能だったが、天気要素を除外し、**場所そのものの価値を共有するスポット投稿機能**として作り替えた。

### ユーザーが得られる体験

| # | 体験 |
|---|------|
| 1 | 地図の上に他ユーザーのおすすめスポットがマーカーで表示される |
| 2 | マーカーをクリックすると写真・タイトル・住所・いいね数が見える |
| 3 | 自分のスポットを写真付きで投稿できる（位置情報は自動取得） |
| 4 | リスト形式でも閲覧でき、いいね・シェアができる |

---

## 1️⃣ 画面構成とユーザーフロー

### 未ログイン時

```
/map にアクセス
    ↓
グラデーション背景のランディング画面
    ├─ 「ログインして利用開始」ボタン → /auth/login
    └─ 「新規会員登録」ボタン       → /auth/signup
```

ログインしていない場合は投稿・いいね操作ができないため、ログインを促す専用画面を表示する。

### ログイン済み時

```
/map にアクセス
    ↓
ヘッダー（マップ / 一覧 切替、投稿ボタン）
    ↓
┌──────────────┬──────────────┐
│  マップビュー   │  リストビュー  │
│  (デフォルト)   │              │
└──────────────┴──────────────┘

「投稿する」ボタンを押すと
    ↓
投稿フォーム（モーダル）が開く
    ├─ 現在地を自動取得
    ├─ スポット名・カテゴリ・写真・説明文を入力
    └─ 「投稿する」で送信
```

---

## 2️⃣ ディレクトリ構成

```
src/app/map/
│
├── page.tsx                    # ページのエントリーポイント
├── types.ts                    # TypeScript型定義・定数
│
├── data/
│   └── mockData.ts             # Supabase未接続時のフォールバックデータ
│
├── utils/
│   └── helpers.ts              # 共通ユーティリティ関数
│
├── hooks/
│   └── useSpotPosts.ts         # 投稿データの取得・操作ロジック
│
└── components/
    ├── MapHeader.tsx           # ヘッダーUI（切替・投稿ボタン）
    ├── SpotMapView.tsx         # Google Mapsを使ったマップ表示
    ├── SpotListView.tsx        # カード形式のリスト表示
    └── SpotPostForm.tsx        # 投稿フォーム（モーダル）
```

---

## 3️⃣ 各ファイルの詳細

### `types.ts` — 型定義・定数

アプリ全体で使う型と定数を一元管理している。

```ts
// カテゴリの種類
SpotCategory = "グルメ" | "自然" | "観光" | "カフェ" | "その他"

// 表示モード
ViewMode = "map" | "list"

// 投稿データの構造
SpotPost {
  id              // 投稿ID（UUID）
  user_id         // 投稿したユーザーのID
  username        // 表示名
  user_icon_url   // アイコン画像URL（任意）
  title           // スポット名
  description     // おすすめポイント（任意）
  latitude        // 緯度
  longitude       // 経度
  address         // 住所テキスト
  photo_url       // 写真URL（任意、Cloudflare R2に保存）
  category        // カテゴリ
  likes           // いいね数
  liked_by        // いいねしたユーザーIDの配列
  created_at      // 投稿日時
}
```

カテゴリごとのTailwindクラス（文字色・背景色）もここで定義しているため、
色を変えたい場合はこのファイルだけ修正すればよい。

---

### `data/mockData.ts` — モックデータ

Supabaseへの接続に失敗したとき（開発環境やテーブル未作成時など）に表示するサンプルデータ。
東京・横浜の実在する地域を参考にした4件のスポットが入っている。

> **用途**: 本番環境でSupabaseが正常であれば使われない。

---

### `utils/helpers.ts` — ユーティリティ

| 関数 | 役割 |
|------|------|
| `formatTimeAgo(dateStr)` | 日時文字列を「2時間前」「3日前」などに変換する |
| `escapeHtml(str)` | InfoWindow内のHTMLに文字列を埋め込むとき、XSS（不正スクリプト実行）を防ぐためにエスケープする |
| `compressAndUploadImage(file)` | 選択した画像をCanvas APIで最大幅800pxに縮小・JPEG圧縮し、`/api/upload` 経由でCloudflare R2にアップロードする。成功した場合はCDN URLを返す |

---

### `hooks/useSpotPosts.ts` — データ管理フック

画面コンポーネントからSupabase操作を分離するためのカスタムフック。

#### 提供するもの

| 名前 | 種類 | 説明 |
|------|------|------|
| `posts` | 状態 | 取得済み投稿の配列 |
| `loading` | 状態 | データ取得中かどうかのフラグ |
| `submitPost()` | 関数 | 新規投稿をSupabaseに保存する |
| `toggleLike()` | 関数 | いいねのオン/オフを切り替える |
| `refetch()` | 関数 | 投稿一覧を再取得する |

#### 楽観的UI（Optimistic UI）について

`submitPost` と `toggleLike` はどちらも**楽観的UI**を採用している。
これは「Supabaseの処理が完了するのを待たずに、先に画面を更新する」仕組み。

```
ユーザーがいいねボタンを押す
    ↓
すぐに画面上のいいね数が増える（楽観的更新）
    ↓
Supabaseに更新リクエストを送信
    ├─ 成功 → そのまま
    └─ 失敗 → 元の状態に戻す（ロールバック）
```

これにより、通信の遅延があっても操作感がもたつかない。

---

### `components/MapHeader.tsx` — ヘッダー

画面上部に固定されるナビゲーションバー。

**デスクトップ（lg以上）**:
```
[ホーム] [📍 おすすめスポット]           [マップ | 一覧]  [投稿する]
```

**モバイル（lg未満）**:
```
[ホーム]   [📍 おすすめスポット]   [投稿する]
[    マップ    |      一覧       ]
```

デスクトップとモバイルで構造が異なるが、TailwindのHidden/Block制御でHTML上は両方存在し、画面幅によって表示を切り替えている。

---

### `components/SpotMapView.tsx` — マップビュー

Google Maps JavaScript API を使ってインタラクティブなマップを表示する。

#### 主な機能

**① MarkerClusterer（マーカークラスタリング）**
マーカーが密集しているエリアでは自動的に数字バッジにまとめる。
ズームインすると個別のマーカーに分かれる。

**② カテゴリ別マーカー**
各スポットのカテゴリに対応した絵文字をマーカーのラベルとして使用する。

| カテゴリ | 絵文字 |
|---------|--------|
| グルメ | 🍜 |
| 自然 | 🌿 |
| 観光 | 🗺️ |
| カフェ | ☕ |
| その他 | 📍 |

**③ InfoWindow（情報ウィンドウ）**
マーカーをクリックすると吹き出しが開き、写真・スポット名・住所・投稿者・いいね数を表示する。

**④ コメントオーバーレイ**
ズームレベル14以上になると、各マーカーの上にスポット名の吹き出しが現れる。
ズームアウトすると非表示になり、地図が見やすいままになる。

**⑤ 現在地マーカー**
右上パネルの「現在地を取得」ボタンを押すと、青いパルスアニメーション付きのマーカーが表示され、地図の中心がそこに移動する。
マーカークリックで座標が表示される情報ウィンドウが開き、3秒後に自動で閉じる。

**⑥ 右上情報パネル**
投稿数・現在地ボタンをまとめたパネル。最小化ボタンで折りたたむことができる。

---

### `components/SpotListView.tsx` — リストビュー

投稿をカード形式で縦に並べる一覧表示。

- カードの背景はカテゴリごとに色が変わる（グルメ=オレンジ系、自然=グリーン系など）
- ユーザーアイコンが未設定の場合はユーザー名の頭文字をグラデーションで表示
- いいねボタンは押下時に赤く塗りつぶされ、拡大アニメーションが入る
- 投稿が0件のときは「まだ投稿がありません」の空状態画面を表示

---

### `components/SpotPostForm.tsx` — 投稿フォーム

「投稿する」ボタンを押すと画面中央にモーダルとして表示される。

#### 位置情報取得の3ステート

フォームが開いた瞬間に自動で現在地取得を開始し、状態に応じてUIが切り替わる。

```
取得中
→ スピナー付きのローディングカードを表示

失敗（許可拒否・タイムアウトなど）
→ エラー内容と「再試行」ボタンを表示

成功
→ 取得済みカードに住所テキストを表示（手動編集も可）
```

#### 入力項目

| 項目 | 必須 | 補足 |
|------|------|------|
| スポット名 | ✅ | 最大50文字 |
| カテゴリ | — | ボタン選択式。デフォルト「その他」 |
| 写真 | — | 選択後すぐプレビュー表示。送信時にR2へアップロード |
| おすすめポイント | — | 最大200文字のテキストエリア |
| 住所 | ✅（自動） | 位置情報から自動取得。手動編集可 |

#### 送信フロー

```
「投稿する」を押す
    ↓
バリデーション（スポット名・位置情報）
    ↓
写真がある場合 → R2にアップロード
    ↓
useSpotPosts.submitPost() を呼び出し
    ├─ 成功 → フォームが閉じ、リストの先頭に即時反映
    └─ 失敗 → エラーメッセージを表示してフォームは閉じない
```

---

## 4️⃣ データモデル（Supabaseテーブル）

### `spot_posts` テーブル

```sql
CREATE TABLE spot_posts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id),
  username      TEXT NOT NULL,
  user_icon_url TEXT,
  title         TEXT NOT NULL,
  description   TEXT DEFAULT '',
  latitude      DOUBLE PRECISION NOT NULL,
  longitude     DOUBLE PRECISION NOT NULL,
  address       TEXT DEFAULT '',
  photo_url     TEXT,
  category      TEXT DEFAULT 'その他',
  likes         INTEGER DEFAULT 0,
  liked_by      UUID[] DEFAULT '{}',   -- いいねしたユーザーIDの配列
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS（Row Level Security）ポリシー

| 操作 | 条件 |
|------|------|
| SELECT（閲覧） | 誰でも可 |
| INSERT（投稿） | `auth.uid() = user_id` のみ可 |
| UPDATE（更新） | `auth.uid() = user_id` のみ可 |

---

## 5️⃣ 外部サービス連携

| サービス | 用途 | 環境変数 |
|---------|------|----------|
| Google Maps JavaScript API | マップ表示・マーカー・InfoWindow | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| Google Geocoding API | 緯度経度 → 住所テキストの変換 | 同上 |
| Cloudflare R2 | 写真のアップロード・配信 | `/api/upload` 経由で処理 |
| Supabase | 投稿データの保存・取得・認証 | `NEXT_PUBLIC_SUPABASE_URL` 他 |

> Google Maps APIキーが未設定の場合、マップは表示されずエラーメッセージが出る。
> リストビューは引き続き使用可能。

---

## 6️⃣ ナビゲーションへの変更点

以下の2ファイルで「天気Yohoo!（/weather）」を「おすすめスポット（/map）」に差し替えた。

| ファイル | 変更前 | 変更後 |
|---------|-------|-------|
| `src/components/Sidebar.tsx` | `CloudSun` / 天気Yohoo! / /weather | `MapPin` / おすすめスポット / /map |
| `src/components/MobileExtendedNavigation.tsx` | 同上 | 同上 |

---

## 7️⃣ weatherテーブルからspot_postsテーブルへの変更点

### カラム比較

| カラム | weather（変更前） | spot_posts（変更後） | 変更内容 |
|--------|-----------------|-------------------|--------|
| 位置情報 | `lat FLOAT`、`lng FLOAT`（任意） | `latitude DOUBLE PRECISION NOT NULL`、`longitude DOUBLE PRECISION NOT NULL` | 必須化・精度向上 |
| スポット名 | なし | `title TEXT NOT NULL` | 新規追加（必須） |
| カテゴリ | なし | `category TEXT DEFAULT 'その他'` | 新規追加 |
| コメント | `comment TEXT` | `description TEXT DEFAULT ''` | カラム名を意味的に明確化 |
| 画像URL | `image_url TEXT` | `photo_url TEXT` | カラム名変更 |
| ユーザーアイコン | `user_avatar TEXT` | `user_icon_url TEXT` | カラム名変更 |
| 地名 | `location TEXT NOT NULL` | `address TEXT DEFAULT ''` | 必須解除（自動取得のため） |
| いいね管理 | `likes INTEGER` のみ | `likes INTEGER` + `liked_by UUID[] DEFAULT '{}'` | 誰がいいねしたかを配列で追跡（楽観的UI・重複防止のため） |
| 天気情報 | `weather_type`、`temperature`、`humidity`、`wind_speed`、`visibility` | なし | 天気機能を完全削除 |
| FK参照先 | `usels(user_id)` | `auth.users(id)` | 直接認証テーブルを参照するよう変更 |

### 設計方針の変化

| 観点 | weather | spot_posts |
|------|---------|------------|
| 位置情報の役割 | 補助的（任意） | 主役（必須・高精度） |
| いいね | カウンタのみ | カウンタ＋ユーザーID配列で二重管理 |
| カテゴリ分類 | なし | 5種類（グルメ・自然・観光・カフェ・その他） |
| スポット名 | なし | 必須入力 |

---

## 8️⃣ 開発時の注意点

### Supabaseテーブルが未作成の場合
`useSpotPosts` がエラーをキャッチし、自動的に `mockData.ts` のデータを表示する。
UIの動作確認はテーブルなしでも可能。

### Google Maps APIキーが未設定の場合
`SpotMapView` 内でAPIキーの有無を確認しており、未設定時はマップを描画しない。
リストビューへの切り替えを促すメッセージを代わりに表示する。

### 写真アップロードについて
既存の `/api/upload` エンドポイントをそのまま利用している。
このエンドポイントはベースの投稿フォーム（`PostForm.tsx`）と共用のため、
R2のストレージ容量はスポット写真も含めて一括で管理される。
