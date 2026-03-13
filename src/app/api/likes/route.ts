import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { toUserId?: string };
  const toUserId = body.toUserId?.trim();
  if (!toUserId || toUserId === session.user.id) {
    return NextResponse.json(
      { error: "无效的 toUserId" },
      { status: 400 },
    );
  }

  const fromUserId = session.user.id;

  const existing = await prisma.like.findUnique({
    where: {
      fromUserId_toUserId: { fromUserId, toUserId },
    },
  });
  if (existing) {
    const chat = await getOrNullChat(fromUserId, toUserId);
    return NextResponse.json({
      ok: true,
      mutual: !!chat,
      chatId: chat?.id ?? null,
    });
  }

  await prisma.like.create({
    data: { fromUserId, toUserId },
  });

  const reverseLike = await prisma.like.findUnique({
    where: {
      fromUserId_toUserId: { fromUserId: toUserId, toUserId: fromUserId },
    },
  });

  let chatId: number | null = null;
  if (reverseLike) {
    const [userAId, userBId] =
      fromUserId < toUserId
        ? [fromUserId, toUserId]
        : [toUserId, fromUserId];
    const chat = await prisma.chat.upsert({
      where: {
        userAId_userBId: { userAId, userBId },
      },
      update: {},
      create: { userAId, userBId },
    });
    chatId = chat.id;
  }

  return NextResponse.json({
    ok: true,
    mutual: !!chatId,
    chatId,
  });
}

async function getOrNullChat(
  id1: string,
  id2: string,
): Promise<{ id: number } | null> {
  const [userAId, userBId] = id1 < id2 ? [id1, id2] : [id2, id1];
  const chat = await prisma.chat.findUnique({
    where: { userAId_userBId: { userAId, userBId } },
  });
  return chat;
}
