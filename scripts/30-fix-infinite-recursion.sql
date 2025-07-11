-- 1. 既存のRLSポリシーをすべて削除
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view company profiles" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on auth_user_id" ON users;
DROP POLICY IF EXISTS "authenticated_users_select_own" ON users;
DROP POLICY IF EXISTS "authenticated_users_insert_own" ON users;
DROP POLICY IF EXISTS "authenticated_users_update_own" ON users;
DROP POLICY IF EXISTS "service_role_all_access" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on auth_user_id" ON users;

-- 2. RLSを一時的に無効化してテーブルをクリーンアップ
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. テーブルの権限を設定
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;
GRANT SELECT ON users TO public;

-- 4. 既存のテストユーザーを削除
DELETE FROM users WHERE email IN ('test@example.com', 'company@example.com', 'admin@example.com');
DELETE FROM auth.users WHERE email IN ('test@example.com', 'company@example.com', 'admin@example.com');

-- 5. 最もシンプルなRLSポリシーを作成
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 認証されたユーザーは自分のプロフィールを操作可能
CREATE POLICY "users_own_profile" ON users
    FOR ALL 
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

-- 匿名ユーザーでも企業プロフィールは閲覧可能
CREATE POLICY "users_view_companies" ON users
    FOR SELECT 
    USING (user_type = 'company');

-- 新しいポリシーを作成（無限再帰を避ける）
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (
        auth_user_id = auth.uid()
        OR 
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid()
        )
    );

CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (
        auth_user_id = auth.uid()
    );

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (
        auth_user_id = auth.uid()
    ) WITH CHECK (
        auth_user_id = auth.uid()
    );

-- テストユーザーを作成（既存の場合は更新）
DO $$
DECLARE
    test_user_id uuid;
    company_user_id uuid;
    admin_user_id uuid;
BEGIN
    -- 一般ユーザー
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'test@example.com',
        crypt('testpass123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ) ON CONFLICT (email) DO UPDATE SET
        encrypted_password = crypt('testpass123', gen_salt('bf')),
        updated_at = NOW()
    RETURNING id INTO test_user_id;

    -- 企業ユーザー
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'company@example.com',
        crypt('companypass123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ) ON CONFLICT (email) DO UPDATE SET
        encrypted_password = crypt('companypass123', gen_salt('bf')),
        updated_at = NOW()
    RETURNING id INTO company_user_id;

    -- 管理者ユーザー
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'admin@example.com',
        crypt('adminpass123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ) ON CONFLICT (email) DO UPDATE SET
        encrypted_password = crypt('adminpass123', gen_salt('bf')),
        updated_at = NOW()
    RETURNING id INTO admin_user_id;

    -- auth.usersからIDを取得（既存ユーザーの場合）
    IF test_user_id IS NULL THEN
        SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@example.com';
    END IF;
    
    IF company_user_id IS NULL THEN
        SELECT id INTO company_user_id FROM auth.users WHERE email = 'company@example.com';
    END IF;
    
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@example.com';
    END IF;

    -- プロフィールを作成/更新
    INSERT INTO users (auth_user_id, email, username, user_type, points, created_at, updated_at)
    VALUES 
        (test_user_id, 'test@example.com', 'testuser', 'user', 100, NOW(), NOW()),
        (company_user_id, 'company@example.com', 'testcompany', 'company', 0, NOW(), NOW()),
        (admin_user_id, 'admin@example.com', 'admin', 'admin', 0, NOW(), NOW())
    ON CONFLICT (auth_user_id) DO UPDATE SET
        email = EXCLUDED.email,
        username = EXCLUDED.username,
        user_type = EXCLUDED.user_type,
        updated_at = NOW();

    RAISE NOTICE 'Test users created successfully';
    RAISE NOTICE 'Test user ID: %', test_user_id;
    RAISE NOTICE 'Company user ID: %', company_user_id;
    RAISE NOTICE 'Admin user ID: %', admin_user_id;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating test users: %', SQLERRM;
END $$;

-- 作成されたユーザーを確認
SELECT 
    au.email,
    u.username,
    u.user_type,
    u.points
FROM auth.users au
LEFT JOIN users u ON au.id = u.auth_user_id
WHERE au.email IN ('test@example.com', 'company@example.com', 'admin@example.com')
ORDER BY au.email;

-- 8. 作成されたユーザーを確認
-- SELECT 
--     'Created users:' as info,
--     au.email,
--     u.user_type,
--     u.username,
--     u.company_name
-- FROM auth.users au
-- LEFT JOIN users u ON au.id = u.auth_user_id
-- WHERE au.email IN ('test@example.com', 'company@example.com', 'admin@example.com')
-- ORDER BY au.email;

-- 9. RLSポリシーの確認
SELECT 
    'RLS Policies:' as info,
    schemaname, 
    tablename, 
    policyname, 
    cmd
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

SELECT 'Setup completed successfully!' as status;
