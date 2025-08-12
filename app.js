// Very small SPA router + dynamic content (for Prerender QA)
const el = (tag, attrs={}, children=[]) => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => node.setAttribute(k, v));
  children.forEach(c => node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
  return node;
};

const routes = {
  "/": async () => {
    const wrap = el("div", { class: "card" }, [
      el("h2", {}, ["Home (JS-rendered)"]),
      el("p", {}, ["This text is injected by JavaScript after a short delay. "]),
      el("p", {}, ["If Prerender is working, bots should see this content in the HTML."]),
      el("p", {}, ["Current time: ", new Date().toISOString()]),
    ]);
    // simulate client rendering delay
    await new Promise(r => setTimeout(r, 800));
    return wrap;
  },

  "/about": async () => {
    const wrap = el("div", { class: "card" }, [
      el("h2", {}, ["About"]),
      el("p", {}, ["This page exists so you can test multiple routes."]),
      el("p", {}, ["Try hitting it with:"]),
      el("pre", {}, [el("code", {}, ['curl -I -A "Googlebot" https://<your-domain>/#/about'])])
    ]);
    return wrap;
  },

  "/posts": async () => {
    const container = el("div", {}, [el("h2", {}, ["Posts (fetched via JSONPlaceholder)"])]);
    const list = el("div");
    container.appendChild(list);

    // fetch a few posts to prove dynamic JS + network activity
    const res = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
    const posts = await res.json();
    posts.forEach(p => {
      list.appendChild(el("div", { class: "card" }, [
        el("h3", {}, [p.title]),
        el("p", {}, [p.body])
      ]));
    });
    return container;
  }
};

async function render() {
  const app = document.getElementById("app");
  const hash = location.hash.replace(/^#/, "") || "/";
  const route = routes[hash] ? hash : "/";
  app.innerHTML = "<p>Rendering…</p>";
  const vdom = await routes[route]();
  app.innerHTML = "";
  app.appendChild(vdom);
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", render);
