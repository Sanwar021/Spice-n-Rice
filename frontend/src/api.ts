import { QueryClient } from "@tanstack/react-query";
export type Row = Record<string, any>;
export const client = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 3000, refetchInterval: 10000, retry: 1 },
  },
});
let refresh: Promise<Response> | null = null;
export async function api<T = Row[]>(
  url: string,
  method = "GET",
  body?: unknown,
  retry = true,
): Promise<T> {
  const form = body instanceof FormData;
  const res = await fetch("/api/v1" + url, {
    method,
    credentials: "include",
    headers: body && !form ? { "Content-Type": "application/json" } : undefined,
    body: body ? (form ? body : JSON.stringify(body)) : undefined,
  });
  if (
    res.status === 401 &&
    retry &&
    (!url.startsWith("/auth/") || url === "/auth/me")
  ) {
    refresh ??= fetch("/api/v1/auth/refresh", {
      method: "POST",
      credentials: "include",
    }).finally(() => {
      refresh = null;
    });
    if ((await refresh).ok) return api(url, method, body, false);
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Something went wrong");
  return data;
}
export const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n / 100,
  );
export async function save(resource: string, data: Row) {
  await api(
    `/admin/${resource}${data.id ? "/" + data.id : ""}`,
    data.id ? "PUT" : "POST",
    data,
  );
  await client.invalidateQueries();
}
