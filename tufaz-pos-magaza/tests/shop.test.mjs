import {test} from "node:test";
import assert from "node:assert/strict";
import {once} from "node:events";
import {spawn} from "node:child_process";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";

test("Mağaza, yönetim, görsel ve kupon işlemleri", async t => {
  const dir=await mkdtemp(join(tmpdir(),"tufaz-shop-test-"));
  const password="yerel-gecici-test-parolasi";
  let child;
  const stop=async()=>{
    if(child?.exitCode===null && child?.signalCode===null){const closed=once(child,"exit");child.kill();await closed}
  };
  t.after(async()=>{await stop();await rm(dir,{recursive:true,force:true})});
  async function start(){
    child=spawn(process.execPath,["portable/server.mjs","--host","127.0.0.1","--port","0"],{
      env:{...process.env,TUFAZ_DATA_DIR:dir,TUFAZ_ADMIN_PASSWORD:password,TUFAZ_ORIGIN:""},
      stdio:["ignore","pipe","inherit"],
    });
    const [chunk]=await Promise.race([once(child.stdout,"data"),once(child,"exit").then(()=>{throw Error("Test sunucusu açılamadı.")})]);
    return /http:\/\/127\.0\.0\.1:\d+/.exec(String(chunk))[0];
  }
  let origin=await start();
  let cookie="";
  async function post(path,data,extra={}){
    return fetch(origin+path,{method:"POST",headers:{origin,"content-type":"application/json",cookie,...extra},body:JSON.stringify(data)});
  }
  const html=async path=>{
    const response=await fetch(origin+path);
    assert.equal(response.status,200,path);
    return response.text();
  };
  const state=async()=>{
    const response=await fetch(origin+"/api/admin/state",{headers:{cookie}});
    assert.equal(response.status,200);
    return response.json();
  };
  const update=async(payload,revision)=>{
    revision ??= (await state()).revision;
    const response=await post("/api/admin/change",{...payload,revision});
    return [response.status,await response.json()];
  };
  assert.match(await html("/"),/Restoran ve kafe teknolojileri/);
  assert.match(await html("/magaza?q=NFC-YRM"),/DOKUN Google yorum kartı/);
  assert.doesNotMatch(await html("/magaza?q=NFC-YRM"),/Termal fiş yazıcı/);
  for (const route of ["/yazilim","/donanim","/nfc","/fiyatlar","/paketler/kafe","/kurulum","/iletisim","/sepet","/odeme","/sesli-siparis","/destek","/rehber"]) await html(route);
  assert.equal((await fetch(origin+"/bilinmeyen-adres")).status,404);
  assert.equal((await fetch(origin+"/api/admin/state")).status,401);
  assert.equal((await post("/api/admin/login",{password:"yanlis"})).status,401);
  assert.equal((await post("/api/admin/login",{password},{origin:"https://example.invalid"})).status,403);
  const login=await post("/api/admin/login",{password});
  assert.equal(login.status,200);
  assert.match(login.headers.get("set-cookie"),/HttpOnly; SameSite=Strict/);
  cookie=login.headers.get("set-cookie").split(";")[0];

  const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZYAAAAASUVORK5CYII=","base64");
  const image=await fetch(origin+"/api/admin/image",{method:"POST",headers:{origin,cookie,"content-type":"image/png"},body:png});
  assert.equal(image.status,201);
  const {path}=await image.json();
  assert.equal((await fetch(origin+path)).status,404);
  assert.equal((await fetch(origin+path,{headers:{cookie}})).status,200);
  const rev=(await state()).revision;
  const item={name:"İşletme Yazıcısı",sku:"QA-01",category:"donanim",subcategory:"Test yazıcıları",period:"once",status:"active",price:200000,vat:20,stock:3,
    description:"Katalog test ürünü",brief:"Termal yazıcı örneği",image:path,alt:"Test yazıcısı",featured:true};
  assert.equal((await update({action:"save-product",item:{...item,price:null}}))[0],400);
  assert.equal((await update({action:"save-product",item},rev))[0],200);
  assert.equal((await update({action:"save-product",item:{...item,sku:"QA-02"}},rev))[0],409);
  assert.equal((await update({action:"save-product",item}))[0],409);
  assert.match(await html("/donanim?grup=Test+yaz%C4%B1c%C4%B1lar%C4%B1"),/İşletme Yazıcısı/);
  assert.match(await html("/donanim/isletme-yazicisi"),/2\.000 TL/);
  assert.equal((await fetch(origin+path)).status,200);
  const product=(await state()).state.products.find(p=>p.sku==="QA-01");

  const coupon={code:"TEST10",type:"percent",value:10,minimum:100000,maximum:null,category:"donanim",start:null,end:null,limit:1,active:true};
  assert.equal((await update({action:"save-coupon",item:coupon}))[0],200);
  const items=[{id:product.id,quantity:1,price:1}];
  const quote=await post("/api/quote",{items,coupon:"TEST10"}).then(r=>r.json());
  assert.deepEqual([quote.subtotal,quote.discount,quote.tax,quote.total],[200000,20000,36000,216000]);
  assert.equal((await post("/api/quote",{items:[{id:product.id,quantity:4}]})).status,400);
  assert.equal((await post("/api/quote",{items:[{id:"kafe",quantity:1}],coupon:"TEST10"})).status,400);
  const checkout={items,coupon:"TEST10",kind:"cart",email:"test@example.invalid",business:"Test işletmesi",key:"1234567890abcdef1234567890abcdef1234"};
  const first=await post("/api/request",checkout).then(r=>r.json());
  assert.match(first.reference,/^TFZ-/);
  const repeat=await post("/api/request",checkout).then(r=>r.json());
  assert.equal(repeat.reference,first.reference);
  const pending=(await state()).state.requests;
  assert.equal(pending.length,1);
  assert.equal((await update({action:"request-status",id:pending[0].id,status:"approved"}))[0],200);
  assert.equal((await post("/api/quote",{items,coupon:"TEST10"})).status,400);

  // Her yayındaki ürün sepete eklenebilir: fiyatlı, teklif ve ön kayıt kalemleri ayrı hesaplanır.
  for (const route of ["/magaza","/yazilim","/donanim","/nfc","/hizmet","/fiyatlar"]) {
    const page=await html(route);
    const cards=page.split('<article class="market-product">').slice(1);
    assert.ok(cards.length>0,route);
    for (const card of cards) assert.match(card,/class="btn primary add"/,route+" kartında Sepete Ekle yok");
  }
  const mixed=await post("/api/quote",{items:[{id:"restoran",quantity:1},{id:"qr-menu",quantity:1},{id:"termal-fis-yazici",quantity:3},{id:"play",quantity:1}]}).then(r=>r.json());
  assert.deepEqual(mixed.lines.map(l=>l.mode),["buy","quote","quote","preorder"]);
  assert.equal(mixed.subtotal,299900);
  assert.equal(mixed.monthly,299900);
  assert.deepEqual([mixed.quoteCount,mixed.preorderCount],[2,1]);
  assert.ok(mixed.lines.filter(l=>l.mode!=="buy").every(l=>l.amount===null && l.price===null),"Fiyatsız ürün 0 TL sayılmamalı");
  assert.equal((await post("/api/quote",{items:[{id:"qr-menu",quantity:2}]})).status,400,"Yazılım modülü tek adet olmalı");
  const quoteOnly=await post("/api/quote",{items:[{id:"google-yorum-karti",quantity:5}]}).then(r=>r.json());
  assert.deepEqual([quoteOnly.subtotal,quoteOnly.total,quoteOnly.tax],[0,null,null]);
  const quoteRequest=await post("/api/request",{items:[{id:"google-yorum-karti",quantity:5},{id:"play",quantity:1}],kind:"cart",email:"nfc@example.invalid",
    business:"NFC işletmesi",phone:"0312 555 00 00",businessType:"kafe",city:"Ankara, Çankaya",key:"abcdef1234567890abcdef1234567890abcd"});
  assert.equal(quoteRequest.status,201);
  const saved=(await state()).state.requests[0];
  assert.deepEqual([saved.subject,saved.phone,saved.businessType,saved.city],["Teklif ve ön kayıt talebi","0312 555 00 00","kafe","Ankara, Çankaya"]);
  assert.equal((await post("/api/request",{items:[],kind:"contact",email:"a@example.invalid",business:"X",businessType:"uydurma",key:"bbcdef1234567890abcdef1234567890abcd"})).status,400);

  // Bas-Konuş sesli sipariş olarak anlatılır, telsiz olarak değil.
  const voicePage=await html("/sesli-siparis");
  assert.match(voicePage,/önizleme/i);
  assert.doesNotMatch(voicePage,/telsiz|walkie/i);
  // Hamburger menü, ortak sayfa başlığı, rehber bağlantısı ve kazanç hesaplayıcı
  const home=await html("/");
  assert.match(home,/aria-controls="site-menu"/);
  assert.match(home,/id="site-menu"/);
  assert.match(await html("/yazilim/bas-konus"),/href="\/sesli-siparis"/);
  assert.match(await html("/kazanc-hesaplayici"),/nakit tasarruf değildir/);
  assert.match(await html("/yazilim/qr-menu"),/rel="canonical" href="http:\/\/127\.0\.0\.1:\d+\/yazilim\/qr-menu"/);
  assert.match(await html("/paketler/kafe"),/rel="canonical" href="[^"]+\/yazilim\/kafe"/);

  // Arama motoru erişimi varsayılan kapalı, panelden açılır.
  assert.match(await fetch(origin+"/robots.txt").then(r=>r.text()),/Disallow: \//);
  assert.equal((await fetch(origin+"/sitemap.xml")).status,404);
  assert.match(home,/noindex,nofollow/);
  const settings=(await state()).state.settings;
  assert.equal((await update({action:"save-settings",item:{...settings,indexing:true}}))[0],200);
  assert.match(await fetch(origin+"/robots.txt").then(r=>r.text()),/Sitemap: http/);
  const sitemap=await fetch(origin+"/sitemap.xml").then(r=>r.text());
  assert.match(sitemap,/\/yazilim\/kafe</);
  assert.doesNotMatch(sitemap,/\/yazilim\/play<|\/sepet</);
  assert.match(await html("/"),/content="index,follow"/);
  assert.match(await html("/yazilim/play"),/content="noindex,follow"/);

  await stop();
  origin=await start();
  assert.match(await html("/donanim/isletme-yazicisi"),/İşletme Yazıcısı/);
  assert.equal((await fetch(origin+path)).status,200);
});

test("Eski kayıt yeni sürüme taşınır", async () => {
  const {initialState,migrateState,SEED_VERSION}=await import("../store/seed.mjs");
  const state=initialState();
  state.seedVersion=1;
  state.products=state.products.filter(p=>!["garson-uygulamasi","qr-siparis","egitim"].includes(p.id));
  const before=state.products.length;
  assert.equal(migrateState(state),true);
  assert.equal(state.products.length,before+3);
  assert.equal(state.seedVersion,SEED_VERSION);
  assert.equal(migrateState(state),false);
});
