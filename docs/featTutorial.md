# 📖 チュートリアル機能実装ドキュメント

---

## 0️⃣ 機能概要

### なにをする機能か

新規ユーザーがじょぎSNSの各機能を広く浅く学べるチュートリアル機能。

### 実装した2つのアプローチ

| 種類 | 表示タイミング | 場所 |
|------|-------------|------|
| **モーダル型** | 各機能ページへの初回訪問時に自動表示 | 各機能ページ上にオーバーレイ |
| **専用ページ型** | サイドバーの「使い方ガイド」から任意でアクセス | `/tutorial` 以下の専用ページ |

### 外部ライブラリ

なし。Tailwind CSS + React のみで実装。

---

## 1️⃣ ディレクトリ構成

```
src/
├── types/
│   └── tutorial.ts                    # TutorialFeature / TutorialStep 型定義
│
├── components/
│   └── TutorialModal.tsx              # 各機能ページで使うモーダルコンポーネント
│
└── app/
    └── tutorial/
        ├── data.ts                    # 全機能のチュートリアルデータ（単一ソース）
        ├── page.tsx                   # ハブページ（機能カード一覧）
        ├── complete/
        │   └── page.tsx               # 完了ページ
        └── [feature]/
            └── page.tsx               # 機能別スライド専用ページ（動的ルート）
```

---

## 2️⃣ 各ファイルの詳細

### `types/tutorial.ts` — 型定義

```ts
TutorialStep {
  title       // ステップタイトル
  description // ステップの説明文
}

TutorialFeature {
  id               // 機能ID（localStorage キーにも使用）
  title            // 機能名
  emoji            // 絵文字アイコン
  shortDescription // ハブページのカードに表示する短い説明
  path             // 実際の機能ページのパス
  category         // "basic"（基本操作）or "feature"（各機能）
  steps            // TutorialStep の配列
}
```

---

### `app/tutorial/data.ts` — チュートリアルデータ

全機能のコンテンツを一元管理するファイル。`TutorialModal` と専用ページの両方がここからデータを読み込む。

#### 登録済み機能一覧

| ID | タイトル | カテゴリ | ステップ数 | 対象ページ |
|----|---------|---------|---------|----------|
| `timeline` | タイムライン | basic | 4 | `/` |
| `messages` | ダイレクトメッセージ | basic | 2 | `/messages` |
| `notifications` | 通知 | basic | 2 | `/notifications` |
| `bookmarks` | ブックマーク | basic | 2 | `/bookmarks` |
| `search` | 検索 | basic | 2 | `/search` |
| `profile` | プロフィール・設定 | basic | 2 | `/profile` |
| `map` | おすすめスポット | feature | 3 | `/map` |
| `stamp` | リアクション | feature | 3 | `/reactions` |
| `clock` | Clock | feature | 3 | `/glok` |
| `realction` | REALction | feature | 3 | `/realction` |

新しい機能のチュートリアルを追加する場合は、このファイルに `TutorialFeature` オブジェクトを追記するだけでよい。

---

### `components/TutorialModal.tsx` — モーダルコンポーネント

各機能ページに配置するモーダル。`featureId` を props で受け取る。

#### 動作フロー

```
ページ表示
    ↓
localStorage に `tutorial_modal_{featureId}` が存在するか確認
    ├─ 存在する（既読）→ 何も表示しない
    └─ 存在しない（初回）→ モーダルを表示
            ↓
        ステップを「次へ」で進める
            ↓
        最後のステップで「わかった」
            ├─ localStorage にキーを書き込み
            └─ モーダルを閉じる

✕ボタン or 背景クリックでも同様に閉じる（既読扱い）
```

#### チュートリアルを再表示する方法

開発者ツールで `localStorage.removeItem("tutorial_modal_{featureId}")` を実行すると再表示される。

---

### `app/tutorial/page.tsx` — ハブページ（`/tutorial`）

サイドバーの「使い方ガイド」からアクセスできる一覧ページ。

#### 画面構成

```
基本操作（セクション）
  📝 タイムライン
  💬 ダイレクトメッセージ
  🔔 通知
  🔖 ブックマーク
  🔍 検索
  👤 プロフィール・設定

各機能（セクション）
  📍 おすすめスポット
  🎨 リアクション
  🕐 Clock
  📸 REALction
```

各カードをタップすると `/tutorial/[feature]` の専用ページへ遷移する。

---

### `app/tutorial/[feature]/page.tsx` — 機能別専用ページ

`/tutorial/timeline`、`/tutorial/map` などの動的ルート。

- `data.ts` から該当機能のステップデータを取得
- スライド形式でステップを表示
- 上部のプログレスバーで進捗を表示
- 最後のステップで「一覧に戻る」を押すと `/tutorial` へ遷移

---

## 3️⃣ モーダルの組み込み先

以下のページに `<TutorialModal featureId="xxx" />` を追加済み。

| ファイル | featureId |
|---------|----------|
| `src/app/page.tsx` | `timeline` |
| `src/app/map/page.tsx` | `map` |
| `src/app/messages/page.tsx` | `messages` |
| `src/app/notifications/page.tsx` | `notifications` |
| `src/app/bookmarks/page.tsx` | `bookmarks` |
| `src/app/search/page.tsx` | `search` |
| `src/app/realction/page.tsx` | `realction` |
| `src/app/glok/page.tsx` | `clock` |

> `profile` ページはモーダル未追加。必要に応じて同様のパターンで追加可能。

---

## 4️⃣ サイドバーへの変更

`src/components/Sidebar.tsx` の `menuItems` に以下を追加した。

```ts
{ icon: GraduationCap, label: "使い方ガイド", href: "/tutorial" }
```

---

## 5️⃣ 新機能追加時の手順

チュートリアルに新しい機能を追加する場合の手順は以下の通り。

1. `src/app/tutorial/data.ts` に `TutorialFeature` オブジェクトを追記
2. 対象ページに `<TutorialModal featureId="xxx" />` を配置
3. ハブページ（`/tutorial`）はカテゴリで自動分類されるため変更不要
