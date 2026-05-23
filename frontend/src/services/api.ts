const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'

interface ApiOptions extends RequestInit {
  token?: string | null
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message ?? 'Something went wrong')
  }

  return data as T
}
