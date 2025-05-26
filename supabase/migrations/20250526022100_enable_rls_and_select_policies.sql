-- Enable RLS and allow SELECT for authenticated users on stores and admin_emails
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow SELECT for authenticated users on stores"
  ON stores
  FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow SELECT for authenticated users on admin_emails"
  ON admin_emails
  FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
