-- missionsテーブルに不足している列を追加
ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS overview TEXT,
ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS required_action TEXT,
ADD COLUMN IF NOT EXISTS required_evidence TEXT,
ADD COLUMN IF NOT EXISTS target_audience TEXT,
ADD COLUMN IF NOT EXISTS categories TEXT[],
ADD COLUMN IF NOT EXISTS target_region TEXT DEFAULT '全国',
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT '普通',
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- 制約を追加（既に存在する場合はエラーを無視）
DO $$ 
BEGIN
    -- difficulty の制約
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_difficulty' 
        AND table_name = 'missions'
    ) THEN
        ALTER TABLE missions 
        ADD CONSTRAINT check_difficulty 
        CHECK (difficulty IN ('簡単', '普通', '難しい'));
    END IF;

    -- target_region の制約
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_target_region' 
        AND table_name = 'missions'
    ) THEN
        ALTER TABLE missions 
        ADD CONSTRAINT check_target_region 
        CHECK (target_region IN ('全国', 'オンライン', '北海道', '東北', '関東', '中部', '関西', '中国・四国', '九州・沖縄'));
    END IF;
END $$;

-- 既存のレコードのデフォルト値を設定
UPDATE missions 
SET 
    overview = COALESCE(overview, description),
    max_participants = COALESCE(max_participants, 0),
    target_region = COALESCE(target_region, '全国'),
    difficulty = COALESCE(difficulty, '普通'),
    categories = COALESCE(categories, '{}')
WHERE overview IS NULL OR max_participants IS NULL OR target_region IS NULL OR difficulty IS NULL OR categories IS NULL;
