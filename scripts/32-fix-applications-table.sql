-- applicationsテーブルにcreated_atとupdated_atカラムを追加
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 既存のレコードのcreated_atを現在時刻で更新（NULLの場合のみ）
UPDATE applications 
SET created_at = NOW() 
WHERE created_at IS NULL;

UPDATE applications 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

-- applicationsテーブルのstatusカラムの制約を修正
ALTER TABLE applications 
DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE applications 
ADD CONSTRAINT applications_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'in_progress'));

-- updated_atの自動更新トリガーを作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- applicationsテーブルにトリガーを適用
DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLSポリシーを修正
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Users can insert their own applications" ON applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON applications;
DROP POLICY IF EXISTS "Companies can view applications for their missions" ON applications;
DROP POLICY IF EXISTS "Companies can update applications for their missions" ON applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
DROP POLICY IF EXISTS "Admins can update all applications" ON applications;

-- 新しいRLSポリシーを作成
CREATE POLICY "Users can view their own applications" ON applications
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND 
        user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Users can insert their own applications" ON applications
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Users can update their own applications" ON applications
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND 
        user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Companies can view applications for their missions" ON applications
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND 
        mission_id IN (
            SELECT id FROM missions 
            WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "Companies can update applications for their missions" ON applications
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND 
        mission_id IN (
            SELECT id FROM missions 
            WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "Admins can view all applications" ON applications
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND 
        EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND user_type = 'admin')
    );

CREATE POLICY "Admins can update all applications" ON applications
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND 
        EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND user_type = 'admin')
    );

-- インデックスを追加してパフォーマンスを向上
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_mission_id ON applications(mission_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);
