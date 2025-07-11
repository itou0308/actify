-- 管理者ユーザーを作成（Supabase Authで事前に作成されている前提）
-- 実際の運用では、Supabase Dashboardで以下の情報でユーザーを作成してください：
-- Email: joker.lie@icloud.com
-- Password: Wg3P42yA

-- 管理者プロフィールを挿入（auth_user_idは実際のUUIDに置き換える必要があります）
-- この部分は手動でSupabase Dashboardから実行してください
/*
INSERT INTO users (auth_user_id, email, username, user_type, created_at)
VALUES (
  'ここに実際のauth_user_idを入力',
  'joker.lie@icloud.com',
  'システム管理者',
  'admin',
  NOW()
);
*/
