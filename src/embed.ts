export const EMBED_JS = `(()=>{document.querySelectorAll(".rcaptcha[data-site-key]").forEach(el=>{const s=document.createElement("iframe");s.src="https://rcaptcha.vaultless.dev/embed/widget?site="+encodeURIComponent(el.dataset.siteKey||"");s.width="320";s.height="420";el.appendChild(s);window.addEventListener("message",e=>{if(e.origin!=="https://rcaptcha.vaultless.dev")return;el.dataset.passToken=e.data.passToken;});});})();`;
export function handleEmbed(req: Request): Response | null {
  const u = new URL(req.url);
  if (u.pathname === "/embed.js") return new Response(EMBED_JS, { headers: { "content-type": "application/javascript" } });
  if (u.pathname === "/embed/widget") {
    const site = u.searchParams.get("site") ?? "";
    return new Response(`<html><body><h1>rcaptcha ${site}</h1><p>A fun reward for speed, not a bot filter.</p></body></html>`, { headers: { "content-type": "text/html", "Content-Security-Policy": "frame-ancestors 'none'" } });
  }
  return null;
}
