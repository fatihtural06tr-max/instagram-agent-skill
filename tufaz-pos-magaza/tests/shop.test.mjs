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
  await stop();
  origin=await start();
  assert.match(await html("/donanim/isletme-yazicisi"),/İşletme Yazıcısı/);
  assert.equal((await fetch(origin+path)).status,200);
});
