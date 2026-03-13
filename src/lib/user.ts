import { query } from './db';

export interface User {
  id: number;
  phone: string;
  name: string | null;
  avatar: string | null;
  gender: string | null;
  birthday: string | null;
  city: string | null;
  bio: string | null;
  answers: any;
  created_at: Date;
}

// 初始化所有表
export async function initTable() {
  // 创建用户表
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(255),
      avatar VARCHAR(500),
      gender VARCHAR(10),
      birthday DATE,
      city VARCHAR(100),
      bio TEXT,
      answers JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // 添加新字段（如果不存在）
  const fields = ['avatar', 'gender', 'birthday', 'city', 'bio'];
  for (const field of fields) {
    try {
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${field} VARCHAR(500)`);
    } catch (error) {
      console.log(`${field}字段已存在`);
    }
  }
  
  console.log('✅ 用户表已初始化');
  
  // 创建 daily_matches 表
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
  
  // 创建索引
  await query(`CREATE INDEX IF NOT EXISTS idx_daily_matches_user_date ON daily_matches(user_id, date)`);
  console.log('✅ daily_matches 表已初始化');
  
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
  
  // 创建消息表索引
  await query(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at)`);
  console.log('✅ messages 表已初始化');
  
  // 创建反馈表
  await query(`
    CREATE TABLE IF NOT EXISTS match_feedback (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      matched_user_id INTEGER NOT NULL,
      feedback INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, matched_user_id)
    )
  `);
  console.log('✅ match_feedback 表已初始化');
  
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
  console.log('✅ crushes 表已初始化');
  
  // 创建暗恋匹配表
  await query(`
    CREATE TABLE IF NOT EXISTS crush_matches (
      id SERIAL PRIMARY KEY,
      user1_id INTEGER NOT NULL,
      user2_id INTEGER NOT NULL,
      matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_read BOOLEAN DEFAULT FALSE
    )
  `);
  console.log('✅ crush_matches 表已初始化');
}

// 根据手机号查找用户
export async function findUserByPhone(phone: string): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE phone = $1', [phone]);
  return result.rows[0] || null;
}

// 创建用户（使用 phone）
export async function createUser(phone: string, name?: string): Promise<User> {
  const result = await query(
    'INSERT INTO users (phone, name) VALUES ($1, $2) RETURNING *',
    [phone, name || null]
  );
  return result.rows[0];
}

// 保存问卷答案
export async function saveUserAnswers(userId: number, answers: any) {
  const result = await query(
    'UPDATE users SET answers = $1 WHERE id = $2 RETURNING *',
    [JSON.stringify(answers), userId]
  );
  return result.rows[0];
}

// 获取所有用户
export async function getAllUsers(): Promise<User[]> {
  const result = await query('SELECT * FROM users ORDER BY id DESC');
  return result.rows;
}

// 兼容旧代码的函数（内部调用新函数）
export async function findUserByEmail(email: string): Promise<User | null> {
  return findUserByPhone(email);
}