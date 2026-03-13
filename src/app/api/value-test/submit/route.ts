import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deepseekChat } from "@/lib/deepseek";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { answers?: Record<number, number> };
  const answers = body.answers ?? {};

  const userId = session.user.id;

  // Upsert questions & answers for 10 fixed questions
  const entries = Object.entries(answers) as [string, number][];

  await prisma.$transaction(async (tx) => {
    for (const [idxStr, score] of entries) {
      const index = Number(idxStr);
      if (Number.isNaN(index)) continue;

      const question = await tx.valueQuestion.upsert({
        where: { order: index + 1 },
        update: {},
        create: {
          order: index + 1,
          text: "", // 文案前端固定，这里只做占位
        },
      });

      await tx.valueAnswer.upsert({
        where: {
          userId_questionId: {
            userId,
            questionId: question.id,
          },
        },
        update: { score },
        create: {
          userId,
          questionId: question.id,
          score,
        },
      });
    }
  });

  // 调用 DeepSeek 生成价值观标签和 embedding（MVP 简化：基于打分）
  const scoresArray = Array.from({ length: 10 }, (_, i) => answers[i] ?? 3);

  const prompt = `
你是一个亲密关系与人格心理方向的咨询师，同时具备数据分析能力。
现在给你一个用户在 10 个关于“长期亲密关系价值观”的 1-5 分打分。

每一题的分数按顺序为（1-5 分，3 表示中立）：
${scoresArray.join(", ")}

请基于这些分数：
1. 提炼 3-6 个简短的中文价值观标签（例如："重视情感沟通"、"理性务实"、"追求独立空间"）。
2. 给出一个长度为 10 的、每个元素在 0-1 之间的小数数组，作为该用户在 10 个维度上的归一化向量表示，用于匹配算法。

返回严格 JSON，格式如下：
{
  "tags": ["标签1", "标签2"],
  "embedding": [0.12, 0.87, ...共10个数字]
}
不要添加任何额外说明。
`;

  try {
    const content = await deepseekChat({
      messages: [
        {
          role: "system",
          content:
            "你是一个严谨的 JSON 生成助手，只返回有效 JSON，不输出多余文本。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.25,
    });

    const json = JSON.parse(content) as {
      tags?: string[];
      embedding?: number[];
    };

    const tags = json.tags ?? [];
    const embedding = json.embedding ?? scoresArray.map((s) => s / 5);

    await prisma.valueProfile.upsert({
      where: { userId },
      update: {
        tags: JSON.stringify(tags),
        embedding: JSON.stringify(embedding),
        lastComputedAt: new Date(),
      },
      create: {
        userId,
        tags: JSON.stringify(tags),
        embedding: JSON.stringify(embedding),
      },
    });
  } catch (e) {
    // 如果 DeepSeek 失败，至少保证基础打分已经保存
    console.error("DeepSeek value profile error", e);
  }

  return NextResponse.json({ ok: true });
}

