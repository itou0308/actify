-- コンテンツ保存問題を修正するスクリプト

-- Step 1: 現在のsite_contentテーブルの状態を確認
SELECT * FROM site_content ORDER BY type;

-- Step 2: 現在のRLSポリシーを確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'site_content';

-- Step 3: 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "site_content_authenticated_policy" ON site_content;
DROP POLICY IF EXISTS "site_content_all_policy" ON site_content;
DROP POLICY IF EXISTS "site_content_select_policy" ON site_content;
DROP POLICY IF EXISTS "site_content_insert_policy" ON site_content;
DROP POLICY IF EXISTS "site_content_update_policy" ON site_content;
DROP POLICY IF EXISTS "site_content_delete_policy" ON site_content;
DROP POLICY IF EXISTS "site_content_read_policy" ON site_content;
DROP POLICY IF EXISTS "site_content_write_policy" ON site_content;

-- Step 4: 新しいシンプルなポリシーを作成
-- 読み取りは全員に許可
CREATE POLICY "site_content_read_all" ON site_content
  FOR SELECT USING (true);

-- 書き込みは認証済みユーザーに許可（管理者チェックは後で追加）
CREATE POLICY "site_content_write_authenticated" ON site_content
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Step 5: テーブル構造を確認
\d site_content;

-- Step 6: 初期データが存在しない場合は挿入
INSERT INTO site_content (type, content, created_at, updated_at)
VALUES 
  ('terms', '# 利用規約

## 第1条（適用）
本規約は、Actify（以下「当サービス」）の利用に関して、当サービスを提供する運営者（以下「当社」）と利用者との間の権利義務関係を定めることを目的とし、利用者と当社との間の当サービスの利用に関わる一切の関係に適用されます。

## 第2条（利用登録）
利用者は、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。

## 第3条（ユーザーIDおよびパスワードの管理）
利用者は、自己の責任において、当サービスのユーザーIDおよびパスワードを適切に管理するものとします。', NOW(), NOW()),
  ('privacy', '# プライバシーポリシー

## 1. 個人情報の定義
本プライバシーポリシーにおいて、「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報を指します。

## 2. 個人情報の収集方法
当社は、利用者が利用登録をする際に氏名、生年月日、住所、電話番号、メールアドレスなどの個人情報をお尋ねすることがあります。

## 3. 個人情報を収集・利用する目的
当社が個人情報を収集・利用する目的は、以下のとおりです。
- 当社サービスの提供・運営のため
- 利用者からのお問い合わせに回答するため
- メンテナンス、重要なお知らせなど必要に応じたご連絡のため', NOW(), NOW())
ON CONFLICT (type) DO NOTHING; -- 既存データがある場合は何もしない

-- Step 7: 確認用クエリ
SELECT 
  type,
  LENGTH(content) as content_length,
  created_at,
  updated_at
FROM site_content 
ORDER BY type;

-- Step 8: 新しいポリシーを確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'site_content';
