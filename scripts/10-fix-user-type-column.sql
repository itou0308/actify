-- user_typeカラムを追加（存在しない場合のみ）
DO $$ 
BEGIN
    -- user_typeカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'user_type'
    ) THEN
        ALTER TABLE users ADD COLUMN user_type TEXT DEFAULT 'user';
        
        -- 既存のusertypeカラムからデータを移行（存在する場合）
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'usertype'
        ) THEN
            UPDATE users SET user_type = usertype WHERE user_type IS NULL OR user_type = 'user';
        END IF;
    END IF;
END $$;

-- user_typeの制約を追加（存在しない場合のみ）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_user_type' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT check_user_type 
        CHECK (user_type IN ('user', 'company', 'admin'));
    END IF;
END $$;

-- 管理者ユーザーのuser_typeを設定
UPDATE users 
SET user_type = 'admin' 
WHERE email IN ('joker.lie@icloud.com', 'admin@actify.com') 
AND (user_type IS NULL OR user_type != 'admin');

-- 企業ユーザーのuser_typeを設定（company_nameが設定されているユーザー）
UPDATE users 
SET user_type = 'company' 
WHERE company_name IS NOT NULL 
AND company_name != '' 
AND (user_type IS NULL OR user_type = 'user');

-- インデックスを追加してパフォーマンスを向上
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- 古いusertypeカラムを削除（存在する場合）
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'usertype'
    ) THEN
        ALTER TABLE users DROP COLUMN usertype;
    END IF;
END $$;

-- 確認用クエリ
SELECT 
    id,
    email,
    username,
    user_type,
    company_name,
    created_at
FROM users 
ORDER BY user_type, created_at;
