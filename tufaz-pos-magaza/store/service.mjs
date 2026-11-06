import {initialState,storefrontSettings,migrateState} from "./seed.mjs";
import {quoteCart,submitRequest,updateAdmin,InputError,publiclyVisible} from "./model.mjs";
import {renderPage,sitemapPaths} from "./pages.mjs";

const JSON_HEADERS = {"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
const json = (data,status=200,headers={}) => Response.json(data,{status,headers:{...JSON_HEADERS,...headers}});
const deny = (msg,status) => { throw new InputError(msg,status); };
const writeMethod = req => {
  if (req.method !== "POST") deny("İstek yöntemi desteklenmiyor.",405);
  const origin = req.headers.get("origin");
  if (!origin || origin !== new URL(req.url).origin) deny("İsteği aynı siteden gönderin.",403);
};
async function body(req, max = 32_768) {
  if (!req.headers.get("content-type")?.startsWith("application/json")) deny("İstek biçimi geçersiz.",415);
  const data = await limitedBytes(req, max);
  try {
    const value = JSON.parse(new TextDecoder().decode(data));
    if (!value || Array.isArray(value) || typeof value !== "object") throw new Error();
    return value;
  } catch { deny("İstek içeriği okunamadı.",400); }
}
async function limitedBytes(req, limit) {
  if (Number(req.headers.get("content-length")) > limit) deny("Dosya veya istek çok büyük.",413);
  const reader = req.body?.getReader();
  const chunks = [];
  let count = 0;
  if (!reader) return new Uint8Array();
  for (;;) {
    const item = await reader.read();
    if (item.done) break;
    count += item.value.byteLength;
    if (count > limit) {
      await reader.cancel();
      deny("Dosya veya istek çok büyük.",413);
    }
    chunks.push(item.value);
  }
  const result = new Uint8Array(count);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk,offset); offset += chunk.length; }
  return result;
}

function mediaType(bytes) {
  const letters = new TextDecoder();
  if (bytes.length > 20 && letters.decode(bytes.slice(0,4)) === "RIFF" && letters.decode(bytes.slice(8,12)) === "WEBP") return ["webp","image/webp"];
  if (bytes.length > 24 && [137,80,78,71,13,10,26,10].every((b,i)=>bytes[i] === b)) return ["png","image/png"];
  if (bytes.length > 8 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return ["jpg","image/jpeg"];
  deny("PNG, JPEG veya WebP görsel yükleyin.",415);
}

async function readState(env) {
  const current = await env.db.read();
  migrateState(current.state);
  return current;
}

async function change(env, transform, revision = null) {
  for (let attempt=0; attempt<5; attempt++) {
    const current = await readState(env);
    if (revision !== null && current.revision !== revision) deny("Bu sırada bir kayıt değişti. Paneli yenileyip tekrar deneyin.",409);
    const result = transform(current.state);
    if (!result.changed) return {...result.data,revision:current.revision};
    const payload = JSON.stringify(current.state);
    if (new TextEncoder().encode(payload).length > 1_500_000) deny("Kayıt alanı dolu. Yeni kayıt için arşivi dışarı alın.",507);
    if (await env.db.write(current.revision,payload)) return {...result.data,revision:current.revision+1};
    if (revision !== null) deny("Bu sırada bir kayıt değişti. Paneli yenileyip tekrar deneyin.",409);
  }
  deny("Birden fazla işlem çakıştı. Biraz sonra tekrar deneyin.",409);
}

export function d1State(db) {
  return {
    async read() {
      let row = await db.prepare("SELECT revision, payload FROM storefront_state WHERE id = 1").first();
      if (!row) {
        await db.prepare("INSERT OR IGNORE INTO storefront_state (id,revision,payload) VALUES (1,0,?)").bind(JSON.stringify(initialState())).run();
        row = await db.prepare("SELECT revision, payload FROM storefront_state WHERE id = 1").first();
      }
      return {revision:row.revision,state:JSON.parse(row.payload)};
    },
    async write(revision,payload) {
      const result = await db.prepare("UPDATE storefront_state SET revision = revision + 1, payload = ? WHERE id = 1 AND revision = ?").bind(payload,revision).run();
      return result.meta.changes === 1;
    }
  };
}

export async function handle(req,env) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/,"") || "/";
  const head = req.method === "HEAD";
  try {
    if (path === "/robots.txt" && (req.method === "GET" || head)) {
      const {state} = await readState(env);
      const open = storefrontSettings(state.settings).indexing;
      const text = open
        ? "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /sepet\nDisallow: /odeme\nDisallow: /siparis/\nDisallow: /hesap\nSitemap: " + url.origin + "/sitemap.xml\n"
        : "User-agent: *\nDisallow: /\n";
      return new Response(head?null:text,{headers:{"content-type":"text/plain;charset=utf-8","cache-control":"no-store"}});
    }
    if (path === "/favicon.ico" && (req.method === "GET" || head)) {
      return new Response(null,{status:301,headers:{location:"/assets/favicon.svg","cache-control":"public, max-age=86400"}});
    }
    if (path === "/sitemap.xml" && (req.method === "GET" || head)) {
      const {state} = await readState(env);
      if (!storefrontSettings(state.settings).indexing) return new Response(null,{status:404});
      const esc = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;");
      const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        sitemapPaths(state).map(p=>"  <url><loc>"+esc(url.origin+p)+"</loc></url>").join("\n") + "\n</urlset>\n";
      return new Response(head?null:xml,{headers:{"content-type":"application/xml;charset=utf-8","cache-control":"no-store"}});
    }
    if (path.startsWith("/media/") && (req.method === "GET" || head)) {
      const id = path.slice(7);
      if (!/^[0-9a-f-]{36}\.(webp|png|jpg)$/.test(id)) return new Response(null,{status:404});
      const {state} = await readState(env);
      const shown = state.products.some(p => p.image === path && publiclyVisible(p));
      if (!shown && !env.auth.allowed(req)) return new Response(null,{status:404});
      const file = await env.media.read(id);
      if (!file) return new Response(null,{status:404});
      return new Response(head ? null : file,{headers:{"content-type":id.endsWith(".jpg")?"image/jpeg":id.endsWith(".png")?"image/png":"image/webp",
        "cache-control":shown?"public, max-age=300":"no-store","x-content-type-options":"nosniff"}});
    }
    if (path === "/api/quote") {
      writeMethod(req);
      const data = await body(req);
      return json(quoteCart((await readState(env)).state,data));
    }
    if (path === "/api/request") {
      writeMethod(req);
      const data = await body(req);
      if (data.website) deny("Formu kontrol edin.",400);
      return json(await change(env,s=>submitRequest(s,data)),201);
    }
    if (path === "/api/admin/login") {
      writeMethod(req);
      if (!env.auth.login) deny("Bu kurulumda parola ile giriş kapalı.",404);
      return env.auth.login(req,await body(req,3000));
    }
    if (path === "/api/admin/logout") {
      writeMethod(req);
      if (!env.auth.logout) deny("Bu kurulumda parola ile giriş kapalı.",404);
      return env.auth.logout(req);
    }
    if (path.startsWith("/api/admin/")) {
      if (!env.auth.allowed(req)) deny("Yönetici oturumu gerekiyor.",401);
      if (path === "/api/admin/state" && req.method === "GET") {
        const snapshot = await readState(env);
        snapshot.state.settings = storefrontSettings(snapshot.state.settings);
        return json(snapshot);
      }
      writeMethod(req);
      if (path === "/api/admin/image") {
        const bytes = await limitedBytes(req, 1_500_000);
        const [ext,mime] = mediaType(bytes);
        const key = crypto.randomUUID() + "." + ext;
        await env.media.write(key,bytes,mime);
        return json({path:"/media/"+key},201);
      }
      if (path === "/api/admin/change") {
        const data = await body(req);
        if (!Number.isSafeInteger(data.revision) || data.revision < 0) deny("Önce güncel kayıtları yükleyin.",409);
        const candidate = data.action === "save-product" ? data.item?.image : null;
        if (typeof candidate === "string" && candidate.startsWith("/media/")) {
          const key = candidate.slice(7);
          if (!/^[0-9a-f-]{36}\.(webp|png|jpg)$/.test(key) || !(await env.media.has(key))) deny("Önce görseli yükleyin.",400);
        }
        return json(await change(env,state=>{updateAdmin(state,data);return {changed:true,data:{}}},data.revision));
      }
    }
    if (path.startsWith("/api/")) return json({error:"Bu işlem bulunamadı."},404);
    if (req.method !== "GET" && !head) return json({error:"İstek yöntemi desteklenmiyor."},405);
    const {state} = await readState(env);
    const page = renderPage(path,url,state,{authorized:env.auth.allowed(req),local:!!env.auth.login,configured:env.auth.configured});
    return new Response(head?null:page.html,{status:page.status,headers:{
      "content-type":"text/html;charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff",
      "referrer-policy":"same-origin","x-frame-options":"SAMEORIGIN",
      "content-security-policy":"default-src 'self'; img-src 'self' data: blob:; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'; form-action 'self'",
    }});
  } catch (err) {
    if (err instanceof InputError) return json({error:err.message},err.status);
    console.error("TUFAZ request error:",err?.message);
    return json({error:"İşlem tamamlanamadı. Biraz sonra tekrar deneyin."},500);
  }
}
