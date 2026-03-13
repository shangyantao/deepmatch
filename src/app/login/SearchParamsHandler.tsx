'use client';

import { useSearchParams } from 'next/navigation';

export default function SearchParamsHandler() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');

  // 在这里处理你的逻辑，比如显示错误信息或存储callbackUrl
  // 这个组件可以是空的，只是为了让useSearchParams在Suspense内工作

  return null; // 或者返回一些JSX，比如错误提示
}