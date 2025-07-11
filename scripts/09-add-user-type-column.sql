-- usersテーブルにuser_typeカラムを追加（存在しない場合のみ）
DO $$ 
BEGIN
    -- user_typeカラムが存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'user_type'
    ) THEN
        ALTER TABLE users ADD COLUMN user_type TEXT DEFAULT 'user';
    END IF;
END $$;

-- 既存のusertypeカラムからuser_typeカラムにデータを移行（usertypeカラムが存在する場合）
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'usertype'
    ) THEN
        -- usertypeからuser_typeにデータをコピー
        UPDATE users SET user_type = usertype WHERE user_type IS NULL;
        
        -- 古いusertypeカラムを削除
        ALTER TABLE users DROP COLUMN IF EXISTS usertype;
    END IF;
END $$;

-- user_typeの制約を追加
ALTER TABLE users ADD CONSTRAINT check_user_type 
CHECK (user_type IN ('user', 'company', 'admin'));

-- インデックスを追加してパフォーマンスを向上
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- 確認用クエリ
SELECT 
    id,
    email,
    username,
    user_type,
    created_at
FROM users 
WHERE user_type = 'admin'
ORDER BY created_at;
