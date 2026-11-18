const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

export const TOKEN_STORAGE_NAME = "parser::access_token"

export class ApiError extends Error {
  readonly status: number
  readonly errors: Record<string, string>

  constructor(message: string, status: number, errors: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

function getErrors(body: unknown): Record<string, string> {
  if (typeof body !== "object" || body === null || !("errors" in body)) {
    return {}
  }

  const errors = body.errors
  if (typeof errors !== "object" || errors === null) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(errors).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  )
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem(TOKEN_STORAGE_NAME)
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  let body: unknown
  try {
    body = await response.json()
  } catch {
    body = undefined
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_NAME)
      window.dispatchEvent(new Event("auth:unauthorized"))
    }
    const message =
      typeof body === "object" && body !== null && "message" in body
        ? String(body.message)
        : "Request failed"
    throw new ApiError(message, response.status, getErrors(body))
  }

  return body as T
}
