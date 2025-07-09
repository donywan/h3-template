-- 测试环境数据库初始化脚本
-- 这个脚本会在测试 PostgreSQL 容器首次启动时执行

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 创建测试表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    department VARCHAR(255),
    salary_min INTEGER,
    salary_max INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 测试专用表
CREATE TABLE IF NOT EXISTS test_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_positions_title ON positions(title);
CREATE INDEX IF NOT EXISTS idx_positions_department ON positions(department);
CREATE INDEX IF NOT EXISTS idx_test_data_name ON test_data(name);

-- 插入测试数据
INSERT INTO users (email, name, password_hash) VALUES
    ('test@example.com', 'Test User', crypt('test123', gen_salt('bf'))),
    ('admin@test.com', 'Test Admin', crypt('admin123', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;

INSERT INTO positions (title, description, department, salary_min, salary_max) VALUES
    ('测试工程师', '负责软件测试', '质量保证部', 60000, 90000),
    ('自动化测试工程师', '负责自动化测试开发', '质量保证部', 70000, 100000)
ON CONFLICT DO NOTHING;

-- 插入测试专用数据
INSERT INTO test_data (name, value) VALUES
    ('test_config', '{"env": "test", "debug": true}'),
    ('test_sample', 'sample test data')
ON CONFLICT DO NOTHING;

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为表添加更新时间触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_positions_updated_at ON positions;
CREATE TRIGGER update_positions_updated_at
    BEFORE UPDATE ON positions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建测试专用函数
CREATE OR REPLACE FUNCTION cleanup_test_data()
RETURNS void AS $$
BEGIN
    DELETE FROM test_data WHERE name LIKE 'temp_%';
    DELETE FROM users WHERE email LIKE '%@test.temp';
    DELETE FROM positions WHERE title LIKE 'TEST_%';
END;
$$ LANGUAGE plpgsql;

-- 创建测试数据生成函数
CREATE OR REPLACE FUNCTION generate_test_users(count INTEGER DEFAULT 10)
RETURNS void AS $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 1..count LOOP
        INSERT INTO users (email, name, password_hash) VALUES
            ('test_user_' || i || '@test.temp', 'Test User ' || i, crypt('test123', gen_salt('bf')))
        ON CONFLICT (email) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
