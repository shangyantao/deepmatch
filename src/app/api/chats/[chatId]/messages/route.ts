import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from '@/lib/db';

export async function POST(
  req: Request,
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

  const body = (await req.json()) as { content?: string };
  const content = (body.content ?? "").trim();
  if (!content) {
    return NextResponse.json(
      { error: "消息内容不能为空" },
      { status: 400 },
    );
  }

  const userId = parseInt(session.user.id);

  // 检查用户是否有权限在这个聊天中发送消息
  // 这里假设 chatId 就是对方的用户ID（简化版）
  const otherUserId = chatId;
  
  // 检查对方用户是否存在
  const userResult = await query(
    'SELECT id FROM users WHERE id = $1',
    [otherUserId]
  );
  
  if (userResult.rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 插入消息
  const messageResult = await query(
    `INSERT INTO messages (sender_id, receiver_id, content) 
     VALUES ($1, $2, $3) RETURNING *`,
    [userId, otherUserId, content]
  );

  const message = messageResult.rows[0];

  return NextResponse.json({
    id: message.id,
    content: message.content,
    createdAt: message.created_at,
  });
}