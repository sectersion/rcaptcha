function embedJs(): string {
  return `(()=>{const me=document.currentScript;const origin=new URL(me.src).origin;document.querySelectorAll(".rcaptcha[data-site-key]").forEach((el)=>{if(el.querySelector("iframe"))return;const f=document.createElement("iframe");f.src=origin+"/embed/widget?site="+encodeURIComponent(el.getAttribute("data-site-key")||"demo");f.width="340";f.height="480";f.style.border="1px solid #e2e8f0";f.style.borderRadius="12px";f.title="rcaptcha challenge";el.appendChild(f);});})();`;
}

function widgetHtml(site: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>rcaptcha widget</title><style>*{box-sizing:border-box}body{margin:0;font:14px/1.5 system-ui,sans-serif;padding:12px;color:#0f172a}h1{font-size:16px;margin:0 0 4px}.cav{font-size:11px;color:#64748b;margin:0 0 8px}#prompt{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px;white-space:pre-wrap;max-height:150px;overflow:auto;font-size:12px}#count{font-size:12px;color:#64748b}textarea{width:100%;min-height:64px;border:1px solid #e2e8f0;border-radius:8px;padding:8px;font-size:13px}button{background:#0f172a;color:#fff;border:0;border-radius:8px;padding:8px 14px;font-weight:600;cursor:pointer;box-shadow:0 3px 0 #020617}button:active{transform:translateY(3px);box-shadow:none}#result{font-size:12px;margin-top:8px;word-break:break-all}</style></head><body><h1>rcaptcha <span style="font-size:11px;color:#64748b">site: ${site.replace(/</g, "&lt;")}</span></h1><p class="cav">Fun reward for speed, not a bot filter.</p><button id="start" type="button">Start</button><div id="prompt">Press Start.</div><p id="count"></p><textarea id="a" aria-label="Answer" placeholder="answer"></textarea><div style="margin-top:8px"><button id="sub" type="button">Submit</button></div><div id="result"></div><script>
var token="",exp=0,timer=null;
var P=document.getElementById("prompt"),C=document.getElementById("count"),A=document.getElementById("a"),R=document.getElementById("result");
document.getElementById("start").onclick=function(){R.textContent="";P.textContent="Loading…";
fetch("/api/challenge",{method:"POST",headers:{"content-type":"application/json"},body:"{}"}).then(function(r){return r.json();}).then(function(j){
if(j.error||!j.token){P.textContent="Error: "+JSON.stringify(j);return;}
token=j.token;P.textContent=j.prompt;exp=new Date(j.expiresAt).getTime();clearInterval(timer);
timer=setInterval(function(){var l=Math.max(0,exp-Date.now());C.textContent=(l/1000).toFixed(0)+"s left";if(!l)clearInterval(timer);},200);});};
document.getElementById("sub").onclick=function(){if(!token){R.textContent="Press Start first.";return;}
fetch("/api/answer",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token:token,answer:A.value})}).then(function(r){return r.json();}).then(function(j){
clearInterval(timer);token="";R.textContent=JSON.stringify(j).slice(0,200);
if(j.pass){parent.postMessage({type:"rcaptcha-pass",certificate:j.certificate,verify:"/verify?cert="+encodeURIComponent(j.certificate)},"*");}});};
</script></body></html>`;
}

export function handleEmbed(req: Request): Response | null {
  const u = new URL(req.url);
  if (u.pathname === "/embed.js")
    return new Response(embedJs(), { headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "public, max-age=300" } });
  if (u.pathname === "/embed/widget") {
    const site = (u.searchParams.get("site") || "demo").slice(0, 64);
    return new Response(widgetHtml(site), {
      headers: {
        "content-type": "text/html; charset=utf-8",
        // TODO(v0.2): per-site frame-ancestors from site keys. Demo allows same-origin framing.
        "Content-Security-Policy": "frame-ancestors 'self'",
      },
    });
  }
  return null;
}
