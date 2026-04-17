const getToken = () => localStorage.getItem('token') || '';

const request = async <T>(url: string, options: RequestInit, auth: boolean): Promise<T> => {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && { Authorization: `Bearer ${getToken()}` }),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.message ?? data?.error ?? `HTTP ${res.status}`;
    throw new Error(Array.isArray(msg) ? msg.join(', ') : String(msg));
  }
  return data as T;
};

export const http = {
  get: <T>(url: string, auth = true) => 
    request<T>(url, { method: 'GET' }, auth),

  post: <T>(url: string, data: object, auth = true) => 
    request<T>(url, { method: 'POST', body: JSON.stringify(data) }, auth),

  patch: <T>(url: string, data: object, auth = true) => 
    request<T>(url, { method: 'PATCH', body: JSON.stringify(data) }, auth),

  delete: <T>(url: string, auth = true) => 
    request<T>(url, { method: 'DELETE' }, auth),
};