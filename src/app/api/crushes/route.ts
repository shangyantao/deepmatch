import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

// 获取我的暗恋列表
export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // 获取我暗恋的人
    const myCrushes = await query(
      `SELECT c.*, u.name, u.phone 
       FROM crushes c
       JOIN users u ON c.target_user_id = u.id
       WHERE c.user_id = $1`,
      [userId]
    );
    
    // 获取暗恋我的人
    const crushedBy = await query(
      `SELECT c.*, u.name, u.phone 
       FROM crushes c
       JOIN users u ON c.user_id = u.id
       WHERE c.target_user_id = $1 AND c.is_mutual = FALSE`,
      [userId]
    );
    
    // 获取互相暗恋的匹配
    const mutualMatches = await query(
      `SELECT cm.*, 
        u1.name as user1_name, u1.phone as user1_phone,
        u2.name as user2_name, u2.phone as user2_phone
       FROM crush_matches cm
       JOIN users u1 ON cm.user1_id = u1.id
       JOIN users u2 ON cm.user2_id = u2.id
       WHERE (cm.user1_id = $1 OR cm.user2_id = $1)
       ORDER BY cm.matched_at DESC`,
      [userId]
    );
    
    return NextResponse.json({
      myCrushes: myCrushes.rows,
      crushedBy: crushedBy.rows,
      mutualMatches: mutualMatches.rows
    });
  } catch (error) {
    console.error('获取暗恋数据失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// 提交暗恋
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    const { targetUserId } = await request.json();
    
    if (userId === targetUserId) {
      return NextResponse.json({ error: '不能暗恋自己' }, { status: 400 });
    }
    
    // 检查是否已经暗恋过
    const existing = await query(
      'SELECT * FROM crushes WHERE user_id = $1 AND target_user_id = $2',
      [userId, targetUserId]
    );
    
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: '已经暗恋过这个人了' }, { status: 400 });
    }
    
    // 插入暗恋记录
    await query(
      'INSERT INTO crushes (user_id, target_user_id) VALUES ($1, $2)',
      [userId, targetUserId]
    );
    
    // 检查对方是否也暗恋我
    const mutual = await query(
      'SELECT * FROM crushes WHERE user_id = $1 AND target_user_id = $2',
      [targetUserId, userId]
    );
    
    // 如果是互相暗恋，创建匹配
    if (mutual.rows.length > 0) {
      // 更新双方暗恋记录为互相
      await query(
        'UPDATE crushes SET is_mutual = TRUE WHERE (user_id = $1 AND target_user_id = $2) OR (user_id = $2 AND target_user_id = $1)',
        [userId, targetUserId]
      );
      
      // 创建暗恋匹配记录
      await query(
        'INSERT INTO crush_matches (user1_id, user2_id) VALUES ($1, $2)',
        [userId, targetUserId]
      );
      
      return NextResponse.json({ 
        success: true, 
        mutual: true,
        message: '恭喜！你们互相暗恋！' 
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      mutual: false,
      message: '暗恋已发送' 
    });
  } catch (error) {
    console.error('提交暗恋失败:', error);
    return NextResponse.json({ error: '提交失败' }, { status: 500 });
  }
}