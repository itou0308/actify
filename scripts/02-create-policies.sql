-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Anyone can view company profiles" ON users
  FOR SELECT USING (user_type = 'company');

-- Missions policies
CREATE POLICY "Anyone can view missions" ON missions
  FOR SELECT USING (true);

CREATE POLICY "Companies can create missions" ON missions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = company_id 
      AND users.auth_user_id = auth.uid() 
      AND users.user_type = 'company'
    )
  );

CREATE POLICY "Companies can update their own missions" ON missions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = company_id 
      AND users.auth_user_id = auth.uid() 
      AND users.user_type = 'company'
    )
  );

-- Applications policies
CREATE POLICY "Users can view their own applications" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = user_id 
      AND users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Companies can view applications for their missions" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM missions m
      JOIN users u ON u.id = m.company_id
      WHERE m.id = mission_id 
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create applications" ON applications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = user_id 
      AND users.auth_user_id = auth.uid() 
      AND users.user_type = 'user'
    )
  );

-- Points histories policies
CREATE POLICY "Users can view their own points history" ON points_histories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = user_id 
      AND users.auth_user_id = auth.uid()
    )
  );

-- Payments policies
CREATE POLICY "Companies can view their own payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = company_id 
      AND users.auth_user_id = auth.uid() 
      AND users.user_type = 'company'
    )
  );
