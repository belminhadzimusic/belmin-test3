export default async (request, context) => {
  const ua = request.headers.get("user-agent") || "";
  const isBot = /Googlebot|Bingbot|LinkedInBot|Twitterbot|facebookexternalhit|Slackbot|WhatsApp|DuckDuckBot|YandexBot/i.test(ua);
  if (!isBot) return context.next();

  const token = Deno.env.get("PRERENDER_TOKEN") || "";
  const base  = Deno.env.get("PRERENDER_BASE") || "https://service.prerender-staging.dev";

  const url = new URL(request.url);
  const targetUrl = `https://${url.hostname}${url.pathname}${url.search}`;

  const headers = new Headers();
  if (token) headers.set("X-Prerender-Token", token);

  // 1) path-style
  let upstream = await fetch(`${base}/${targetUrl}`, { headers });

  // 2) fallback to query-style on 404/400
  if (upstream.status === 404 || upstream.status === 400) {
    upstream = await fetch(`${base}/render?url=${encodeURIComponent(targetUrl)}`, { headers });
    const h = new Headers(upstream.headers);
    h.set("x-debug-prerender-fallback", "query");
    h.set("x-debug-prerender-base", base);
    h.set("x-debug-token-present", token ? "true" : "false");
    h.set("x-debug-upstream-status", String(upstream.status));
    return new Response(upstream.body, { status: upstream.status, headers: h });
  }

  // debug headers (safe)
  const h = new Headers(upstream.headers);
  h.set("x-debug-prerender-base", base);
  h.set("x-debug-token-present", token ? "true" : "false");
  h.set("x-debug-upstream-status", String(upstream.status));
  return new Response(upstream.body, { status: upstream.status, headers: h });
};
