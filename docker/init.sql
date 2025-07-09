-- 数据库初始化脚本
-- 这个脚本会在 PostgreSQL 容器首次启动时执行

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 创建示例表 (可根据需要修改)
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_positions_title ON positions(title);
CREATE INDEX IF NOT EXISTS idx_positions_department ON positions(department);

-- 插入示例数据
INSERT INTO users (email, name, password_hash) VALUES
    ('admin@example.com', 'Admin User', crypt('admin123', gen_salt('bf'))),
    ('user@example.com', 'Regular User', crypt('user123', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;

INSERT INTO positions (title, description, department, salary_min, salary_max) VALUES
    ('软件工程师', '负责后端开发和维护', '技术部', 80000, 120000),
    ('前端开发工程师', '负责前端界面开发', '技术部', 70000, 100000),
    ('产品经理', '负责产品规划和管理', '产品部', 90000, 150000),
    ('UI/UX 设计师', '负责用户界面和体验设计', '设计部', 60000, 90000)
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
