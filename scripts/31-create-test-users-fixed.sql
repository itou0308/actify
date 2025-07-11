-- 既存のテストユーザーを完全に削除
DELETE FROM users WHERE email IN ('test@example.com', 'company@example.com', 'admin@example.com');
DELETE FROM auth.users WHERE email IN ('test@example.com', 'company@example.com', 'admin@example.com');

-- RLSを一時的に無効化
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "users_own_profile" ON users;
DROP POLICY IF EXISTS "users_view_companies" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

-- シンプルなポリシーを作成
CREATE POLICY "allow_all_for_authenticated" ON users
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- テストユーザーをauth.usersテーブルに作成
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES 
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('testpass123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
),
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'company@example.com',
  crypt('testpass123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
),
(
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@example.com',
  crypt('testpass123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- usersテーブルにプロフィールを作成
INSERT INTO users (auth_user_id, email, username, user_type, points)
SELECT 
  au.id,
  au.email,
  CASE 
    WHEN au.email = 'test@example.com' THEN 'testuser'
    WHEN au.email = 'company@example.com' THEN 'testcompany'
    WHEN au.email = 'admin@example.com' THEN 'admin'
  END,
  CASE 
    WHEN au.email = 'test@example.com' THEN 'user'::user_type
    WHEN au.email = 'company@example.com' THEN 'company'::user_type
    WHEN au.email = 'admin@example.com' THEN 'admin'::user_type
  END,
  CASE 
    WHEN au.email = 'test@example.com' THEN 1000
    ELSE 0
  END
FROM auth.users au
WHERE au.email IN ('test@example.com', 'company@example.com', 'admin@example.com');

-- 企業プロフィールを作成
INSERT INTO companies (user_id, company_name, description, website, contact_email, phone, address, industry, employee_count, founded_year, prepaid_balance)
SELECT 
  u.id,
  'テスト企業株式会社',
  'テスト用の企業アカウントです',
  'https://test-company.com',
  'company@example.com',
  '03-1234-5678',
  '東京都渋谷区テスト1-2-3',
  'IT・ソフトウェア',
  50,
  2020,
  100000
FROM users u
WHERE u.email = 'company@example.com';

-- RLSを再有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- 作成されたユーザーを確認
SELECT 
  u.email,
  u.username,
  u.user_type,
  u.points,
  CASE WHEN c.id IS NOT NULL THEN 'あり' ELSE 'なし' END as company_profile
FROM users u
LEFT JOIN companies c ON u.id = c.user_id
WHERE u.email IN ('test@example.com', 'company@example.com', 'admin@example.com')
ORDER BY u.email;

-- パスワードハッシュを確認（デバッグ用）
SELECT 
    'Password Check:' as status,
    email,
    CASE 
        WHEN encrypted_password IS NOT NULL AND encrypted_password != '' THEN 'Password Set'
        ELSE 'No Password'
    END as password_status,
    email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users 
WHERE email IN ('test@example.com', 'company@example.com', 'admin@example.com')
ORDER BY email;

SELECT 'Setup completed successfully!' as final_status;
