-- 管理者ユーザーを作成するためのスクリプト
-- 注意: このスクリプトを実行する前に、Supabase Authで管理者アカウントを手動で作成する必要があります

-- 1. まず、Supabase Dashboard > Authentication > Users で以下の情報で新しいユーザーを作成してください：
-- Email: admin@actify.com
-- Password: AdminPassword123!
-- Email Confirmed: Yes

-- 2. 作成されたユーザーのUUIDを確認し、以下のクエリのUSER_UUIDを実際のUUIDに置き換えてください

-- 管理者プロフィールをusersテーブルに挿入
-- 実際のUUIDに置き換えてください
INSERT INTO users (id, email, usertype, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- ここを実際のUUIDに置き換えてください
  'admin@actify.com',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  usertype = 'admin',
  updated_at = NOW();

-- 管理者ユーザーが正しく作成されたかを確認
SELECT id, email, usertype, created_at FROM users WHERE usertype = 'admin';

-- 使用方法:
-- 1. Supabase Dashboard > Authentication > Users で管理者ユーザーを作成
-- 2. 作成されたユーザーのUUIDをコピー
-- 3. 上記のINSERT文の'00000000-0000-0000-0000-000000000000'を実際のUUIDに置き換え
-- 4. このスクリプトを実行
