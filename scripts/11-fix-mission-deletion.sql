-- ミッション削除時の外部キー制約を確認し、CASCADE削除を設定

-- applicationsテーブルの外部キー制約を確認・修正
DO $$
BEGIN
    -- 既存の外部キー制約を削除（存在する場合）
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'applications_mission_id_fkey' 
        AND table_name = 'applications'
    ) THEN
        ALTER TABLE applications DROP CONSTRAINT applications_mission_id_fkey;
    END IF;
    
    -- CASCADE削除を含む外部キー制約を追加
    ALTER TABLE applications 
    ADD CONSTRAINT applications_mission_id_fkey 
    FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE;
END $$;

-- mission_applicationsテーブルの外部キー制約を確認・修正
DO $$
BEGIN
    -- 既存の外部キー制約を削除（存在する場合）
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'mission_applications_application_id_fkey' 
        AND table_name = 'mission_applications'
    ) THEN
        ALTER TABLE mission_applications DROP CONSTRAINT mission_applications_application_id_fkey;
    END IF;
    
    -- CASCADE削除を含む外部キー制約を追加
    ALTER TABLE mission_applications 
    ADD CONSTRAINT mission_applications_application_id_fkey 
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE;
END $$;

-- ミッション削除のRLSポリシーを確認・修正
DROP POLICY IF EXISTS "Companies can delete their own missions" ON missions;

CREATE POLICY "Companies can delete their own missions" ON missions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = company_id 
      AND users.auth_user_id = auth.uid() 
      AND users.user_type = 'company'
    )
  );

-- 確認用：現在の外部キー制約を表示
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND (tc.table_name = 'applications' OR tc.table_name = 'mission_applications')
ORDER BY tc.table_name, tc.constraint_name;
