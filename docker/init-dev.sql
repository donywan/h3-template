-- 开发环境数据库初始化脚本
-- 这个脚本会在开发 PostgreSQL 容器首次启动时执行

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 创建开发表
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

-- 开发专用表
CREATE TABLE IF NOT EXISTS dev_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_positions_title ON positions(title);
CREATE INDEX IF NOT EXISTS idx_positions_department ON positions(department);
CREATE INDEX IF NOT EXISTS idx_dev_logs_level ON dev_logs(level);
CREATE INDEX IF NOT EXISTS idx_dev_logs_created_at ON dev_logs(created_at);

-- 插入开发数据
INSERT INTO users (email, name, password_hash) VALUES
    ('dev@example.com', 'Dev User', crypt('dev123', gen_salt('bf'))),
    ('admin@dev.com', 'Dev Admin', crypt('admin123', gen_salt('bf'))),
    ('test@dev.com', 'Test User', crypt('test123', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;

INSERT INTO positions (title, description, department, salary_min, salary_max) VALUES
    ('高级软件工程师', '负责核心功能开发', '技术部', 100000, 150000),
    ('全栈开发工程师', '负责前后端开发', '技术部', 80000, 120000),
    ('DevOps 工程师', '负责运维和部署', '技术部', 90000, 130000),
    ('数据库管理员', '负责数据库维护', '技术部', 85000, 125000),
    ('技术经理', '负责技术团队管理', '技术部', 120000, 180000)
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

-- 开发环境专用函数
CREATE OR REPLACE FUNCTION log_dev_message(
    log_level VARCHAR(50),
    log_message TEXT,
    log_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO dev_logs (level, message, metadata)
    VALUES (log_level, log_message, log_metadata)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- 创建开发数据生成函数
CREATE OR REPLACE FUNCTION generate_dev_data()
RETURNS void AS $$
DECLARE
    i INTEGER;
    departments TEXT[] := ARRAY['技术部', '产品部', '设计部', '市场部', '人事部'];
    titles TEXT[] := ARRAY['工程师', '高级工程师', '专家', '经理', '总监'];
BEGIN
    -- 生成更多测试用户
    FOR i IN 1..20 LOOP
        INSERT INTO users (email, name, password_hash) VALUES
            ('user' || i || '@dev.com', 'Dev User ' || i, crypt('password' || i, gen_salt('bf')))
        ON CONFLICT (email) DO NOTHING;
    END LOOP;
    
    -- 生成更多测试职位
    FOR i IN 1..50 LOOP
        INSERT INTO positions (title, description, department, salary_min, salary_max) VALUES
            (titles[1 + (i % array_length(titles, 1))] || ' ' || i,
             '开发环境测试职位 ' || i,
             departments[1 + (i % array_length(departments, 1))],
             50000 + (i * 1000),
             80000 + (i * 1500))
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- 记录日志
    PERFORM log_dev_message('info', '开发数据生成完成', '{"users": 20, "positions": 50}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- 清理开发数据函数
CREATE OR REPLACE FUNCTION cleanup_dev_data()
RETURNS void AS $$
BEGIN
    DELETE FROM dev_logs WHERE created_at < NOW() - INTERVAL '7 days';
    DELETE FROM users WHERE email LIKE '%@temp.dev';
    DELETE FROM positions WHERE title LIKE 'TEMP_%';
    
    PERFORM log_dev_message('info', '开发数据清理完成');
END;
$$ LANGUAGE plpgsql;

-- 执行初始数据生成
SELECT generate_dev_data();
