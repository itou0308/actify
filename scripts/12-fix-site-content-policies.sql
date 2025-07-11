-- Fix RLS policies for site_content table

-- Drop existing policies
DROP POLICY IF EXISTS "site_content_read_policy" ON site_content;
DROP POLICY IF EXISTS "site_content_write_policy" ON site_content;

-- Create more specific policies for site_content
CREATE POLICY "site_content_select_policy" ON site_content
  FOR SELECT USING (true);

CREATE POLICY "site_content_insert_policy" ON site_content
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "site_content_update_policy" ON site_content
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "site_content_delete_policy" ON site_content
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid() 
      AND users.user_type = 'admin'
    )
  );

-- Verify the policies are created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'site_content';
