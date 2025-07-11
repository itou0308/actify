-- missionsテーブルに新しいカラムを追加
ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS overview TEXT,
ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS required_action TEXT,
ADD COLUMN IF NOT EXISTS required_evidence TEXT,
ADD COLUMN IF NOT EXISTS target_audience TEXT,
ADD COLUMN IF NOT EXISTS categories TEXT[], -- 配列型でカテゴリを複数選択可能
ADD COLUMN IF NOT EXISTS target_region TEXT DEFAULT '全国',
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT '普通',
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- カテゴリの制約を追加
ALTER TABLE missions 
ADD CONSTRAINT check_difficulty 
CHECK (difficulty IN ('簡単', '普通', '難しい'));

ALTER TABLE missions 
ADD CONSTRAINT check_target_region 
CHECK (target_region IN ('全国', 'オンライン', '北海道', '東北', '関東', '中部', '関西', '中国・四国', '九州・沖縄'));

-- 既存のdescriptionカラムをoverviewに統合する場合（オプション）
-- UPDATE missions SET overview = description WHERE overview IS NULL;
