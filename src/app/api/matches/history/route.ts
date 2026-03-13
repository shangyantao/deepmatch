import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // 获取用户的匹配历史，按日期分组
    const result = await query(
      `SELECT 
        dm.date,
        dm.similarity_score,
        u.id as matched_user_id,
        u.name as matched_user_name,
        u.email as matched_user_phone
       FROM daily_matches dm
       JOIN users u ON dm.matched_user_id = u.id
       WHERE dm.user_id = $1
       ORDER BY dm.date DESC, dm.similarity_score DESC`,
      [userId]
    );
    
    // 按日期分组
    const historyByDate: Record<string, any[]> = {};
    
    result.rows.forEach((row: any) => {
      const dateStr = new Date(row.date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!historyByDate[dateStr]) {
        historyByDate[dateStr] = [];
      }
      
      historyByDate[dateStr].push({
        id: row.matched_user_id,
        name: row.matched_user_name || row.matched_user_phone,
        phone: row.matched_user_phone,
        similarity: row.similarity_score,
        date: row.date
      });
    });
    
    return NextResponse.json({ history: historyByDate });
  } catch (error) {
    console.error('获取匹配历史失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}