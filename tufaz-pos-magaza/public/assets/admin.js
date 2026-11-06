"use strict";
(() => {
  const {$,list,h,tl,api,msg}=window.Tufaz;
  const login=$("#admin-login");
  if(login)login.addEventListener("submit",async e=>{
    e.preventDefault();
    const button=$("button",login);
    button.disabled=true;
    try{
      await api("/api/admin/login",{password:new FormData(login).get("password")});
      location.assign("/admin");
    }catch(error){msg($(".form-message",login),error.message,true);button.disabled=false}
  });
  $("#admin-logout")?.addEventListener("click",async()=>{await api("/api/admin/logout",{});location.assign("/admin")});
  const view=$("#admin-view");
  if(!view)return;
  const status=$("#admin-status");
  const path=view.dataset.path;
  let snapshot;
  const cats={yazilim:"Yazılım",donanim:"Donanım",nfc:"NFC",hizmet:"Kurulum ve hizmet"};
  const statusNames={active:"Yayında",quote:"Teklif",soon:"Yakında",draft:"Taslak"};
  const requestStatus={new:"Yeni",review:"İnceleniyor",approved:"Onaylandı",closed:"Kapandı"};
  const periods={once:"Tek seferlik",monthly:"Aylık",yearly:"Yıllık"};
  const option=(value,label,selected)=>`<option value="${h(value)}"${selected===value?" selected":""}>${h(label)}</option>`;
  const select=(name,values,selected)=>`<select name="${name}">${Object.entries(values).map(([value,label])=>option(value,label,selected)).join("")}</select>`;
  const label=(name,field)=>`<label>${name}${field}</label>`;
  const field=(name,value="",attrs="")=>`<input name="${name}" value="${h(value)}" ${attrs}>`;
  const text=(name,value="",attrs="")=>`<textarea name="${name}" ${attrs}>${h(value)}</textarea>`;
  const checked=(name,value,title)=>`<label class="checks"><input type="checkbox" name="${name}"${value?" checked":""}>${title}</label>`;
  const btn=(action,label,id="",kind="secondary")=>`<button type="button" class="btn ${kind}" data-action="${action}" data-id="${h(id)}">${label}</button>`;
  const stamp=s=>new Intl.DateTimeFormat("tr-TR",{dateStyle:"short",timeStyle:"short",timeZone:"Europe/Istanbul"}).format(new Date(s));
  const dateInput=s=>s?new Date(Date.parse(s)+3*3600000).toISOString().slice(0,16):"";
  const dateIso=s=>s?new Date(s+"+03:00").toISOString():null;
  const cents=s=>s===""||s==null?null:Math.round(Number(s)*100);
  const number=s=>s===""||s==null?null:Number(s);
  const close=()=>'<button type="button" class="btn secondary" data-action="cancel">Vazgeç</button>';
  const formActions=()=>`<div class="admin-tools"><button class="btn primary" type="submit">Kaydet</button>${close()}</div>`;
  const inPrice=(name,value)=>field(name,value===null||value===undefined?"":value/100,'type="number" step="0.01" min="0"');
  function row(content,actions){return `<article class="admin-row"><div>${content}</div>${actions}</article>`}
  function listProducts(){
    return `<div class="admin-tools"><label>Ürün ara<input type="search" id="admin-search" placeholder="Ad, ürün kodu veya kategori"></label>${btn("new-product","Ürün Ekle","","primary")}</div><div class="admin-rows">${snapshot.state.products.map(p=>row(
      `<strong>${h(p.name)}</strong><small>${h(p.sku)} · ${h(cats[p.category])} · ${statusNames[p.status]} · ${p.price===null?"Fiyat yok":tl(p.price)}${p.stock===null?"":" · Stok "+p.stock}</small>`,
      btn("edit-product","Düzenle",p.id)+(p.status!=="draft"?btn("archive-product","Taslağa al",p.id):"")
    )).join("")}</div>`;
  }
  function listCoupons(){
    const coupons=snapshot.state.coupons;
    return `<div class="admin-tools"><p>İndirim ilk döneme uygulanır. Kota, onaylanan talepler üzerinden izlenir.</p>${btn("new-coupon","Kupon Oluştur","","primary")}</div>
      <div class="admin-rows">${coupons.length?coupons.map(c=>{
        const used=snapshot.state.requests.filter(r=>r.status==="approved"&&r.couponId===c.id).length;
        const value=c.type==="percent"?"%"+c.value:tl(c.value);
        return row(`<strong>${h(c.code)}</strong><small>${value} · ${c.active?"Açık":"Kapalı"} · ${h(cats[c.category]||"Tüm ürünler")} · ${used}${c.limit===null?"":"/"+c.limit} onay</small>`,btn("edit-coupon","Düzenle",c.id)+(c.active?btn("disable-coupon","Kapat",c.id):""));
      }).join(""):"<p class='empty'>Henüz kupon oluşturulmadı.</p>"}</div>`;
  }
  function productForm(p={}){
    const samples={"":"Görselsiz","/assets/pos.svg":"Adisyon ekranı","/assets/kitchen.svg":"Mutfak ekranı","/assets/printer.svg":"Yazıcı","/assets/terminal.svg":"POS terminali","/assets/scanner.svg":"Okuyucu","/assets/qr.svg":"QR Menü","/assets/voice.svg":"Sesli sipariş","/assets/play.svg":"Oyun","/assets/nfc.svg":"NFC"};
    if(p.image?.startsWith("/media/"))samples[p.image]="Mevcut yüklenen görsel";
    return `<h2>${p.id?"Ürünü düzenle":"Yeni ürün"}</h2><form class="form admin-form" id="product-form" data-id="${h(p.id)}">
      <div class="fields">
        ${label("Ürün adı",field("name",p.name,'required maxlength="85"'))}
        ${label("Ürün kodu",field("sku",p.sku,'required maxlength="40"'))}
        ${label("Kategori",select("category",cats,p.category||"yazilim"))}
        ${label("Alt kategori (isteğe bağlı)",field("subcategory",p.subcategory,'maxlength="50"'))}
        ${label("Yayın durumu",select("status",statusNames,p.status||"draft"))}
        ${label("Adres adı (boşsa addan oluşur)",field("slug",p.slug,'maxlength="85"'))}
        ${label("Fiyat dönemi",select("period",periods,p.period||"once"))}
        ${label("KDV hariç fiyat (TL)",inPrice("price",p.price))}
        ${label("KDV oranı (%)",field("vat",p.vat,'type="number" step="1" min="0" max="100"'))}
        ${label("Stok adedi (boşsa izlenmez)",field("stock",p.stock,'type="number" min="0" step="1" max="99999"'))}
        ${label("Görsel seç",select("image",samples,p.image||""))}
        ${label("Görsel yükle (en çok 1,5 MB)",'<input type="file" name="file" accept="image/png,image/jpeg,image/webp">')}
        ${label("Görsel açıklaması",field("alt",p.alt,'maxlength="120"'))}
      </div>
      <img class="admin-image" id="admin-image" alt="Ürün görseli önizlemesi"${p.image?` src="${h(p.image)}"`:" hidden"}>
      ${label("Kısa açıklama",field("brief",p.brief,'required maxlength="120"'))}
      ${label("Ürün açıklaması",text("description",p.description,'required maxlength="1800" rows="4"'))}
      ${label("Cihaz ve yazılım uyumluluğu",text("compatibility",p.compatibility,'maxlength="360" rows="2"'))}
      ${label("Garanti, teslim veya kurulum bilgisi",text("warranty",p.warranty,'maxlength="240" rows="2"'))}
      ${checked("featured",p.featured,"Öne çıkar")}${formActions()}</form>`;
  }
  function couponForm(c={}){
    return `<h2>${c.id?"Kuponu düzenle":"Yeni kupon"}</h2><form class="form admin-form" id="coupon-form" data-id="${h(c.id)}">
      <div class="fields">
        ${label("Kupon kodu",field("code",c.code,'required minlength="3" maxlength="24"'))}
        ${label("İndirim türü",select("type",{percent:"Yüzde",fixed:"Sabit tutar (TL)"},c.type||"percent"))}
        ${label("İndirim değeri",field("value",c.type==="fixed"?c.value/100:c.value,'required type="number" min="0.01" step="0.01"'))}
        ${label("Uygulandığı kategori",select("category",{"":"Tüm ürünler",...cats},c.category||""))}
        ${label("En az sepet tutarı (TL)",inPrice("minimum",c.minimum))}
        ${label("En yüksek indirim (TL)",inPrice("maximum",c.maximum))}
        ${label("Başlangıç (Türkiye saati)",field("start",dateInput(c.start),'type="datetime-local"'))}
        ${label("Bitiş (Türkiye saati)",field("end",dateInput(c.end),'type="datetime-local"'))}
        ${label("Onaylanan talep sınırı",field("limit",c.limit,'type="number" min="1" max="10000"'))}
      </div>${checked("active",c.active??true,"Kupon kullanıma açık")}${formActions()}</form>`;
  }
  function requestRows(){
    const requests=snapshot.state.requests;
    return `<p class="fine">Bunlar teklif ve kurulum talepleridir. Ödeme veya abonelik oluşturmaz.</p><div class="admin-rows">${requests.length?requests.map(r=>row(
      `<details><summary><strong>${h(r.reference)} · ${h(r.business)}</strong><small>${h(r.subject)} · ${stamp(r.at)}</small></summary>
        <p class="request-meta">${h(r.email)}\n${h(r.message)}</p>${r.selection?`<ul>${r.selection.lines.map(l=>`<li>${l.quantity} × ${h(l.name)} · ${tl(l.amount)}</li>`).join("")}</ul>
        <p class="fine">İlk dönem ${tl(r.selection.total??r.selection.net)}${r.selection.tax===null?" + KDV":""} ${r.selection.coupon?"· "+h(r.selection.coupon.code):""}</p>`:""}</details>`,
      `<label>Durum<select data-request="${h(r.id)}">${Object.entries(requestStatus).map(([value,name])=>option(value,name,r.status)).join("")}</select></label>`
    )).join(""):"<p class='empty'>Henüz talep yok.</p>"}</div>`;
  }
  function settings(){
    const s=snapshot.state.settings;
    return `<form class="form admin-form" id="settings-form">
      ${label("Ana sayfa başlığı",field("heroTitle",s.heroTitle,'required maxlength="60"'))}
      ${label("Ana sayfa kısa açıklaması",text("heroText",s.heroText,'required maxlength="140" rows="2"'))}
      ${label("İletişim e-postası",field("email",s.email,'type="email" maxlength="160"'))}
      ${label("İletişim telefonu",field("phone",s.phone,'type="tel" maxlength="25"'))}
      ${label("Üst duyuru (boşsa gizli)",field("notice",s.notice,'maxlength="100"'))}
      <button class="btn primary" type="submit">Ayarları Kaydet</button></form>`;
  }
  function history(){
    return '<div class="admin-rows">'+(snapshot.state.audit.length?snapshot.state.audit.map(a=>row(
      `<strong>${h(a.action)}</strong><small>${h(a.subject)} · ${stamp(a.at)}</small>`,"")
    ).join(""):"<p class='empty'>Henüz işlem yok.</p>")+"</div>";
  }
  function summary(){
    const {products,coupons,requests}=snapshot.state;
    return `<div class="admin-counts"><a href="/admin/urunler"><strong>${products.length}</strong> Katalog ürünü</a><a href="/admin/kuponlar"><strong>${coupons.filter(c=>c.active).length}</strong> Açık kupon</a><a href="/admin/talepler"><strong>${requests.filter(r=>r.status==="new").length}</strong> Yeni talep</a></div>
      <p class="fine">Ürünleri, fiyatları ve gelen talepleri buradan yönetebilirsiniz.</p>`;
  }
  const screens={"/admin":summary,"/admin/urunler":listProducts,"/admin/kuponlar":listCoupons,"/admin/talepler":requestRows,"/admin/ayarlar":settings,"/admin/gecmis":history};
  function render(){view.innerHTML=screens[path]()}
  async function reload(message=""){
    snapshot=await api("/api/admin/state");
    render();
    msg(status,message);
  }
  async function change(payload){
    await api("/api/admin/change",{...payload,revision:snapshot.revision});
    await reload("Kaydedildi.");
  }
  view.addEventListener("input",e=>{
    if(e.target.id!=="admin-search")return;
    const value=e.target.value.trim().toLocaleLowerCase("tr");
    for(const row of list(".admin-row",view))row.hidden=!row.textContent.toLocaleLowerCase("tr").includes(value);
  });
  let objectUrl;
  function setPreview(src){
    const img=$("#admin-image");
    if(!img)return;
    img.hidden=!src;
    if(src)img.src=src;
    else img.removeAttribute("src");
  }
  view.addEventListener("change",async e=>{
    const node=e.target;
    if(node.name==="file"){
      if(objectUrl)URL.revokeObjectURL(objectUrl);
      objectUrl=node.files[0]?URL.createObjectURL(node.files[0]):null;
      setPreview(objectUrl||$('select[name="image"]',node.form).value);
    }
    if(node.name==="image"&&!$('input[name="file"]',node.form).files.length)setPreview(node.value);
    if(node.dataset.request){
      node.disabled=true;
      try{await change({action:"request-status",id:node.dataset.request,status:node.value})}
      catch(error){render();msg(status,error.message,true)}
    }
  });
  view.addEventListener("click",async e=>{
    const button=e.target.closest("[data-action]");
    if(!button || !snapshot)return;
    const id=button.dataset.id;
    const action=button.dataset.action;
    msg(status,"");
    if(action==="cancel"){render();return}
    if(action==="new-product"||action==="edit-product"){
      view.innerHTML=productForm(snapshot.state.products.find(p=>p.id===id));
      $('input[name="name"]',view).focus();
      return;
    }
    if(action==="new-coupon"||action==="edit-coupon"){
      view.innerHTML=couponForm(snapshot.state.coupons.find(c=>c.id===id));
      $('input[name="code"]',view).focus();
      return;
    }
    button.disabled=true;
    try{await change({action,id})}
    catch(error){msg(status,error.message,true);button.disabled=false}
  });
  view.addEventListener("submit",async e=>{
    e.preventDefault();
    const form=e.target;
    const button=$('button[type="submit"]',form);
    const data=Object.fromEntries(new FormData(form));
    const id=form.dataset.id;
    button.disabled=true;
    msg(status,"Kaydediliyor…");
    try{
      if(form.id==="product-form"){
        if(data.file?.size){
          if(data.file.size>1500000)throw new Error("Görsel en çok 1,5 MB olabilir.");
          const res=await fetch("/api/admin/image",{method:"POST",headers:{"content-type":data.file.type||"application/octet-stream"},body:data.file});
          const file=await res.json();
          if(!res.ok)throw new Error(file.error||"Görsel yüklenemedi.");
          data.image=file.path;
        }
        delete data.file;
        Object.assign(data,{price:cents(data.price),vat:number(data.vat),stock:number(data.stock),featured:data.featured==="on"});
        await change({action:"save-product",id,item:data});
      }else if(form.id==="coupon-form"){
        Object.assign(data,{value:data.type==="fixed"?cents(data.value):number(data.value),minimum:cents(data.minimum),maximum:cents(data.maximum),
          start:dateIso(data.start),end:dateIso(data.end),limit:number(data.limit),active:data.active==="on"});
        await change({action:"save-coupon",id,item:data});
      }else if(form.id==="settings-form"){await change({action:"save-settings",item:data})}
    }catch(error){msg(status,error.message,true);button.disabled=false}
  });
  reload().catch(error=>{view.textContent="Panel açılmadı.";msg(status,error.message,true)});
})();
