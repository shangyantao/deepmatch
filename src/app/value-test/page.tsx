"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const QUESTIONS = [
  "在一段长期关系里，你最不能妥协的一件事是什么？",
  "当你和伴侣出现分歧时，你更偏向怎样解决？",
  "理想的亲密关系中，“自由”对你意味着什么？",
  "在关系里，金钱观念对你有多重要？",
  "你如何看待双方在事业发展上的优先级？",
  "如果伴侣和你的原生家庭发生冲突，你更可能站在哪一边？",
  "在关系里，你对“安全感”的具体期待是什么？",
  "你能接受多大程度的生活方式差异？",
  "当关系遇到瓶颈，你通常会怎样处理？",
  "你希望未来 5 年和伴侣一起完成的一件事是什么？",
];

export default function ValueTestPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const value = answers[current] ?? 3;

  async function handleNext() {
    if (current < QUESTIONS.length - 1) {
      setCurrent((c) => c + 1);
      return;
    }

    setSubmitting(true);
    try {
      await fetch("/api/value-test/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      router.push("/");
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(v: number) {
    setAnswers((prev) => ({ ...prev, [current]: v }));
  }

  const progress = ((current + 1) / QUESTIONS.length) * 100;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/70">
        <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
          <span>价值观测试</span>
          <span>
            {current + 1} / {QUESTIONS.length}
          </span>
        </div>
        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-sky-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <h1 className="text-lg font-semibold text-slate-50">
          {QUESTIONS[current]}
        </h1>
        <p className="mt-2 text-xs text-slate-400">
          用 1-5 分来标记你的直觉：1 代表“完全不重要 / 不认同”，5
          代表“极其重要 / 强烈认同”。
        </p>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>不重要 / 不认同</span>
            <span>非常重要 / 非常认同</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => handleChange(v)}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-medium transition ${
                  v === value
                    ? "bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/40"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleNext}
          disabled={submitting}
          className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl bg-sky-500 text-sm font-medium text-slate-950 shadow-lg shadow-sky-500/40 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {current === QUESTIONS.length - 1
            ? submitting
              ? "分析中..."
              : "完成测试并生成匹配画像"
            : "下一题"}
        </button>

        <p className="mt-3 text-[11px] text-slate-500">
          你的详细回答不会对其他用户展示，只会用于 AI
          计算价值观画像和匹配度。我们不会将这些数据用于广告或推荐以外的用途。
        </p>
      </div>
    </div>
  );
}

