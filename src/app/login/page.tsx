/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

const FIXED_OTP_HINT = process.env.NEXT_PUBLIC_FIXED_OTP_HINT ?? "000000";

// 将主要逻辑提取到内部组件
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("phone-login", {
      redirect: false,
      phone,
      code,
      callbackUrl,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    router.push(callbackUrl);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl shadow-slate-950/70 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-300/80">
            DeepMatch
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-slate-50">
            使用手机号开启深度匹配
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            我们不会给你推“高颜值附近的人”，只会帮你找到真正价值观契合的那个人。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              手机号
            </label>
            <input
              className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 text-sm text-slate-50 outline-none ring-0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
              placeholder="例如：13800000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              验证码
            </label>
            <input
              className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 text-sm text-slate-50 outline-none ring-0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
              placeholder={`本地开发固定为 ${FIXED_OTP_HINT}`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <p className="text-xs text-slate-500">
              MVP 阶段使用固定验证码，后续可以替换为短信服务。
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-sky-500 text-sm font-medium text-slate-950 shadow-lg shadow-sky-500/40 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "登录中..." : "同意条款并登录 / 注册"}
          </button>

          <p className="text-center text-[11px] text-slate-500">
            登录即代表你已阅读并同意{" "}
            <span className="cursor-pointer text-sky-400 hover:underline">
              《隐私政策》
            </span>{" "}
            与{" "}
            <span className="cursor-pointer text-sky-400 hover:underline">
              《用户协议》
            </span>
            。
          </p>
        </form>
      </div>
    </div>
  );
}

// 主页面组件用 Suspense 包裹
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="text-slate-400">加载中...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}