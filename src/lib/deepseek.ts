const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

export type DeepSeekMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type DeepSeekChatCompletionParams = {
  model?: string;
  messages: DeepSeekMessage[];
  temperature?: number;
};

export async function deepseekChat(params: DeepSeekChatCompletionParams) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY 未配置");
  }

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: params.model ?? "deepseek-chat",
      temperature: params.temperature ?? 0.3,
      messages: params.messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DeepSeek API 调用失败: ${res.status} ${text}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek API 返回内容为空");
  }

  return content;
}

