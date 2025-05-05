-- 删除旧的测试帖子（如果需要）
DELETE FROM posts WHERE access_code = 'test-setup-123';

-- 或者，使用一个随机生成的访问码
INSERT INTO posts (title, content, purpose, tags, is_anonymous, status, access_code)
VALUES (
  'Test Post', 
  'This is a test post to verify the database setup.', 
  'need_help', 
  '{test}', 
  false, 
  'open', 
  'test-' || substr(md5(random()::text), 1, 10)
); 