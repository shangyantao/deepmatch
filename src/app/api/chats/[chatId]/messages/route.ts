import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      OR: [
        { userAId: session.user.id },
        { userBId: session.user.id },
      ],
    },
  });

  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const message = await prisma.message.create({
    data: {
      chatId,
      senderId: session.user.id,
      content,
    },
  });

  return NextResponse.json({
    id: message.id,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  });
}
