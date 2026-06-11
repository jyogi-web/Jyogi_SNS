import { TutorialFeature } from "@/types/tutorial";

export const TUTORIAL_FEATURES: TutorialFeature[] = [
  {
    id: "timeline",
    title: "タイムライン",
    emoji: "📝",
    shortDescription: "投稿・いいね・リプライの基本操作",
    path: "/",
    category: "basic",
    steps: [
      {
        title: "投稿を見てみよう",
        description:
          "ホーム画面では部員の投稿がリアルタイムで流れてきます。スクロールして最新の投稿を確認しましょう。",
      },
      {
        title: "いいねしてみよう",
        description:
          "投稿下部のハートアイコンをタップするといいねができます。もう一度タップするといいねを取り消せます。",
      },
      {
        title: "リプライしてみよう",
        description:
          "吹き出しアイコンをタップするとリプライフォームが開きます。投稿に対してコメントを送れます。",
      },
      {
        title: "投稿してみよう",
        description:
          "画面右下の「＋」ボタンから自分の投稿を作成できます。テキストや画像を添付して部員と共有しましょう。",
      },
    ],
  },
  {
    id: "messages",
    title: "ダイレクトメッセージ",
    emoji: "💬",
    shortDescription: "部員と1対1でメッセージ",
    path: "/messages",
    category: "basic",
    steps: [
      {
        title: "DMを始めよう",
        description:
          "DM一覧画面では過去の会話相手が一覧で表示されます。新しい会話は相手のプロフィールページから開始できます。",
      },
      {
        title: "メッセージを送ろう",
        description:
          "会話画面の下部にある入力欄にメッセージを入力して送信ボタンを押しましょう。",
      },
    ],
  },
  {
    id: "notifications",
    title: "通知",
    emoji: "🔔",
    shortDescription: "いいね・リプライ・フォローを受け取る",
    path: "/notifications",
    category: "basic",
    steps: [
      {
        title: "通知の種類",
        description:
          "いいね・リプライ・フォロー・メンションなどのアクションが通知として届きます。通知アイコンのバッジで未読数が分かります。",
      },
      {
        title: "プッシュ通知をオンにしよう",
        description:
          "設定画面でプッシュ通知をオンにすると、アプリを開いていないときもお知らせが届くようになります。",
      },
    ],
  },
  {
    id: "bookmarks",
    title: "ブックマーク",
    emoji: "🔖",
    shortDescription: "後で読みたい投稿を保存",
    path: "/bookmarks",
    category: "basic",
    steps: [
      {
        title: "ブックマークに保存しよう",
        description:
          "投稿下部のブックマークアイコンをタップすると保存されます。もう一度タップすると解除できます。",
      },
      {
        title: "保存した投稿を見よう",
        description:
          "ブックマーク一覧ページから保存した投稿をいつでも見返せます。自分だけに見えるリストです。",
      },
    ],
  },
  {
    id: "search",
    title: "検索",
    emoji: "🔍",
    shortDescription: "キーワードで過去の投稿を探す",
    path: "/search",
    category: "basic",
    steps: [
      {
        title: "キーワードで検索しよう",
        description:
          "検索バーに単語を入力すると、過去の投稿からマッチするものが表示されます。",
      },
      {
        title: "正規表現も使える",
        description:
          "「p+l」のような正規表現パターンで検索することもできます。より柔軟に過去の発言を探せます。",
      },
    ],
  },
  {
    id: "profile",
    title: "プロフィール・設定",
    emoji: "👤",
    shortDescription: "アカウントをカスタマイズ",
    path: "/profile",
    category: "basic",
    steps: [
      {
        title: "プロフィールを設定しよう",
        description:
          "アイコン・表示名・自己紹介・バナー画像などを設定できます。プロフィールページの編集ボタンから変更しましょう。",
      },
      {
        title: "通知設定を変えよう",
        description:
          "いいね・フォロー・メンションなど、通知の種類ごとにオン/オフを切り替えられます。設定ページから変更できます。",
      },
    ],
  },
  {
    id: "map",
    title: "おすすめスポット",
    emoji: "📍",
    shortDescription: "お気に入りの場所をマップで共有",
    path: "/map",
    category: "feature",
    steps: [
      {
        title: "マップでスポットを見よう",
        description:
          "マップビューでは部員が投稿したスポットがカテゴリ別のマーカーで表示されます。マーカーをタップすると詳細が見えます。",
      },
      {
        title: "リスト形式でも見られる",
        description:
          "画面上部の「一覧」ボタンでカード形式の一覧表示に切り替えられます。カテゴリ別に色分けされています。",
      },
      {
        title: "スポットを投稿しよう",
        description:
          "「投稿する」ボタンを押すと現在地が自動取得されます。スポット名・カテゴリ・写真・おすすめポイントを入力して投稿しましょう。",
      },
    ],
  },
  {
    id: "stamp",
    title: "リアクション",
    emoji: "🎨",
    shortDescription: "カスタムスタンプで反応しよう",
    path: "/reactions",
    category: "feature",
    steps: [
      {
        title: "スタンプとは",
        description:
          "投稿に対してスタンプ画像でリアクションできる機能です。Discord のカスタム絵文字に近いイメージです。",
      },
      {
        title: "スタンプを押してみよう",
        description:
          "投稿下部のスタンプアイコンをタップするとスタンプ一覧が表示されます。好きなスタンプを選んで反応しましょう。",
      },
      {
        title: "自分のスタンプを作ろう",
        description:
          "カメラで撮影した画像をその場でスタンプにできます。REALctionボタンから試してみましょう。",
      },
    ],
  },
  {
    id: "clock",
    title: "Clock",
    emoji: "🕐",
    shortDescription: "Gemini AIとチャットする",
    path: "/glok",
    category: "feature",
    steps: [
      {
        title: "ClockはAIチャット機能",
        description:
          "Gemini AIと自由に会話できる機能です。質問・相談・アイデア出しなど、何でも話しかけてみましょう。",
      },
      {
        title: "チャットを始めよう",
        description:
          "入力欄にメッセージを入力してEnterキーまたは送信ボタンを押すと、AIが返答します。新しい話題は「新しいチャット」から始められます。",
      },
      {
        title: "履歴を活用しよう",
        description:
          "過去の会話はスレッドとして保存されます。ヘッダーの履歴ボタンから過去の会話に戻れます。履歴はあなたのブラウザにのみ保存されます。",
      },
    ],
  },
  {
    id: "realction",
    title: "REALction",
    emoji: "📸",
    shortDescription: "カメラで自分のリアクション画像を作成",
    path: "/realction",
    category: "feature",
    steps: [
      {
        title: "REALctionとは",
        description:
          "カメラで自分の顔や表情を撮影して、スタンプとして使えるリアクション画像を作成できる機能です。",
      },
      {
        title: "撮影してみよう",
        description:
          "カメラが起動したら、表情を作って撮影ボタンを押しましょう。撮影した画像がリアクションとして保存されます。",
      },
      {
        title: "投稿に使おう",
        description:
          "作成したREALctionはスタンプリアクションとして投稿に添付できます。自分だけのオリジナルリアクションで盛り上げましょう。",
      },
    ],
  },
];

export const getFeature = (id: string): TutorialFeature | undefined =>
  TUTORIAL_FEATURES.find((f) => f.id === id);
