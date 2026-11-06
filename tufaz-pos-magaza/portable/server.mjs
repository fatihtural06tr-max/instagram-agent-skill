import {createServer} from "node:http";
import {DatabaseSync} from "node:sqlite";
import {Readable} from "node:stream";
import {randomBytes,scryptSync,timingSafeEqual} from "node:crypto";
import {readFile,writeFile,access,mkdir} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {dirname,join,resolve} from "node:path";
import {parseArgs} from "node:util";
import {gzipSync} from "node:zlib";
import {initialState,migrateState} from "../store/seed.mjs";
import {handle} from "../store/service.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const {values:options} = parseArgs({options:{host:{type:"string"},port:{type:"string"},"strictPort":{type:"boolean"}}});
const host = options.host || process.env.TUFAZ_HOST || "127.0.0.1";
const port = Number(options.port || process.env.PORT || 4173);
const origin = process.env.TUFAZ_ORIGIN ? new URL(process.env.TUFAZ_ORIGIN).origin : null;
const data = resolve(process.env.TUFAZ_DATA_DIR || join(root,"data"));
const media = join(data,"media");
await mkdir(media,{recursive:true,mode:0o700});
const passwordFile = process.env.TUFAZ_ADMIN_PASSWORD_FILE || join(data,"admin-password.txt");
const password = process.env.TUFAZ_ADMIN_PASSWORD || await readFile(passwordFile,"utf8").then(s=>s.trim(),()=>null);
const salt = randomBytes(32);
const hash = password?.length >= 12 ? scryptSync(password,salt,64) : null;
const db = new DatabaseSync(join(data,"tufaz.sqlite"));
db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; CREATE TABLE IF NOT EXISTS storefront_state (id integer primary key, revision integer not null default 0, payload text not null);");
db.prepare("INSERT OR IGNORE INTO storefront_state VALUES (1,0,?)").run(JSON.stringify(initialState()));
const select = db.prepare("SELECT revision,payload FROM storefront_state WHERE id=1");
const update = db.prepare("UPDATE storefront_state SET revision=revision+1,payload=? WHERE id=1 AND revision=?");
{
  // Eski kayıtları yeni sürüme bir kez taşı (yalnız eksik ürünler eklenir).
  const row = select.get();
  const state = JSON.parse(row.payload);
  if (migrateState(state)) update.run(JSON.stringify(state),row.revision);
}
const sessions = new Map();
const attempts = new Map();
const cookieName = "tufaz_admin";
const loginLife = 8 * 3600;
function token(req) {
  return (req.headers.get("cookie") || "").match(/(?:^|;\s*)tufaz_admin=([a-f0-9]{64})(?:;|$)/)?.[1];
}
function cookie(req,value,seconds) {
  return cookieName+"="+value+"; Path=/; HttpOnly; SameSite=Strict; Max-Age="+seconds+(new URL(req.url).protocol==="https:"?"; Secure":"");
}
function clean(map,now) {
  for (const [key,value] of map) if ((value.until ?? value) <= now) map.delete(key);
}
const auth = {
  configured:!!hash,
  allowed(req) {
    const now = Date.now();
    clean(sessions,now);
    return sessions.has(token(req));
  },
  login(req,input) {
    const now = Date.now();
    clean(attempts,now);
    const addr = req.headers.get("x-tufaz-local-ip") || "unknown";
    const attempt = attempts.get(addr) || {count:0,until:now+15*60*1000};
    if (attempt.count >= 8) return Response.json({error:"Çok sayıda deneme. Biraz sonra tekrar deneyin."},{status:429});
    if (!hash) return Response.json({error:"Yönetici parolası henüz ayarlanmadı."},{status:503});
    const value = typeof input.password === "string" ? input.password : "";
    if (value.length > 240 || !timingSafeEqual(hash,scryptSync(value,salt,64))) {
      attempt.count++;
      attempts.set(addr,attempt);
      return Response.json({error:"Parola geçersiz."},{status:401,headers:{"cache-control":"no-store"}});
    }
    attempts.delete(addr);
    sessions.delete(token(req));
    const session = randomBytes(32).toString("hex");
    sessions.set(session,now+loginLife*1000);
    return Response.json({ok:true},{headers:{"set-cookie":cookie(req,session,loginLife),"cache-control":"no-store"}});
  },
  logout(req) {
    sessions.delete(token(req));
    return Response.json({ok:true},{headers:{"set-cookie":cookie(req,"",0),"cache-control":"no-store"}});
  },
};
const env = {
  db:{
    async read(){const row=select.get();return {revision:row.revision,state:JSON.parse(row.payload)}},
    async write(revision,payload){return update.run(payload,revision).changes === 1},
  },
  media:{
    async read(key){return readFile(join(media,key)).catch(error=>{if(error.code==="ENOENT")return null;throw error})},
    async has(key){return access(join(media,key)).then(()=>true,()=>false)},
    async write(key,bytes){await writeFile(join(media,key),bytes,{flag:"wx",mode:0o600})},
  },
  auth,
};
const mime = {svg:"image/svg+xml",png:"image/png",webp:"image/webp",js:"text/javascript; charset=utf-8",css:"text/css; charset=utf-8"};
const compressible = /^(text\/|application\/(json|xml)|image\/svg)/;
async function incoming(raw) {
  const url = new URL(raw.url,origin || "http://" + (raw.headers.host || "localhost"));
  if (["GET","HEAD"].includes(raw.method) && /^\/assets\/[a-z0-9-]+\.(svg|png|webp|js|css)$/.test(url.pathname)) {
    const file = await readFile(join(root,"public",url.pathname)).catch(error=>{if(error.code==="ENOENT")return null;throw error});
    if (!file) return new Response(null,{status:404});
    // Sürüm parametreli dosyalar uzun süre önbellekte tutulur; sürüm değişince adres de değişir.
    const cache = url.searchParams.has("v") ? "public, max-age=2592000, immutable" : "public, max-age=600";
    return new Response(raw.method === "HEAD" ? null : file,{headers:{"content-type":mime[url.pathname.split(".").at(-1)],"x-content-type-options":"nosniff","cache-control":cache}});
  }
  const headers = new Headers(raw.headers);
  headers.set("x-tufaz-local-ip",raw.socket.remoteAddress || "");
  const body = ["GET","HEAD"].includes(raw.method) ? undefined : Readable.toWeb(raw);
  return handle(new Request(url,{method:raw.method,headers,body,duplex:body?"half":undefined}),env);
}
const server=createServer(async (raw,out)=>{
  try {
    const response=await incoming(raw);
    const headers=Object.fromEntries(response.headers);
    const type=response.headers.get("content-type")||"";
    if(response.body && raw.method==="GET" && compressible.test(type) && /\bgzip\b/.test(raw.headers["accept-encoding"]||"")){
      const bytes=Buffer.from(await response.arrayBuffer());
      const body=bytes.length>1024?gzipSync(bytes):bytes;
      if(body!==bytes){headers["content-encoding"]="gzip";headers.vary="Accept-Encoding";}
      headers["content-length"]=String(body.length);
      out.writeHead(response.status,headers);
      out.end(body);
      return;
    }
    out.writeHead(response.status,headers);
    if(response.body) Readable.fromWeb(response.body).pipe(out);
    else out.end();
  } catch(error) {
    console.error("Sunucu hatası:",error.message);
    if (!out.headersSent) out.writeHead(500,{"content-type":"text/plain; charset=utf-8"});
    out.end("İşlem tamamlanamadı.");
  }
});
server.listen(port,host,()=>{
  const address=server.address();
  console.log("TUFAZ POS  http://"+host+":"+address.port);
  if (!hash) console.log("Yönetim parolası için data/admin-password.txt dosyasına en az 12 karakter yazıp sunucuyu yeniden başlatın.");
});
