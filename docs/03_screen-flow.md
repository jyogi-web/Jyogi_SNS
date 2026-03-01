# 🖥️ screen-flow.md テンプレート

---

# 0️⃣ 設計前提

| 項目     | 内容                            |
| ------ | ----------------------------- |
| 対象ユーザー | 一般ユーザー / 管理者 / 未ログイン          |
| デバイス   | Desktop / Mobile / Responsive |
| 認証要否   | 公開ページあり / 全面認証制               |
| 権限制御   | RBAC / ABAC / なし              |
| MVP範囲  | P0画面のみ                        |

---

# 1️⃣ 画面一覧（Screen Inventory）

## 1️⃣ 認証系画面

| ID   | 画面名             | URL                      | 役割                              | 認証  | 優先度 |
| ---- | --------------- | ------------------------ | ------------------------------- | --- | --- |
| S-01 | ログイン            | `/auth/login`            | メール / Google / Twitter 認証      | 不要  | P0  |
| S-02 | サインアップ          | `/auth/signup`           | 新規アカウント登録                       | 不要  | P0  |
| S-03 | メール認証確認         | `/auth/verify`           | サインアップ完了 / パスワードリセットトークン確認      | 不要  | P0  |
| S-04 | パスワードリセット       | `/auth/reset-password`   | 新しいパスワードの設定                     | 不要  | P1  |

---

## 2️⃣ コア SNS 画面

| ID   | 画面名             | URL                      | 役割                              | 認証  | 優先度 |
| ---- | --------------- | ------------------------ | ------------------------------- | --- | --- |
| S-05 | ホーム（メインフィード）    | `/`                      | 投稿一覧・投稿作成・楽観的更新                 | 任意  | P0  |
| S-06 | 検索              | `/search`                | ユーザー・投稿のキーワード検索                 | 任意  | P0  |
| S-07 | マイプロフィール        | `/profile`               | 自身のプロフィール閲覧・アイコン編集              | 必須  | P0  |
| S-08 | ユーザープロフィール      | `/profile/[userId]`      | 他ユーザーのプロフィール閲覧                  | 必須  | P0  |
| S-09 | ブックマーク          | `/bookmarks`             | 保存した投稿の一覧                       | 必須  | P1  |
| S-10 | 通知一覧            | `/notifications`         | いいね・フォロー・返信通知の確認・既読管理           | 必須  | P1  |
| S-11 | 設定              | `/settings`              | アカウント設定・プッシュ通知設定                | 必須  | P1  |

---

## 3️⃣ メッセージ画面

| ID   | 画面名             | URL                      | 役割                              | 認証  | 優先度 |
| ---- | --------------- | ------------------------ | ------------------------------- | --- | --- |
| S-12 | メッセージ一覧         | `/messages`              | DM 相手のユーザー一覧・検索                 | 必須  | P1  |
| S-13 | チャット            | `/messages/[userId]`     | 1 対 1 ダイレクトメッセージ                 | 必須  | P1  |

---

## 4️⃣ リアクション / メディア画面

| ID   | 画面名             | URL                      | 役割                              | 認証  | 優先度 |
| ---- | --------------- | ------------------------ | ------------------------------- | --- | --- |
| S-14 | リアクション一覧        | `/reactions`             | スタンプ・絵文字リアクションの一覧               | 任意  | P1  |
| S-15 | リアクション投稿        | `/realction`             | Webカメラで表情キャプチャ → スタンプ投稿         | 必須  | P1  |
| S-16 | ギャラリー           | `/gallery`               | 投稿に含まれる画像の一覧閲覧                  | 任意  | P2  |

---

## 5️⃣ 特殊機能画面

| ID   | 画面名             | URL                      | 役割                              | 認証  | 優先度 |
| ---- | --------------- | ------------------------ | ------------------------------- | --- | --- |
| S-19 | TikuriBar（音声通話） | `/tikuribar`             | WebSocket / WebRTC リアルタイム音声通話ルーム | 必須  | P2  |

---

## 凡例

| 項目 | 値         | 説明                         |
| -- | --------- | -------------------------- |
| 認証 | **必須**    | `ProtectedRoute` または認証チェック必須・未認証時はログイン画面へリダイレクト |
| 認証 | **任意**    | 未ログインでも閲覧可能・一部機能のみ認証が必要    |
| 認証 | **不要**    | 認証不要（認証済み時は一部リダイレクトあり）     |
| 優先度 | **P0**   | MVP 必須（ローンチに不可欠）           |
| 優先度 | **P1**   | 初期リリース推奨（コア機能補完）           |
| 優先度 | **P2**   | 拡張機能（後続スプリント）              |


---

## 0️⃣ 設計前提

| 項目       | 内容                                                      |
| -------- | ------------------------------------------------------- |
| 対象ユーザー   | 未ログインユーザー / ログイン済みユーザー                                  |
| デバイス     | Desktop（Sidebar ナビ） / Mobile（Bottom Nav）                |
| 認証要否     | 公開ページあり（ホーム・検索・ギャラリー・天気など） / 一部機能は認証必須                  |
| 権限制御     | なし（全員同一権限）                                              |
| MVP 範囲   | P0 画面（認証系 + ホーム + 検索 + プロフィール）                          |
| 認証基盤     | Supabase Auth（メール / Google / Twitter）                   |

---

## 2️⃣ 全体遷移図（高レベル）

```mermaid
flowchart TD
    HOME["🏠 ホーム\n/"]

    subgraph AUTH["🔐 認証系"]
        LOGIN["ログイン\n/auth/login"]
        SIGNUP["サインアップ\n/auth/signup"]
        VERIFY["メール認証確認\n/auth/verify"]
        RESET["パスワードリセット\n/auth/reset-password"]
    end

    subgraph CORE["👤 コア SNS"]
        SEARCH["🔍 検索\n/search"]
        MY_PROF["マイプロフィール\n/profile"]
        USER_PROF["ユーザープロフィール\n/profile/:userId"]
        BOOKMARKS["🔖 ブックマーク\n/bookmarks"]
        NOTIF["🔔 通知一覧\n/notifications"]
        SETTINGS["⚙️ 設定\n/settings"]
    end

    subgraph MSG["💬 メッセージ"]
        MSG_LIST["メッセージ一覧\n/messages"]
        CHAT["チャット\n/messages/:userId"]
    end

    subgraph MEDIA["🎭 リアクション・メディア"]
        REACTIONS["リアクション一覧\n/reactions"]
        REALCTION["📷 リアクション投稿\n/realction"]
        GALLERY["🖼️ ギャラリー\n/gallery"]
    end

    subgraph SPECIAL["✨ 特殊機能"]
        TIKURIBAR["🎙️ TikuriBar\n/tikuribar"]
    end

    HOME -->|"未ログイン時\nナビから"| LOGIN
    LOGIN --> HOME
    LOGIN --> SIGNUP
    LOGIN --> RESET
    SIGNUP --> VERIFY
    RESET --> VERIFY
    VERIFY --> HOME

    HOME --> SEARCH
    HOME --> MY_PROF
    HOME --> BOOKMARKS
    HOME --> NOTIF
    HOME --> SETTINGS
    HOME --> MSG_LIST
    MSG_LIST --> CHAT
    HOME --> REACTIONS
    HOME --> REALCTION
    HOME --> GALLERY
    HOME --> TIKURIBAR

    SEARCH --> USER_PROF
    USER_PROF --> MSG_LIST
    USER_PROF --> REALCTION
```

---

## 3️⃣ 認証フロー

```mermaid
flowchart LR
    PUB["公開ページ\n(ホーム・検索など)"]
    AUTH_CHECK{"ログイン済み?"}
    LOGIN["ログイン\n/auth/login"]
    SIGNUP["サインアップ\n/auth/signup"]
    VERIFY["メール認証確認\n/auth/verify"]
    RESET["パスワードリセット\n/auth/reset-password"]
    HOME["ホーム /"]

    PUB --> AUTH_CHECK
    AUTH_CHECK -->|"No\n(認証必須ページ)"| LOGIN
    AUTH_CHECK -->|"Yes"| HOME
    LOGIN --> HOME
    LOGIN --> SIGNUP
    SIGNUP --> VERIFY
    VERIFY -->|"認証成功"| HOME
    LOGIN --> RESET
    RESET --> VERIFY
```

---

## 4️⃣ 投稿 CRUD 遷移

```mermaid
flowchart LR
    HOME["ホーム\n(フィード一覧)"]
    POST_FORM["投稿フォーム\n(PostForm コンポーネント)"]
    POST_DETAIL["投稿詳細\n(インライン展開)"]
    EDIT_MODAL["編集モーダル"]
    DELETE_CONFIRM["削除確認ダイアログ"]

    HOME --> POST_FORM
    POST_FORM -->|"投稿完了"| HOME
    HOME --> POST_DETAIL
    POST_DETAIL --> EDIT_MODAL
    POST_DETAIL --> DELETE_CONFIRM
    EDIT_MODAL -->|"保存"| HOME
    DELETE_CONFIRM -->|"削除確定"| HOME
    DELETE_CONFIRM -->|"キャンセル"| POST_DETAIL
```

---

## 5️⃣ リアクション投稿フロー（Webカメラ）

```mermaid
flowchart TD
    AUTH_CHECK{"ログイン済み?"}
    AUTH_CHECK -->|"No"| UNAUTH["未ログイン導線\n(/realction)"]
    UNAUTH --> LOGIN["ログイン /auth/login"]
    AUTH_CHECK -->|"Yes"| CAM["カメラ起動\n(WebcamUploader)"]
    CAM --> CAPTURE["表情キャプチャ"]
    CAPTURE --> UPLOAD["画像アップロード\n(R2 Storage)"]
    UPLOAD -->|"成功"| HOME["ホームへ戻る"]
    UPLOAD -->|"失敗"| ERR["エラートースト"]
    ERR --> CAM
```

---

## 6️⃣ DM（ダイレクトメッセージ）フロー

```mermaid
flowchart LR
    HOME["ホーム /"]
    SEARCH["検索 /search"]
    USER_PROF["ユーザープロフィール\n/profile/:userId"]
    MSG_LIST["メッセージ一覧\n/messages"]
    CHAT["チャット\n/messages/:userId"]

    HOME --> MSG_LIST
    MSG_LIST --> CHAT
    HOME --> SEARCH
    SEARCH --> USER_PROF
    USER_PROF -->|"DM ボタン"| CHAT
```

---

## 7️⃣ エラーフロー

```mermaid
flowchart TD
    ACTION["API リクエスト"]
    ACTION -->|"Success"| SUCCESS["正常状態更新\n(楽観的更新 or リロード)"]
    ACTION -->|"401 Unauthorized"| REDIRECT["ログイン画面へ\nリダイレクト"]
    ACTION -->|"Validation Error"| FORM_ERR["フォームエラー表示"]
    ACTION -->|"Server Error 5xx"| TOAST["エラートースト表示"]
```

---

## 8️⃣ モバイル考慮

| 項目        | Desktop            | Mobile                  |
| --------- | ------------------ | ----------------------- |
| ナビゲーション   | Sidebar（左固定）       | Bottom Nav              |
| 拡張ナビ      | Sidebar 内に全メニュー     | MobileExtendedNavigation |
| 投稿フォーム    | ページ内インライン          | フルスクリーン展開               |
| チャット      | 通常ページ              | フルスクリーン                 |
| カメラ（リアクション）| モーダル内              | フルスクリーン                 |

---

## 9️⃣ URL 設計

```
/                          ← ホーム（フィード）
/auth/login                ← ログイン
/auth/signup               ← サインアップ
/auth/verify               ← メール認証確認
/auth/reset-password       ← パスワードリセット
/search                    ← 検索
/profile                   ← マイプロフィール
/profile/:userId           ← ユーザープロフィール
/bookmarks                 ← ブックマーク
/notifications             ← 通知一覧
/settings                  ← 設定
/messages                  ← メッセージ一覧
/messages/:userId          ← チャット
/reactions                 ← リアクション一覧
/realction                 ← リアクション投稿（Webカメラ）
/gallery                   ← ギャラリー
/tikuribar                 ← TikuriBar 音声通話
```