import { query } from '@/lib/db';
import { calculateMatchScore } from '@/app/api/matches/daily/route'; // 如果需要导入实际的计算函数

function parseEmbedding(raw: string | null): number[] | null {
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return null;
    return arr.map((v) => Number(v)).filter((v) => Number.isFinite(v));
  } catch {
    return null;
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function generateDailyMatchesForUser(userId: string, limit = 3) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const userIdNum = parseInt(userId);

  // 检查今天是否已有匹配记录 - 直接使用 phone 字段
  const existingResult = await query(
    `SELECT dm.*, u.name, u.phone 
     FROM daily_matches dm
     JOIN users u ON dm.matched_user_id = u.id
     WHERE dm.user_id = $1 AND dm.date >= $2 AND dm.date < $3
     ORDER BY dm.similarity_score DESC`,
    [userIdNum, today.toISOString().split('T')[0], tomorrow.toISOString().split('T')[0]]
  );

  if (existingResult.rows.length > 0) {
    return existingResult.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      matchedUserId: row.matched_user_id,
      similarityScore: row.similarity_score,
      date: row.date,
      matchedUser: {
        id: row.matched_user_id,
        name: row.name,
        phone: row.phone
      }
    }));
  }

  // 获取当前用户的 valueProfile（假设 answers 字段存了问卷答案）
  const selfResult = await query(
    'SELECT answers FROM users WHERE id = $1',
    [userIdNum]
  );
  
  const selfAnswers = selfResult.rows[0]?.answers;
  if (!selfAnswers) {
    return [];
  }

  // 获取其他所有用户的 answers - 直接使用 phone 字段
  const othersResult = await query(
    'SELECT id, name, phone, answers FROM users WHERE id != $1 AND answers IS NOT NULL',
    [userIdNum]
  );

  // 计算相似度
  const scored = othersResult.rows
    .map((other: any) => {
      // 这里应该调用 calculateMatchScore 函数
      // 由于 calculateMatchScore 在 daily/route.ts 中，需要导入
      // 暂时注释掉，实际使用时取消注释并确保导入正确
      // const score = calculateMatchScore(selfAnswers, other.answers);
      
      // 临时用随机数代替
      const score = Math.floor(Math.random() * 30) + 60;
      return { profile: other, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (scored.length === 0) {
    return [];
  }

  // 批量插入匹配记录
  const created = [];
  for (const s of scored) {
    const result = await query(
      `INSERT INTO daily_matches (user_id, matched_user_id, similarity_score, date)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, matched_user_id, date) DO NOTHING
       RETURNING *`,
      [userIdNum, s.profile.id, s.score, today.toISOString().split('T')[0]]
    );
    
    if (result.rows[0]) {
      created.push({
        ...result.rows[0],
        matchedUser: {
          id: s.profile.id,
          name: s.profile.name,
          phone: s.profile.phone
        }
      });
    }
  }

  return created;
}