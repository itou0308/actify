-- Step 1: 現在のusersテーブルの状態を確認
SELECT 
    u.id,
    u.auth_user_id,
    u.email,
    u.user_type,
    u.username,
    u.created_at
FROM users u
ORDER BY u.created_at;

-- Step 2: auth.usersテーブルの管理者ユーザーを確認
-- 注意: この部分は手動で確認する必要があります
-- Supabase Dashboard > Authentication > Users で確認してください

-- Step 3: 管理者ユーザーが存在しない場合の対処
-- 以下のコメントアウトされたINSERT文を、実際のUUIDに置き換えて実行してください

/*
-- 例: 実際のauth_user_idに置き換えて実行
INSERT INTO users (id, auth_user_id, user_type, email, username, created_at)
VALUES (
    gen_random_uuid(),
    'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', -- ここを実際のUUIDに置き換え
    'admin',
    'joker.lie@icloud.com', -- または実際の管理者メールアドレス
    'システム管理者',
    NOW()
) ON CONFLICT (auth_user_id) DO UPDATE SET
    user_type = 'admin',
    username = 'システム管理者',
    updated_at = NOW();
*/

-- Step 4: 管理者ユーザーの確認
SELECT 
    u.id,
    u.auth_user_id,
    u.email,
    u.user_type,
    u.username
FROM users u
WHERE u.user_type = 'admin';

-- Step 5: site_contentテーブルのRLSポリシーを一時的に緩和
-- まず既存のポリシーを削除
DROP POLICY IF EXISTS "site_content_all_policy" ON site_content;
DROP POLICY IF EXISTS "site_content_select_policy" ON site_content;
DROP POLICY IF EXISTS "site_content_insert_policy" ON site_content;
DROP POLICY IF EXISTS "site_content_update_policy" ON site_content;
DROP POLICY IF EXISTS "site_content_delete_policy" ON site_content;

-- 一時的にRLSを無効化
ALTER TABLE site_content DISABLE ROW LEVEL SECURITY;

-- 初期コンテンツを挿入
INSERT INTO site_content (type, content, created_at, updated_at)
VALUES 
    ('terms', '# 利用規約

## 第1条（適用）
本規約は、Actify（以下「当サービス」）の利用に関して、当サービスを提供する運営者（以下「当社」）と利用者との間の権利義務関係を定めることを目的とし、利用者と当社との間の当サービスの利用に関わる一切の関係に適用されます。

## 第2条（利用登録）
利用者は、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。

## 第3条（ユーザーIDおよびパスワードの管理）
利用者は、自己の責任において、当サービスのユーザーIDおよびパスワードを適切に管理するものとします。

## 第4条（利用料金および支払方法）
利用者は、当サービスの有料部分の対価として、当社が別途定め、本ウェブサイトに表示する利用料金を、当社が指定する方法により支払うものとします。

## 第5条（禁止事項）
利用者は、当サービスの利用にあたり、以下の行為をしてはなりません。
- 法令または公序良俗に違反する行為
- 犯罪行為に関連する行為
- 当社、当サービスの他の利用者、または第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為
- 当サービスによって得られた情報を商業的に利用する行為
- 当サービスの運営を妨害するおそれのある行為

## 第6条（本サービスの提供の停止等）
当社は、以下のいずれかの事由があると判断した場合、利用者に事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。', NOW(), NOW()),
    ('privacy', '# プライバシーポリシー

## 1. 個人情報の定義
本プライバシーポリシーにおいて、「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報及び容貌、指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別情報）を指します。

## 2. 個人情報の収集方法
当社は、利用者が利用登録をする際に氏名、生年月日、住所、電話番号、メールアドレス、銀行口座番号、クレジットカード番号、運転免許証番号などの個人情報をお尋ねすることがあります。

## 3. 個人情報を収集・利用する目的
当社が個人情報を収集・利用する目的は、以下のとおりです。
- 当社サービスの提供・運営のため
- 利用者からのお問い合わせに回答するため（本人確認を行うことを含む）
- 利用者が利用中のサービスの新機能、更新情報、キャンペーン等及び当社が提供する他のサービスの案内のメールを送付するため
- メンテナンス、重要なお知らせなど必要に応じたご連絡のため
- 利用規約に違反した利用者や、不正・不当な目的でサービスを利用しようとする利用者の特定をし、ご利用をお断りするため

## 4. 個人情報の第三者提供
当社は、次に掲げる場合を除いて、あらかじめ利用者の同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。

## 5. 個人情報の開示
当社は、利用者ご本人から個人情報の開示を求められたときは、利用者ご本人に対し、遅滞なくこれを開示します。', NOW(), NOW())
ON CONFLICT (type) DO UPDATE SET
    content = EXCLUDED.content,
    updated_at = NOW();

-- RLSを再度有効化
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- 新しいシンプルなポリシーを作成（認証済みユーザーのみアクセス可能）
CREATE POLICY "site_content_authenticated_policy" ON site_content
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 確認用クエリ
SELECT * FROM site_content;

-- 現在のポリシーを確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'site_content';
