# 技術スタック

---

## 0️⃣ プロダクト概要

| 項目        | 内容                                           |
| --------- | -------------------------------------------- |
| プロダクト名    | じょぎSNS                                     |
| プロダクト種別   | BtoC SNS（モバイルファースト PWA）                      |
| 想定ユーザー規模  | じょぎ部員数十人、将来的に拡張想定                           |
| 可用性目標     | Supabase / Vercel の SLA に準拠                  |
| セキュリティ要件  | Supabase Auth による JWT 認証・RLS によるデータ保護        |
| パフォーマンス要件 | Next.js App Router + Turbopack による高速ビルド・配信    |
| チーム体制     | 小規模チーム（フルスタック）                               |
| リリース頻度    | 随時（GitHub ベース）                               |
| 予算制約      | Supabase Free / Cloudflare R2 無料枠を最大活用        |
| 既存資産      | Supabase プロジェクト・Cloudflare R2 バケット |

---

## 1️⃣ 技術スタック構成

---

## 🖥 フロントエンド

| 項目       | 採用技術                                  | 採用理由                                       | 備考                                     |
| -------- | ------------------------------------- | ------------------------------------------ | -------------------------------------- |
| 言語       | TypeScript 5                          | 型安全性・保守性・エコシステムの充実                         | `strict: true` 設定済み                    |
| フレームワーク  | Next.js 15 (App Router)               | SSR/SSG/RSC 対応・API Routes 内包・Vercel との親和性   | Turbopack で高速ビルド                        |
| ランタイム    | React 19                              | 最新の Concurrent Features・Server Components 対応 |                                        |
| スタイリング   | Tailwind CSS 4                        | ユーティリティファーストで開発速度向上・デザイン一貫性               | PostCSS プラグイン経由                        |
| UIコンポーネント | lucide-react                          | 軽量・一貫性のあるアイコンセット                           | React 19 対応済み（overrides 設定）             |
| フォント     | next/font (Inter, Google Fonts)       | 自動最適化・FOUT 防止                              | `optimizeFonts: true`                  |
| 状態管理     | React Context API + useState/useEffect | シンプルな認証・グローバル状態管理                          | `AuthContext` で認証状態を一元管理               |
| 非同期データ   | fetch / useEffect                     | 標準 API で依存を最小化                             | Server Actions・Route Handlers と組み合わせ   |
| PWA      | Service Worker + Web Push API         | オフライン対応・プッシュ通知・ホーム画面追加                     | `sw.js`, `manifest.json` をカスタム実装       |
| 地図       | Google Maps JS API + MarkerClusterer  | 地図表示・マーカークラスタリング                           | `@googlemaps/js-api-loader` 経由          |
| Linter   | ESLint 9 + eslint-config-next         | Next.js 推奨ルールセット                           |                                        |

---

## 🧠 バックエンド

| 項目           | 採用技術                                  | 採用理由                            | 備考                               |
| ------------ | ------------------------------------- | ------------------------------- | -------------------------------- |
| 言語           | TypeScript 5 (Node.js)                | フロントとの型共有・フルスタック一貫性             |                                  |
| フレームワーク      | Next.js App Router (Route Handlers)   | フロントと同一リポジトリで API を定義・デプロイが簡潔   | `app/api/` 以下に各エンドポイントを配置        |
| API 方式       | REST (Next.js Route Handlers)         | シンプルな CRUD 操作に最適・学習コスト低          |                                  |
| 認証           | Supabase Auth                         | JWT 発行・セッション管理・OAuth 対応をマネージド提供  | `@supabase/ssr` でサーバーサイド対応        |
| DB アクセス      | Supabase JS Client                    | PostgreSQL への型安全なクエリ・RLS による認可   | ORM なし・SQL ライクな Supabase クエリを直接使用 |
| ファイルストレージ    | Cloudflare R2 (AWS S3 互換)             | S3 互換 API・無料枠が大きい・CDN 配信が容易      | `@aws-sdk/client-s3` を利用         |
| AI 連携        | Google Gemini API                     | テキスト生成・投稿アシスト機能                 | `@google/generative-ai` を利用       |
| プッシュ通知       | Web Push (VAPID)                      | ブラウザネイティブのプッシュ通知                | `web-push` ライブラリ・VAPID キー管理       |
| RSS / XML 処理 | xml2js                                | ニュースフィード取得・XML パース               | `/api/news` ルートで利用               |
| WebSocket サーバ | ws                                    | TikuriBar のリアルタイム音声バー機能          | 独立プロセスとして起動（`startTikuriBarServer.ts`） |

---

## 🗄 データベース

| 項目      | 採用技術                       | 採用理由                               | 備考                        |
| ------- | -------------------------- | ---------------------------------- | ------------------------- |
| メイン DB  | Supabase (PostgreSQL)      | フルマネージド PostgreSQL・RLS・リアルタイム機能を内包 | Supabase Free プランで運用      |
| 認証情報    | Supabase Auth (内蔵)         | ユーザー管理・JWT 発行をマネージド提供              | `auth.users` テーブルと連携      |
| ファイル    | Cloudflare R2              | 画像・メディアファイルをオブジェクトストレージで管理         | パブリック CDN URL で配信         |
| キャッシュ   | なし（現状）                     | スタートアップ段階のため未導入                    | 必要に応じて Redis 等を検討         |
| 全文検索    | Supabase (PostgreSQL FTS)  | PostgreSQL 標準の全文検索を利用可能             | 必要に応じて pgvector / Algolia へ拡張 |

---

## ☁ インフラ / DevOps

| 項目          | 採用技術                   | 採用理由                             | 備考                                    |
| ----------- | ---------------------- | -------------------------------- | ------------------------------------- |
| ホスティング      | Vercel                 | Next.js との完全統合・ゼロコンフィグデプロイ        | GitHub 連携で自動デプロイ                      |
| BaaS        | Supabase               | DB・認証・ストレージ・Edge Functions をフルマネージド | Supabase CLI でローカル開発対応                |
| オブジェクトストレージ | Cloudflare R2          | S3 互換・無料枠・Cloudflare CDN との統合     | パブリックバケットで画像配信                        |
| CDN         | Cloudflare (R2 経由)     | 画像・静的アセットのグローバルキャッシュ              |                                       |
| CI/CD       | Vercel (GitHub 連携)     | push 時に自動ビルド・デプロイ・プレビュー環境生成       |                                       |
| バージョン管理     | Git / GitHub           | ソースコード管理・Issue・PR ワークフロー          |                                       |
| ローカル開発      | Next.js dev + Turbopack | 高速 HMR・ローカル Supabase エミュレーション可能   | `npm run dev` で起動                     |

---

##  データバックアップ / アーカイブ

> DB / R2 の使用容量を定期監視し、閾値を超えたタイミングで自動的にチャットログ・画像データを Raspberry Pi へ転送して容量を節約する。実行間隔は固定せず、残量に応じて動的に決定する。

### 運用フロー

```
定期チェッカー (cron 毎週 or Supabase Scheduled Function)
  ├─ 0. Supabase DB サイズ・R2 使用量を取得
  │     ├─ 閾値未満 → スキップ（次回チェックへ）
  │     └─ 閾値超過 → バックアップワーカー起動
  │
バックアップワーカー
  ├─ 1. Supabase から対象テーブルを SELECT（前回バックアップ以降）→ JSON ファイル化
  ├─ 2. R2 から画像オブジェクトを GetObjectCommand でダウンロード
  ├─ 3. tar -czf でパッケージ化
  ├─ 4. gpg --symmetric (AES256) で暗号化
  ├─ 5. sha256sum でチェックサム生成
  ├─ 6. scp / rsync over SSH で Raspberry Pi へ転送
  └─ 7. 転送成功後に Supabase / R2 から対象データを削除して容量解放
```

### 技術要素

| 項目            | 採用技術・手法                                   | 備考                                           |
| ------------- | ----------------------------------------- | -------------------------------------------- |
| 実行場所          | クラウドワーカー（バックアップ用スクリプトをサーバーサイドで実行）         | Pi 側にクラウドキーを置かないためプッシュ方式を推奨                  |
| DB 抽出         | Supabase JS Client（期間指定 SELECT）           | `WHERE created_at >= :since` でページネーション取得     |
| 画像取得          | `@aws-sdk/client-s3` — `GetObjectCommand` | R2 からストリームでダウンロード・`stream.pipeline` でファイル保存 |
| パッケージ化        | `tar -czf` または Node.js `archiver`         | 一時ディレクトリに書き出し後、処理完了で安全に削除                    |
| 暗号化           | GPG (`--symmetric --cipher-algo AES256`)  | 公開鍵方式も可。鍵のローテーション計画を別途策定                     |
| チェックサム        | `sha256sum`                               | 転送後に Pi 側で整合性検証                              |
| 転送            | `scp` / `rsync --partial` over SSH        | `rsync --partial` で途中再開に対応                   |
| 容量監視          | Supabase `pg_database_size()` / R2 List API で使用量を定期取得 | 毎週 cron または Supabase Scheduled Function で実行          |
| トリガー判定        | DB 使用量が上限の **X%** または R2 使用量が **Y GB** を超えた場合にバックアップ起動 | 閾値は環境変数で管理し変更しやすくする                              |
| スケジューリング      | 容量チェックのみ定期実行（毎週）、バックアップは閾値超過時のみ動的に起動      | Supabase Scheduled Function / GitHub Actions Scheduled が選択肢 |
| 通知            | 成功・失敗を通知（メール / discord 等）                  | 転送エラーの早期検知                                   |
| アーカイブ先        | Raspberry Pi のローカルストレージ                  | 十分な空き容量と SSH 公開鍵認証を事前確認                      |

### 運用上の注意

| 項目         | 内容                                                |
| ---------- | ------------------------------------------------- |
| 鍵管理        | Pi の SSH 公開鍵をサーバーへ登録。GPG 鍵は安全な場所で保管しローテーション計画を持つ |
| 復元テスト      | 年 1 回程度バックアップからの復元テストを実施して実効性を保証                  |
| 増分バックアップ   | データ量が大きくなった場合は差分（rsync ベース）を検討                     |
| ログ保持ポリシー   | 法的要件・ストレージコストに応じて保持期間と消去ルールを定める                   |
| 一時ファイル管理   | 処理中の一時ファイルは限定ディレクトリに置き、完了後に削除                      |
| R2 キー管理    | 最小権限キーを使用。Pi には生キーを渡さず署名付き URL（Presigned URL）で対応  |
| 個人情報への配慮   | 保持期間・暗号化・アクセス管理について個人情報保護法の要件を満たすこと               |

---

## �🔐 セキュリティ

| 項目           | 方針・実装                                          | 備考                                           |
| ------------ | ---------------------------------------------- | -------------------------------------------- |
| 認証方式         | Supabase Auth (JWT + セッション管理)                  | `autoRefreshToken`, `persistSession` を有効化    |
| 認可           | Supabase RLS (Row Level Security)              | テーブル単位でユーザー所有リソースを保護                         |
| 通信           | HTTPS 強制 (Vercel / Cloudflare)                 | TLS 1.2+ を自動適用                               |
| 環境変数管理       | `.env.local` + Vercel 環境変数                     | シークレットをコードに含めない                              |
| PWA / SW     | Service Worker スコープ制限・`Cache-Control` ヘッダー設定   | `next.config.ts` で `sw.js` のキャッシュを `no-store` |
| Web Push     | VAPID 認証による署名付きプッシュ                            | 公開鍵を `/api/vapid-public-key` で提供             |
| ファイルアップロード   | サーバーサイドで S3 Presigned URL 発行 or バッファ経由アップロード   | クライアントに R2 シークレットを渡さない                       |
| AI 入力        | サーバーサイドで Gemini API を呼び出し・プロンプトインジェクション対策を検討中 |                                              |
