const origin = (import.meta.env?.VITE_API_BASE_URL || "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status, fieldErrors) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function readResponse(response) {
  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    if (response.ok) {
      throw new ApiError(
        "O servidor retornou uma resposta inesperada. Tente novamente.",
        502,
      );
    }
    data = null;
  }
  if (!response.ok) {
    const fallback =
      response.status === 401
        ? "Sua sessão terminou. Entre novamente."
        : response.status === 403
          ? "Você não tem permissão para esta ação. Atualize a página e tente novamente."
          : "Não foi possível concluir a solicitação.";
    throw new ApiError(
      data?.message || fallback,
      response.status,
      data?.fieldErrors,
    );
  }
  return data;
}

export async function api(path, options = {}) {
  const method = options.method || "GET";
  const headers = { Accept: "application/json" };
  try {
    if (method !== "GET") {
      const csrf = await readResponse(
        await fetch(`${origin}/api/auth/csrf`, {
          credentials: "include",
          signal: options.signal,
        }),
      );
      headers[csrf.headerName] = csrf.token;
    }
    if (options.body !== undefined)
      headers["Content-Type"] = "application/json";
    return await readResponse(
      await fetch(`${origin}/api${path}`, {
        method,
        headers,
        credentials: "include",
        signal: options.signal,
        ...(options.body !== undefined
          ? { body: JSON.stringify(options.body) }
          : {}),
      }),
    );
  } catch (error) {
    if (error.name === "AbortError") throw error;
    if (
      error.status === 401 &&
      !options.signal?.aborted &&
      !["/auth/login", "/auth/register", "/auth/me"].includes(path) &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(new CustomEvent("rota:session-expired"));
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Não foi possível conectar à API. Verifique se o servidor está em execução.",
      0,
    );
  }
}
