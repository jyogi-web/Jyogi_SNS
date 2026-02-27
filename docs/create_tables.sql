-- ============================================================
-- Tikuru24 Supabase テーブル作成 SQL
-- Supabase の SQL エディタに貼り付けて実行してください
-- ============================================================


-- ============================================================
-- 1. usels（ユーザープロフィール）
-- ============================================================
CREATE TABLE public.usels (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE NOT NULL,
  displayName TEXT,
  setID       TEXT,
  icon_url    TEXT,
  banner_url  TEXT,
  introduction TEXT,
  place       TEXT,
  site        TEXT,
  birth_date  DATE,
  follow      INTEGER DEFAULT 0,
  isBunkatsu  BOOLEAN DEFAULT FALSE,
  has_posted  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.usels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usels_select" ON public.usels FOR SELECT USING (true);
CREATE POLICY "usels_insert" ON public.usels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "usels_update" ON public.usels FOR UPDATE USING (auth.uid() = user_id);


-- ============================================================
-- 2. todos（投稿）
-- ============================================================
CREATE TABLE public.todos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.usels(user_id) ON DELETE CASCADE,
  username   TEXT,
  title      TEXT NOT NULL,
  tags       TEXT[],
  likes      INTEGER DEFAULT 0,
  image_url  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "todos_select" ON public.todos FOR SELECT USING (true);
CREATE POLICY "todos_insert" ON public.todos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "todos_update" ON public.todos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "todos_delete" ON public.todos FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX todos_user_id_idx     ON public.todos(user_id);
CREATE INDEX todos_created_at_idx  ON public.todos(created_at DESC);


-- ============================================================
-- 3. likes（いいね）
-- ============================================================
CREATE TABLE public.likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.usels(user_id) ON DELETE CASCADE,
  "on"       BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes_select" ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_update" ON public.likes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "likes_delete" ON public.likes FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 4. bookmarks（ブックマーク）
-- ============================================================
CREATE TABLE public.bookmarks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.usels(user_id) ON DELETE CASCADE,
  "on"       BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookmarks_select" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_insert" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookmarks_update" ON public.bookmarks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_delete" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 5. replies（リプライ）
-- ============================================================
CREATE TABLE public.replies (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.usels(user_id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "replies_select" ON public.replies FOR SELECT USING (true);
CREATE POLICY "replies_insert" ON public.replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "replies_delete" ON public.replies FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX replies_post_id_idx ON public.replies(post_id);


-- ============================================================
-- 6. stamp（スタンプリアクション）
-- ============================================================
CREATE TABLE public.stamp (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.usels(user_id) ON DELETE CASCADE,
  stanp_url  TEXT NOT NULL,
  UNIQUE(post_id, user_id, stanp_url)
);

ALTER TABLE public.stamp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stamp_select" ON public.stamp FOR SELECT USING (true);
CREATE POLICY "stamp_insert" ON public.stamp FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stamp_delete" ON public.stamp FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 7. make_stamp（ユーザー作成スタンプ・24時間TTL）
-- ============================================================
CREATE TABLE public.make_stamp (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  make_stanp_url TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.make_stamp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "make_stamp_select" ON public.make_stamp FOR SELECT USING (true);
CREATE POLICY "make_stamp_insert" ON public.make_stamp FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX make_stamp_created_at_idx ON public.make_stamp(created_at DESC);


-- ============================================================
-- 8. follows（フォロー関係）
-- ============================================================
CREATE TABLE public.follows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.usels(user_id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES public.usels(user_id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, followed_id),
  CHECK(follower_id <> followed_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows_select" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete" ON public.follows FOR DELETE USING (auth.uid() = follower_id);


-- ============================================================
-- 9. messages（ダイレクトメッセージ）
-- ============================================================
CREATE TABLE public.messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID NOT NULL REFERENCES public.usels(user_id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.usels(user_id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select" ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_delete" ON public.messages FOR DELETE
  USING (auth.uid() = sender_id);

CREATE INDEX messages_sender_receiver_idx ON public.messages(sender_id, receiver_id);
CREATE INDEX messages_created_at_idx      ON public.messages(created_at ASC);


-- ============================================================
-- 10. notifications（通知）
-- ============================================================
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.usels(user_id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('like','follow','mention','reply','bookmark','system')),
  title       TEXT,
  message     TEXT,
  username    TEXT,
  displayName TEXT,
  avatar      TEXT,
  post_id     UUID REFERENCES public.todos(id) ON DELETE SET NULL,
  action_url  TEXT,
  data        JSONB,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX notifications_user_id_idx    ON public.notifications(user_id);
CREATE INDEX notifications_created_at_idx ON public.notifications(created_at DESC);


-- ============================================================
-- 11. push_subscriptions（Webプッシュ購読）
-- ============================================================
CREATE TABLE public.push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL UNIQUE REFERENCES public.usels(user_id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_select" ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "push_subscriptions_insert" ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "push_subscriptions_update" ON public.push_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "push_subscriptions_delete" ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 12. notification_settings（通知設定）
-- ============================================================
CREATE TABLE public.notification_settings (
  user_id                UUID PRIMARY KEY REFERENCES public.usels(user_id) ON DELETE CASCADE,
  email_notifications    BOOLEAN DEFAULT TRUE,
  push_notifications     BOOLEAN DEFAULT TRUE,
  mention_notifications  BOOLEAN DEFAULT TRUE,
  like_notifications     BOOLEAN DEFAULT TRUE,
  retweet_notifications  BOOLEAN DEFAULT TRUE,
  follow_notifications   BOOLEAN DEFAULT TRUE,
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_settings_select" ON public.notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notification_settings_insert" ON public.notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notification_settings_update" ON public.notification_settings FOR UPDATE USING (auth.uid() = user_id);


-- ============================================================
-- 13. weather（天気投稿）
-- ============================================================
CREATE TABLE public.weather (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.usels(user_id) ON DELETE CASCADE,
  username    TEXT,
  user_avatar TEXT,
  location    TEXT NOT NULL,
  weather     TEXT NOT NULL CHECK (weather IN ('sunny','cloudy','rainy','snowy','stormy')),
  temperature FLOAT,
  humidity    FLOAT,
  wind_speed  FLOAT,
  visibility  FLOAT,
  comment     TEXT,
  image_url   TEXT,
  lat         FLOAT,
  lng         FLOAT,
  likes       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.weather ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weather_select" ON public.weather FOR SELECT USING (true);
CREATE POLICY "weather_insert" ON public.weather FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weather_update" ON public.weather FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "weather_delete" ON public.weather FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX weather_created_at_idx ON public.weather(created_at DESC);


-- ============================================================
-- 14. realction（REALction バイナリ画像）
-- ============================================================
CREATE TABLE public.realction (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bytes      BYTEA NOT NULL,
  mime       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.realction ENABLE ROW LEVEL SECURITY;

CREATE POLICY "realction_select" ON public.realction FOR SELECT USING (true);
CREATE POLICY "realction_insert" ON public.realction FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);


-- ============================================================
-- Realtime 有効化（リアルタイム更新が必要なテーブル）
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.replies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stamp;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weather;
