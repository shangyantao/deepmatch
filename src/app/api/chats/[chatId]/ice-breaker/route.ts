import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      OR: [
        { userAId: session.user.id },
        { userBId: session.user.id },
      ],
    },
    include: {
      userA: { include: { valueProfile: true } },
      userB: { include: { valueProfile: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const myId = session.user.id;
  const myProfile = chat.userAId === myId ? chat.userA : chat.userB;
  const otherProfile = chat.userAId === myId ? chat.userB : chat.userA;

  const myTags = myProfile.valueProfile
    ? (JSON.parse(myProfile.valueProfile.tags) as string[])
    : [];
  const otherTags = otherProfile.valueProfile
    ? (JSON.parse(otherProfile.valueProfile.tags) as string[])
    : [];

  const recentLines = chat.messages
    .reverse()
    .map((m) => (m.senderId === myId ? `我: ${m.content}` : `TA: ${m.content}`))
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
