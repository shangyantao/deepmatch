import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId: chatIdStr } = await params;
  const chatId = Number(chatIdStr);
  if (!Number.isInteger(chatId)) {
    return NextResponse.json({ error: "Invalid chatId" }, { status: 400 });
  }

  const userId = parseInt(session.user.id);

  // 检查用户是否有权限访问这个聊天
  // 这里假设 chatId 就是对方的用户ID（简化版）
  const otherUserId = chatId;
  
  // 获取对方用户信息 - 直接使用 phone 字段
  const userResult = await query(
    'SELECT id, name, phone FROM users WHERE id = $1',
    [otherUserId]
  );
  
  if (userResult.rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  
  const other = userResult.rows[0];
  
  // 获取两人的聊天记录
  const messagesResult = await query(
    `SELECT * FROM messages 
     WHERE (sender_id = $1 AND receiver_id = $2) 
        OR (sender_id = $2 AND receiver_id = $1)
     ORDER BY created_at ASC`,
    [userId, otherUserId]
  );
  
  // 将对方发送的未读消息标记为已读
  await query(
    `UPDATE messages SET is_read = TRUE 
     WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
    [otherUserId, userId]
  );
  
  return NextResponse.json({
    id: chatId,
    otherUserId: other.id,
    otherPhoneMask: maskPhone(other.phone),
    messages: messagesResult.rows.map((m: any) => ({
      id: m.id,
      content: m.content,
      senderId: m.sender_id,
      fromMe: m.sender_id === userId,
      createdAt: m.created_at,
    })),
  });
}

function maskPhone(phone: string) {
  if (!phone || phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}