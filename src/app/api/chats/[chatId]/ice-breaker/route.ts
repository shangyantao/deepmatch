import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from '@/lib/db';
import { deepseekChat } from "@/lib/deepseek";

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
  const otherUserId = chatId; // 假设 chatId 就是对方的用户ID

  // 获取当前用户信息 - 直接使用 phone 字段
  const myResult = await query(
    'SELECT id, name, phone, answers FROM users WHERE id = $1',
    [userId]
  );
  
  if (myResult.rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 获取对方用户信息 - 直接使用 phone 字段
  const otherResult = await query(
    'SELECT id, name, phone, answers FROM users WHERE id = $1',
    [otherUserId]
  );

  if (otherResult.rows.length === 0) {
    return NextResponse.json({ error: "Other user not found" }, { status: 404 });
  }

  const myProfile = myResult.rows[0];
  const otherProfile = otherResult.rows[0];

  // 获取最近的聊天记录
  const messagesResult = await query(
    `SELECT sender_id, content, created_at 
     FROM messages 
     WHERE (sender_id = $1 AND receiver_id = $2) 
        OR (sender_id = $2 AND receiver_id = $1)
     ORDER BY created_at DESC
     LIMIT 5`,
    [userId, otherUserId]
  );

  // 从 answers 中提取价值观标签（假设第1题是多选题，存了价值观）
  const myAnswers = myProfile.answers || {};
  const otherAnswers = otherProfile.answers || {};
  
  const myTags = Array.isArray(myAnswers[1]) ? myAnswers[1] : [];
  const otherTags = Array.isArray(otherAnswers[1]) ? otherAnswers[1] : [];

  // 构建最近的对话记录
  const recentLines = messagesResult.rows
    .reverse()
    .map((m: any) => (m.sender_id === userId ? `我: ${m.content}` : `TA: ${m.content}`))
    .join("\n");

  const prompt = `
你是一个友善的社交破冰助手。两人刚匹配成功，准备开始聊天。
- 我的价值观标签：${myTags.length ? myTags.join("、") : "暂无"}
- 对方的价值观标签：${otherTags.length ? otherTags.join("、") : "暂无"}
${recentLines ? `最近几句对话：\n${recentLines}` : ""}

请生成 2 条简短、自然、不油腻的开场白或话题建议（每条一句话，适合发第一条消息），用中文。
直接输出 2 行，每行一条建议，不要编号、不要引号、不要多余解释。
`;

  let suggestions: string[];
  try {
    const content = await deepseekChat({
      messages: [
        {
          role: "system",
          content:
            "你只输出 2 行纯文本，每行一条破冰建议，不要任何编号、标题或解释。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
    });

    suggestions = content
      .split("\n")
      .map((s) => s.replace(/^[\d\.\-\*]\s*/, "").trim())
      .filter((s) => s.length > 0)
      .slice(0, 3);
  } catch (e) {
    console.error("ice-breaker DeepSeek error", e);
    return NextResponse.json(
      { error: "AI 破冰建议暂时不可用" },
      { status: 502 },
    );
  }

  return NextResponse.json({ suggestions });
}