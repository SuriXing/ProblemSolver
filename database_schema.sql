-- 首先查询当前的约束情况
SELECT conname, contype, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'posts'::regclass;

-- 删除所有与 purpose 相关的约束
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT conname
        FROM pg_constraint 
        WHERE conrelid = 'posts'::regclass AND conname LIKE '%purpose%'
    LOOP
        EXECUTE 'ALTER TABLE posts DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- 更新现有数据
UPDATE posts 
SET purpose = 'need_help' 
WHERE purpose = 'seeking_help';

UPDATE posts 
SET purpose = 'offer_help' 
WHERE purpose = 'sharing_experience';

-- 添加新的约束
ALTER TABLE posts 
ADD CONSTRAINT posts_purpose_check 
CHECK (purpose IN ('need_help', 'offer_help'));

-- 验证约束是否正确设置
SELECT conname, contype, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'posts'::regclass AND conname LIKE '%purpose%';

-- 创建一个函数来获取列约束
CREATE OR REPLACE FUNCTION get_column_constraints(
  table_name text,
  column_name text
) RETURNS text[] AS $$
DECLARE
  result text[];
BEGIN
  SELECT array_agg(pg_get_constraintdef(oid))
  INTO result
  FROM pg_constraint
  WHERE conrelid = (table_name::regclass)
  AND conname LIKE '%' || column_name || '%';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql; 