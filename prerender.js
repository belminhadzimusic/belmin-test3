export default async (request, context) => {
  const ua = request.headers.get("user-agent") || "";
  const isBot = /Googlebot|Bingbot|LinkedInBot|Twitterbot|facebookexternalhit|Slackbot|WhatsApp|DuckDuckBot|YandexBot/i.test(ua);
  if (!isBot) return context.next();

  const token = Deno.env.get("PRERENDER_TOKEN") || "";
  const base  = Deno.env.get("PRERENDER_BASE") || "https://service.prerender.io";

  const url = new URL(request.url);
  const target = `${base}/https://${url.hostname}${url.pathname}${url.search}`;

  const headers = new Headers();
  if (token) headers.set("X-Prerender-Token", token);

  const upstream = await fetch(target, { headers });
  const h = new Headers(upstream.headers);
  h.set("x-debug-prerender-base", base);
  h.set("x-debug-token-present", token ? "true" : "false");
  h.set("x-debug-upstream-status", String(upstream.status));   // <— NEW
  return new Response(upstream.body, { status: upstream.status, headers: h });
};
