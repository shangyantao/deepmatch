import { prisma } from "@/lib/prisma";

function parseEmbedding(raw: string | null): number[] | null {
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return null;
    return arr.map((v) => Number(v)).filter((v) => Number.isFinite(v));
  } catch {
    return null;
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function generateDailyMatchesForUser(userId: string, limit = 3) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existing = await prisma.dailyMatch.findMany({
    where: {
      userId,
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      matchedUser: true,
    },
    orderBy: { similarityScore: "desc" },
  });

  if (existing.length > 0) {
    return existing;
  }

  const selfProfile = await prisma.valueProfile.findUnique({
    where: { userId },
  });
  const selfEmbedding = parseEmbedding(selfProfile?.embedding ?? null);
  if (!selfEmbedding) {
    return [];
  }

  const others = await prisma.valueProfile.findMany({
    where: {
      userId: {
        not: userId,
      },
    },
    include: {
      user: true,
    },
  });

  const scored = others
    .map((p) => {
      const emb = parseEmbedding(p.embedding);
      if (!emb || emb.length !== selfEmbedding.length) {
        return null;
      }
      const score = cosineSimilarity(selfEmbedding, emb);
      return { profile: p, score };
    })
    .filter((v): v is { profile: (typeof others)[number]; score: number } => !!v)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (scored.length === 0) {
    return [];
  }

  const created = await prisma.$transaction((tx) =>
    Promise.all(
      scored.map((s) =>
        tx.dailyMatch.create({
          data: {
            date: today,
            userId,
            matchedUserId: s.profile.userId,
            similarityScore: s.score,
          },
          include: {
            matchedUser: true,
          },
        }),
      ),
    ),
  );

  return created;
}

