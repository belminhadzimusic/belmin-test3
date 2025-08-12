export default async (request, context) => {
  const ua = request.headers.get("user-agent") || "";
  const isBot = /Googlebot|Bingbot|LinkedInBot|Twitterbot|facebookexternalhit|Slackbot|WhatsApp|DuckDuckBot|YandexBot/i.test(ua);
  if (!isBot) return context.next();

  const token = Deno.env.get("PRERENDER_TOKEN") || "";
  // Allow switching between prod and staging via env var
  const base = Deno.env.get("PRERENDER_BASE") || "https://service.prerender.io";

  const url = new URL(request.url);
  const target = `${base}/https://${url.hostname}${url.pathname}${url.search}`;

  const headers = new Headers();
  if (token) headers.set("X-Prerender-Token", token);

  return fetch(target, { headers });
};
