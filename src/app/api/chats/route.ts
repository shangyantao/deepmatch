import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

// 获取聊天列表
export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
  
  const userId = parseInt(session.user.id);
  
  try {
    // 获取所有和当前用户聊过天的用户
    const result = await query(`
      SELECT DISTINCT 
        u.id, 
        u.name, 
        u.email as phone,
        (
          SELECT content FROM messages 
          WHERE (sender_id = $1 AND receiver_id = u.id) 
             OR (sender_id = u.id AND receiver_id = $1)
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT created_at FROM messages 
          WHERE (sender_id = $1 AND receiver_id = u.id) 
             OR (sender_id = u.id AND receiver_id = $1)
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message_time,
        (
          SELECT COUNT(*) FROM messages 
          WHERE receiver_id = $1 AND sender_id = u.id AND is_read = FALSE
        ) as unread_count
      FROM users u
      WHERE u.id IN (
        SELECT DISTINCT sender_id FROM messages WHERE receiver_id = $1
        UNION
        SELECT DISTINCT receiver_id FROM messages WHERE sender_id = $1
      )
      ORDER BY last_message_time DESC NULLS LAST
    `, [userId]);
    
    return NextResponse.json({ chats: result.rows });
  } catch (error) {
    console.error('获取聊天列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// 发送消息
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }
  
  try {
    const { receiverId, content } = await request.json();
    const senderId = parseInt(session.user.id);
    
    if (!content?.trim()) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
    }
    
    const result = await query(
      `INSERT INTO messages (sender_id, receiver_id, content) 
       VALUES ($1, $2, $3) RETURNING *`,
      [senderId, receiverId, content.trim()]
    );
    
    return NextResponse.json({ message: result.rows[0] });
  } catch (error) {
    console.error('发送消息失败:', error);
    return NextResponse.json({ error: '发送失败' }, { status: 500 });
  }
}