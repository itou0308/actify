-- Create site_content table for managing terms and privacy policy
CREATE TABLE IF NOT EXISTS site_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL UNIQUE, -- 'terms' or 'privacy'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to increment user points
CREATE OR REPLACE FUNCTION increment_user_points(user_id UUID, points_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET points = COALESCE(points, 0) + points_to_add 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on site_content table
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Create policy for site_content (readable by everyone, writable by admins only)
CREATE POLICY "site_content_read_policy" ON site_content
  FOR SELECT USING (true);

CREATE POLICY "site_content_write_policy" ON site_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.user_type = 'admin'
    )
  );
