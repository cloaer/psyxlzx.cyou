const API_BASE = "https://psyxlzx-mocmsbxlxs.cn-hongkong.fcapp.run/api";

export class ApiError extends Error {
  constructor(message, status, code) { super(message); this.status = status; this.code = code; }
}

export async function api(path, options = {}) {
  const token = localStorage.getItem("mindful_auth_token") || "";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 95000);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "Mindful",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new ApiError(data.error || "服务暂时无法完成请求，请稍后重试。", response.status, data.code);
    if (data.token) localStorage.setItem("mindful_auth_token", data.token);
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.name === "AbortError" ? "请求超时，请检查连接后重试。" : "无法连接服务，请检查网络后重试。", 0, "NETWORK");
  } finally { clearTimeout(timer); }
}
