"use client";

import { useEffect, useState } from "react";

type MatchItem = {
  id: number;
  similarityScore: number;
  matchedUserId: string;
  matchedUserPhone: string;
  valueTags: string[];
  liked?: boolean;
  chatId?: number | null;
};

export default function MatchesPage() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [likingId, setLikingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/matches/today");
      if (!res.ok) throw new Error("加载匹配失败");
      const json = (await res.json()) as { matches: MatchItem[] };
      setMatches(json.matches ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleLike(m: MatchItem) {
    if (m.liked || likingId) return;
    setLikingId(m.matchedUserId);
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: m.matchedUserId }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        mutual?: boolean;
        chatId?: number | null;
      };
      if (data.mutual && data.chatId) {
        window.location.href = `/chats/${data.chatId}`;
        return;
      }
      setMatches((prev) =>
        prev.map((x) =>
          x.matchedUserId === m.matchedUserId
            ? { ...x, liked: true, chatId: data.chatId ?? null }
            : x,
        ),
      );
    } finally {
      setLikingId(null);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/70">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-50">
              今日 3 个深度匹配
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              基于你刚刚完成的价值观测试，AI 为你挑选出的最有可能聊得来的 3
              个人（每天刷新一次）。
            </p>
          </div>
          <a
            href="/"
            className="text-xs font-medium text-sky-400 hover:text-sky-300"
          >
            返回主页
          </a>
        </div>

        {loading && (
          <p className="text-xs text-slate-400">
            正在为你加载今日匹配，请稍候…
          </p>
        )}

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}

        {!loading && !error && matches.length === 0 && (
          <p className="text-xs text-slate-400">
            暂时还没有可用的匹配对象。等有更多用户完成价值观测试后，我们会为你刷新匹配列表。
          </p>
        )}

        <div className="mt-4 space-y-4">
          {matches.map((m, idx) => (
            <div
              key={m.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-200">
                    匹配 #{idx + 1}
                  </span>
                  <span className="ml-2 text-[11px] text-slate-500">
                    匿名展示，真实身份在双方互相喜欢后解锁
                  </span>
                </div>
                <span className="text-xs font-medium text-sky-300">
                  价值观相似度 {(m.similarityScore * 100).toFixed(0)}%
                </span>
              </div>

              {m.valueTags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.valueTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-sky-500/10 px-3 py-1 text-[11px] text-sky-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                {m.chatId ? (
                  <a
                    href={`/chats/${m.chatId}`}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-500 px-4 text-xs font-medium text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400"
                  >
                    去聊天
                  </a>
                ) : m.liked ? (
                  <span className="text-xs text-slate-400">已喜欢，等待对方回应</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleLike(m)}
                    disabled={likingId !== null}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-sky-500 px-4 text-xs font-medium text-slate-950 shadow-lg shadow-sky-500/40 transition hover:bg-sky-400 disabled:opacity-70"
                  >
                    {likingId === m.matchedUserId ? "处理中…" : "我对 TA 感兴趣"}
                  </button>
                )}
                {!m.liked && !m.chatId && (
                  <button className="text-[11px] text-slate-400 hover:text-slate-300">
                    暂时跳过
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

