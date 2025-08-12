// netlify/edge-functions/prerender.js
// Proxies crawler requests to Prerender.io. Set PRERENDER_TOKEN in Netlify env vars.
export default async (request, context) => {
  const ua = request.headers.get("user-agent") || "";
  const isBot = /Googlebot|Bingbot|LinkedInBot|Twitterbot|facebookexternalhit|Slackbot|WhatsApp|DuckDuckBot|YandexBot/i.test(ua);
  if (!isBot) return context.next();

  const token = Deno.env.get("PRERENDER_TOKEN") || "";
  const url = new URL(request.url);
  // Construct target URL for Prerender service
  const target = `https://service.prerender.io/https://${url.hostname}${url.pathname}${url.search}`;

  const headers = new Headers();
  if (token) headers.set("X-Prerender-Token", token);

  const resp = await fetch(target, { headers });
  // Pass through Prerender response
  return resp;
};
