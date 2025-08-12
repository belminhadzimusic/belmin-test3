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

  // call Prerender
  const resp = await fetch(target, { headers });

  // --- DEBUG (safe) ---
  const h = new Headers(resp.headers);
  h.set("x-debug-prerender-base", base);
  h.set("x-debug-token-present", token ? "true" : "false"); // no token value leaked
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: h });
};
