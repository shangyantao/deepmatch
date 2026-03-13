import { query } from './db';

export interface User {
  id: number;
  email: string;
  name: string | null;
  created_at: Date;
}

// 初始化表
// 初始化表
export async function initTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(255),
      avatar VARCHAR(500),  -- 头像URL
      gender VARCHAR(10),    -- 性别
      birthday DATE,         -- 生日
      city VARCHAR(100),     -- 城市
      bio TEXT,              -- 个人简介
      answers JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // 检查并添加新字段
  const fields = ['avatar', 'gender', 'birthday', 'city', 'bio'];
  for (const field of fields) {
    try {
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${field} VARCHAR(500)`);
    } catch (error) {
      console.log(`${field}字段已存在`);
    }
  }
  
  console.log('✅ 用户表已初始化');
    // 创建反馈表
await query(`
    CREATE TABLE IF NOT EXISTS match_feedback (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      matched_user_id INTEGER NOT NULL,
      feedback INTEGER NOT NULL, -- 1:没聊, 2:聊过但一般, 3:聊得不错, 4:见面了, 5:成了
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, matched_user_id)
    )
  `);
  console.log('✅ 反馈表已初始化');
  // 创建 daily_matches 表（如果不存在）
await query(`
  CREATE TABLE IF NOT EXISTS daily_matches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    matched_user_id INTEGER NOT NULL,
    similarity_score INTEGER NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, matched_user_id, date)
  )
`);
// 创建 daily_matches 表（如果不存在）
await query(`
  CREATE TABLE IF NOT EXISTS daily_matches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    matched_user_id INTEGER NOT NULL,
    similarity_score INTEGER NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, matched_user_id, date)
  )
`);

// 创建暗恋表
await query(`
  CREATE TABLE IF NOT EXISTS crushes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    target_user_id INTEGER NOT NULL,
    is_mutual BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_DATE,
    UNIQUE(user_id, target_user_id)
  )
`);

// 创建暗恋结果通知表
await query(`
  CREATE TABLE IF NOT EXISTS crush_matches (
    id SERIAL PRIMARY KEY,
    user1_id INTEGER NOT NULL,
    user2_id INTEGER NOT NULL,
    matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
  )
`);
// 创建索引加快查询
await query(`CREATE INDEX IF NOT EXISTS idx_daily_matches_user_date ON daily_matches(user_id, date)`);
  // 创建消息表
await query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // 创建索引加快查询
  await query(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at)`);
  }
  

// 查询用户
export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

// 创建用户
export async function createUser(email: string, name?: string): Promise<User> {
  const result = await query(
    'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
    [email, name || null]
  );
  return result.rows[0];
}

// 获取所有用户
export async function getAllUsers(): Promise<User[]> {
  const result = await query('SELECT * FROM users ORDER BY id DESC');
  return result.rows;
}