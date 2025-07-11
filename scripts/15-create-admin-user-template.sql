-- 管理者ユーザー作成用テンプレート
-- 以下の手順で実行してください：

-- Step 1: Supabase Dashboard > Authentication > Users で管理者ユーザーのUUIDを確認
-- Step 2: 以下のINSERT文の'YOUR_AUTH_USER_ID_HERE'を実際のUUIDに置き換えて実行

-- 例: joker.lie@icloud.com の場合
/*
INSERT INTO users (id, auth_user_id, user_type, email, username, created_at)
VALUES (
    gen_random_uuid(),
    'YOUR_AUTH_USER_ID_HERE', -- ここを実際のUUIDに置き換え
    'admin',
    'joker.lie@icloud.com',
    'システム管理者',
    NOW()
) ON CONFLICT (auth_user_id) DO UPDATE SET
    user_type = 'admin',
    username = 'システム管理者',
    updated_at = NOW();
*/

-- 管理者ユーザーが正しく作成されたかを確認
SELECT 
    u.id,
    u.auth_user_id,
    u.email,
    u.user_type,
    u.username,
    u.created_at
FROM users u
WHERE u.user_type = 'admin';

-- 使用方法:
-- 1. Supabase Dashboard > Authentication > Users を開く
-- 2. 管理者にしたいユーザーのUser UID (UUID)をコピー
-- 3. 上記のINSERT文の'YOUR_AUTH_USER_ID_HERE'を実際のUUIDに置き換え
-- 4. コメントアウトを外して実行
-- 5. 確認用クエリで管理者ユーザーが作成されたことを確認
