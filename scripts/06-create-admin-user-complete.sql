-- 管理者ユーザーを作成するためのSQLスクリプト
-- 注意: このスクリプトを実行する前に、Supabase Authで以下のユーザーを手動作成してください

-- 1. Supabase Dashboard > Authentication > Users で以下のユーザーを作成:
--    Email: joker.lie@icloud.com
--    Password: Wg3P42yA
--    Email Confirmed: true

-- 2. 作成後、以下のクエリでauth_user_idを取得:
-- SELECT id, email FROM auth.users WHERE email = 'joker.lie@icloud.com';

-- 3. 取得したUUIDを使用して以下のINSERT文を実行:
-- (実際のUUIDに置き換えてください)

-- 管理者プロフィールを挿入
INSERT INTO users (auth_user_id, email, username, user_type, created_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'joker.lie@icloud.com' LIMIT 1),
  'joker.lie@icloud.com',
  'システム管理者',
  'admin',
  NOW()
) ON CONFLICT (auth_user_id) DO UPDATE SET
  user_type = 'admin',
  username = 'システム管理者';

-- 確認用クエリ
SELECT 
  u.id,
  u.email,
  u.username,
  u.user_type,
  u.created_at,
  au.email as auth_email
FROM users u
JOIN auth.users au ON u.auth_user_id = au.id
WHERE u.user_type = 'admin';
