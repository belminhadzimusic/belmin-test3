// netlify/edge-functions/prerender.js
export default async (request, context) => {
  try {
    const ua = request.headers.get("user-agent") || "";
    const isBot = /Googlebot|Bingbot|LinkedInBot|Twitterbot|facebookexternalhit|Slackbot|WhatsApp|DuckDuckBot|YandexBot/i.test(ua);
    if (!isBot) return context.next();

    // Skip static assets
    const url = new URL(request.url);
    if (/\.(png|jpe?g|gif|webp|svg|ico|css|js|map|txt|xml)$/i.test(url.pathname)) {
      return context.next();
    }

    const token = Deno.env.get("PRERENDER_TOKEN") || "";
    const base  = Deno.env.get("PRERENDER_BASE") || "https://service.prerender.io"; // prod default

    // Include hash so hash-routes like /#/posts get rendered
    const fullUrl = `https://${url.hostname}${url.pathname}${url.search}${url.hash}`;

    const reqHeaders = new Headers();
    if (token) reqHeaders.set("X-Prerender-Token", token);

    // 1) Try path-style
    let resp = await fetch(`${base}/${fullUrl}`, { headers: reqHeaders });

    // 2) Fallback to query-style (some staging stacks expect this)
    if (resp.status === 404 || resp.status === 400) {
      resp = await fetch(`${base}/render?url=${encodeURIComponent(fullUrl)}`, { headers: reqHeaders });
      const h = new Headers(resp.headers);
      h.set("x-debug-prerender-fallback", "query");
      h.set("x-debug-prerender-base", base);
      h.set("x-debug-token-present", token ? "true" : "false");
      h.set("x-debug-upstream-status", String(resp.status));
      return new Response(resp.body, { status: resp.status, headers: h });
    }

    // Add safe debug headers (remove later)
    const h = new Headers(resp.headers);
    h.set("x-debug-prerender-base", base);
    h.set("x-debug-token-present", token ? "true" : "false");
    h.set("x-debug-upstream-status", String(resp.status));
    return new Response(resp.body, { status: resp.status, headers: h });
  } catch (e) {
    // Crash-safe response so you can see errors
    return new Response("edge-error", {
      status: 502,
      headers: { "x-debug-edge-error": String(e).slice(0, 120) }
    });
  }
};
