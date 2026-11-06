"use strict";
(() => {
  const $ = (s,root=document)=>root.querySelector(s);
  const list = (s,root=document)=>[...root.querySelectorAll(s)];
  const h = value => String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const number = new Intl.NumberFormat("tr-TR",{maximumFractionDigits:2});
  const tl = cents=>number.format(cents/100)+" TL";
  async function api(path,data) {
    const res = await fetch(path,data===undefined?{}:{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)});
    const payload = await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(payload.error||"İşlem tamamlanamadı.");
    return payload;
  }
  function msg(el,text,error=false) {
    if(!el) return;
    el.textContent=text;
    el.classList.toggle("error",error);
  }
  window.Tufaz={$ ,list,h,tl,api,msg};
  const motion = matchMedia("(prefers-reduced-motion: reduce)");

  // Görünüm: Sistem / Açık / Koyu. Seçim yalnız bu tarayıcıda saklanır; ilk çizimde theme.js uygular.
  const themeKey = "tufaz-theme";
  const markTheme = value => { for (const b of list("[data-theme-set]")) b.setAttribute("aria-pressed",String(b.dataset.themeSet===value)); };
  markTheme(document.documentElement.dataset.theme || "system");
  document.addEventListener("click",e=>{
    const button = e.target.closest("[data-theme-set]");
    if (!button) return;
    const value = button.dataset.themeSet;
    if (value==="light" || value==="dark") document.documentElement.dataset.theme = value;
    else delete document.documentElement.dataset.theme;
    try { value==="system" ? localStorage.removeItem(themeKey) : localStorage.setItem(themeKey,value); } catch {}
    markTheme(value);
  });

  // Hamburger menü
  const drawer = $("#site-menu");
  const backdrop = $(".drawer-backdrop");
  const opener = $("[data-menu-open]");
  let lastFocus = null;
  function setMenu(open) {
    if (!drawer) return;
    drawer.dataset.open = String(open);
    backdrop.hidden = !open;
    opener.setAttribute("aria-expanded",String(open));
    document.body.classList.toggle("menu-open",open);
    if (open) {
      lastFocus = document.activeElement;
      (drawer.querySelector("[aria-current]") || $(".drawer-close",drawer)).focus();
    } else if (lastFocus) {
      lastFocus.focus();
      lastFocus = null;
    }
  }
  opener?.addEventListener("click",()=>setMenu(drawer.dataset.open!=="true"));
  for (const el of list("[data-menu-close]")) el.addEventListener("click",()=>setMenu(false));
  document.addEventListener("keydown",e=>{
    if (drawer?.dataset.open!=="true") return;
    if (e.key==="Escape") { e.preventDefault(); setMenu(false); return; }
    if (e.key==="Tab") {
      const items = list("a[href],button,input",drawer).filter(el=>el.offsetParent!==null);
      const first = items[0], last = items.at(-1);
      if (e.shiftKey && document.activeElement===first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement===last) { e.preventDefault(); first.focus(); }
    }
  });

  const search = $(".search-pop");
  search?.addEventListener("toggle",()=>{ if (search.open) $("input",search).focus(); });
  search?.addEventListener("keydown",e=>{
    if (e.key==="Escape" && search.open) { search.open=false; $("summary",search).focus(); }
  });
  document.addEventListener("click",e=>{ if (search?.open && !search.contains(e.target)) search.open=false; });

  // Vitrin
  const campaign = $("[data-campaign]");
  if (campaign) {
    const tabs = list("[data-slide]",campaign);
    const panels = tabs.map(tab=>document.getElementById(tab.getAttribute("aria-controls")));
    let selected = 0;
    function showSlide(index) {
      selected = (index + tabs.length) % tabs.length;
      tabs.forEach((tab,i)=>{ tab.setAttribute("aria-pressed",String(i===selected)); panels[i].hidden = i!==selected; });
    }
    tabs.forEach((tab,i)=>tab.addEventListener("click",()=>showSlide(i)));
    for (const button of list("[data-slide-step]",campaign)) button.addEventListener("click",()=>showSlide(selected + Number(button.dataset.slideStep)));
    $(".campaign-tabs",campaign).addEventListener("keydown",e=>{
      if (e.key!=="ArrowLeft" && e.key!=="ArrowRight") return;
      e.preventDefault();
      showSlide(tabs.indexOf(document.activeElement) + (e.key==="ArrowRight" ? 1 : -1));
      tabs[selected].focus();
    });
  }

  const rail = $("[data-product-rail]");
  if (rail) {
    const [previous,next] = list("[data-rail-step]");
    const updateRail = () => {
      previous.disabled = rail.scrollLeft < 2;
      next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2;
    };
    for (const button of [previous,next]) button.addEventListener("click",()=>{
      const card = rail.firstElementChild;
      const gap = parseFloat(getComputedStyle(rail).columnGap)||0;
      rail.scrollBy({left:(card.offsetWidth + gap) * Number(button.dataset.railStep),behavior:motion.matches ? "auto" : "smooth"});
    });
    rail.addEventListener("scroll",updateRail,{passive:true});
    window.addEventListener("resize",updateRail,{passive:true});
    updateRail();
  }

  // Ürün sayfasında mobil satın alma çubuğu: üstteki fiyat kutusu görünmezken çıkar
  const buyBar = $("[data-buy-bar]");
  const buyBox = $("#detail-buy");
  if (buyBar && buyBox && "IntersectionObserver" in window) {
    new IntersectionObserver(([entry])=>buyBar.classList.toggle("is-visible",!entry.isIntersecting && entry.boundingClientRect.top < 0)).observe(buyBox);
  }

  // Sepet
  const cartKey="tufaz-store:cart:v2";
  const refKey="tufaz-store:last-reference";
  const read = key=>{try{return JSON.parse(localStorage.getItem(key)||"null")}catch{return null}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
  function load() {
    const saved=read(cartKey);
    return {items:Array.isArray(saved?.items)?saved.items.filter(i=>i && typeof i.id==="string" && Number.isInteger(i.quantity) && i.quantity>0).slice(0,30):[],
      coupon:typeof saved?.coupon==="string"?saved.coupon.slice(0,32):""};
  }
  let cart=load();
  let timer;
  const toast=$("#toast");
  const countEl=$("#cart-count");
  function updateHeader(bump=false){
    const count=cart.items.reduce((a,i)=>a+i.quantity,0);
    countEl.textContent=count;
    if (bump) { countEl.classList.remove("bump"); void countEl.offsetWidth; countEl.classList.add("bump"); }
    $(".cart-link").setAttribute("aria-label",`Sepet, ${count} ürün`);
    for(const button of list(".add")){
      const inCart=cart.items.some(i=>i.id===button.dataset.product);
      button.classList.toggle("in-cart",inCart);
      $("span",button).textContent=inCart?"Sepette":"Sepete Ekle";
      button.setAttribute("aria-label",inCart?button.dataset.name+" sepette, sepeti aç":button.dataset.name+" ürününü sepete ekle");
    }
  }
  function save(bump=false){ write(cartKey,cart); updateHeader(bump); }
  function notify(text){
    clearTimeout(timer);
    toast.hidden=false;
    $("#toast-message").textContent=text;
    timer=setTimeout(()=>toast.hidden=true,6000);
  }
  $(".toast-close")?.addEventListener("click",()=>toast.hidden=true);
  const addedText = {buy:" sepete eklendi.", quote:" sepete eklendi. Fiyatı teklifle bildirilecek.", preorder:" ön kayıt olarak sepete eklendi."};
  document.addEventListener("click",e=>{
    const button=e.target.closest(".add");
    if(!button) return;
    if(cart.items.some(i=>i.id===button.dataset.product)){location.assign("/sepet");return}
    if(cart.items.length>=30){notify("Sepet sınırına ulaştınız.");return}
    cart.items.push({id:button.dataset.product,quantity:1,name:button.dataset.name,period:button.dataset.period,mode:button.dataset.mode});
    save(true);
    notify(button.dataset.name+(addedText[button.dataset.mode]||addedText.buy));
  });
  updateHeader();

  const cartView=$(".checkout-grid");
  const cartLines=$("#cart-lines");
  const cartTotals=$("#cart-totals");
  const cartRequest=$("#cart-request");
  let quoteVersion=0;
  const moneyLine=(label,value,cls="")=>`<p${cls?` class="${cls}"`:""}><span>${h(label)}</span><strong>${h(value)}</strong></p>`;
  const kindText = item => item.mode==="preorder" ? "Ön kayıt · ödeme alınmaz"
    : item.mode==="quote" ? "Fiyat teklifle belirlenir"
    : item.period==="monthly" ? "Aylık abonelik, her ay yenilenir" : item.period==="yearly" ? "Yıllık abonelik" : "Tek seferlik";
  const renderLine=(item,quoted=true)=>{
    const canQty = quoted && item.maxQuantity>1;
    const end = !quoted ? "" : item.mode==="buy" ? `<b>${tl(item.amount)}${item.period==="monthly"?" / ay":item.period==="yearly"?" / yıl":""}</b>`
      : `<span class="pending">${item.mode==="preorder"?"Ön kayıt":"Teklif"}</span>`;
    return `<article class="cart-line">${quoted&&item.image?`<img class="cart-thumb" src="${h(item.image)}" alt="" width="64" height="48" loading="lazy">`:'<span class="cart-thumb"></span>'}
    <div><h3>${quoted?`<a href="${h(item.url)}">${h(item.name)}</a>`:h(item.name||"Ürün")}</h3><p>${kindText(item)}</p>
    ${canQty?`<div class="qty-group"><button type="button" class="qty" aria-label="${h(item.name)} adedini azalt" data-id="${h(item.id)}" data-delta="-1"${item.quantity<=1?" disabled":""}>−</button><span aria-label="Adet">${item.quantity}</span><button type="button" class="qty" aria-label="${h(item.name)} adedini artır" data-id="${h(item.id)}" data-delta="1"${item.quantity>=item.maxQuantity?" disabled":""}>+</button></div>`:""}</div>
    <div class="cart-line-end">${end}<button type="button" class="text-button" data-remove="${h(item.id)}">Kaldır</button></div></article>`;
  };
  function group(title,note,items){
    return items.length?`<section class="cart-group"><h2>${h(title)} <small>${h(note)}</small></h2>${items.map(i=>renderLine(i)).join("")}</section>`:"";
  }
  function applyQuote(result,feedback=""){
    const view=cartView.dataset.view;
    if(cartRequest) cartRequest.hidden=!result.lines.length;
    const buy=result.lines.filter(l=>l.mode==="buy");
    const subs=buy.filter(l=>l.period!=="once");
    const once=buy.filter(l=>l.period==="once");
    const quotes=result.lines.filter(l=>l.mode==="quote");
    const pre=result.lines.filter(l=>l.mode==="preorder");
    cartLines.innerHTML=result.lines.length
      ? (result.plans>1?'<p class="cart-warn">Sepette birden fazla adisyon paketi var. Tek işletme için genellikle bir paket yeterlidir; şube sayınızı not alanında belirtin.</p>':"")
        + group("Abonelikler",subs.some(l=>l.period==="monthly")?"Her ay yenilenir, KDV hariç":"Dönem sonunda yenilenir, KDV hariç",subs)
        + group("Tek seferlik ürünler","KDV hariç",once)
        + group("Teklif ile fiyatlanacaklar","Toplama dahil değil, fiyatı size bildirilir",quotes)
        + group("Ön kayıt","Henüz satışta değil, ödeme alınmaz",pre)
      : '<div class="empty-state"><p>Sepetiniz boş.</p><a class="btn primary" href="/fiyatlar">Paketlere bak</a><a class="link" href="/magaza">Tüm ürünler</a></div>';
    const hasBuy=buy.length>0;
    cartTotals.innerHTML="<h2>Tutar özeti</h2>"+
      (hasBuy
        ? moneyLine("Ara toplam",tl(result.subtotal))+
          (result.discount?moneyLine("Kupon indirimi","−"+tl(result.discount)):"")+
          (result.tax===null?"":moneyLine("KDV",tl(result.tax)))+
          moneyLine("İlk dönem toplamı",result.total===null?tl(result.net)+" + KDV":tl(result.total),"grand")+
          (result.monthly?moneyLine("Aylık yenileme",tl(result.monthly)+" + KDV","renew"):"")+
          (result.yearly?moneyLine("Yıllık yenileme",tl(result.yearly)+" + KDV","renew"):"")
        : (result.lines.length?'<p><span>Fiyatı belli ürün yok</span><strong>—</strong></p>':""))+
      (result.quoteCount?moneyLine("Teklif bekleyen",result.quoteCount+" ürün"):"")+
      (result.preorderCount?moneyLine("Ön kayıt",result.preorderCount+" ürün"):"")+
      (result.lines.length?`${hasBuy?`<form class="coupon-form"><label for="coupon-code">Kupon kodu</label><div><input id="coupon-code" name="coupon" maxlength="24" value="${h(cart.coupon)}" autocomplete="off"><button type="submit" class="btn secondary">Uygula</button></div><p class="form-message" role="status">${h(feedback)}</p></form>`:""}
      ${view==="cart"?'<a class="btn primary" href="/odeme">Talebe Devam Et</a>':""}
      <span class="note">Bu sürümde ödeme alınmaz. Talebiniz incelendikten sonra kapsam ve tutar sizinle teyit edilir.</span>`:"");
  }
  async function refresh(feedback=""){
    if(!cartView)return;
    const version=++quoteVersion;
    if(cartRequest)cartRequest.hidden=true;
    try {
      const result=await api("/api/quote",cart);
      if(version===quoteVersion)applyQuote(result,feedback);
    } catch(error) {
      if(version!==quoteVersion)return;
      if(cart.coupon){
        cart.coupon="";
        save();
        await refresh(error.message+" Kupon kaldırıldı.");
        return;
      }
      cartLines.innerHTML=cart.items.map(i=>renderLine(i,false)).join("");
      cartTotals.innerHTML='<h2>Tutar özeti</h2><p class="form-message error" role="status">'+h(error.message)+'</p>';
    }
  }
  cartLines?.addEventListener("click",async e=>{
    const remove=e.target.closest("[data-remove]");
    if(remove){
      cart.items=cart.items.filter(i=>i.id!==remove.dataset.remove);
      if(!cart.items.length)cart.coupon="";
      save();
      await refresh();
      ($("[data-remove]",cartLines) || $(".cart-link")).focus();
      return;
    }
    const button=e.target.closest("[data-delta]");
    if(!button)return;
    const item=cart.items.find(i=>i.id===button.dataset.id);
    if(!item || item.quantity+Number(button.dataset.delta)<1)return;
    const previous=item.quantity;
    item.quantity+=Number(button.dataset.delta);
    button.disabled=true;
    try{
      await api("/api/quote",cart);
      save();
      await refresh();
      list("[data-delta]",cartLines).find(b=>b.dataset.id===button.dataset.id && b.dataset.delta===button.dataset.delta && !b.disabled)?.focus();
    }catch(error){item.quantity=previous;notify(error.message);button.disabled=false}
  });
  cartTotals?.addEventListener("submit",async e=>{
    if(!e.target.matches(".coupon-form"))return;
    e.preventDefault();
    const form=e.target;
    const button=$("button",form);
    const code=new FormData(form).get("coupon").trim().toUpperCase();
    button.disabled=true;
    try{
      await api("/api/quote",{...cart,coupon:code});
      cart.coupon=code;
      save();
      await refresh(code?"Kupon uygulandı.":"Kupon kaldırıldı.");
      $(".coupon-form input",cartTotals)?.focus();
    }catch(error){msg($(".form-message",form),error.message,true)}
    finally{button.disabled=false}
  });
  window.addEventListener("storage",e=>{if(e.key===cartKey){cart=load();updateHeader();void refresh()}});
  void refresh();

  const request=$("#request-form");
  if(request){
    let id;
    request.addEventListener("submit",async e=>{
      e.preventDefault();
      const button=$("button[type=submit]",request);
      button.disabled=true;
      msg($(".form-message",request),"Gönderiliyor…");
      try{
        id ||= [...crypto.getRandomValues(new Uint8Array(18))].map(b=>b.toString(16).padStart(2,"0")).join("");
        const input=Object.fromEntries(new FormData(request));
        const {reference}=await api("/api/request",{...(request.dataset.kind==="cart"?cart:{}),...input,key:id,kind:request.dataset.kind,product:request.dataset.product});
        write(refKey,reference);
        if(request.dataset.kind==="cart"){cart={items:[],coupon:""};save()}
        location.assign("/siparis/sonuc?ref="+encodeURIComponent(reference));
      }catch(error){msg($(".form-message",request),error.message,true);button.disabled=false}
    });
  }
  const reference=$("#request-reference");
  if(reference){
    const result=new URLSearchParams(location.search).get("ref");
    const value=result||read(refKey);
    reference.textContent=/^TFZ-[0-9A-F-]{12}$/.test(value||"")?value:"Bu tarayıcıda kayıtlı talep referansı yok.";
  }

  // Bas-Konuş örnek akışı: komut → önizleme → onay. Gerçek ses tanıma yapılmaz.
  const voice=$("#voice-action");
  if(voice){
    const fix=$("#voice-fix"), preview=$("#voice-preview"), status=$("#voice-status"), label=$("span",voice);
    let step=0;
    const render=()=>{
      preview.hidden=step===0;
      fix.hidden=step!==1;
      status.textContent=["","Sistem komutu böyle anladı. Doğruysa onaylayın, değilse düzeltin.","Onaylandı. Sipariş Masa 3 adisyonuna ve ilgili mutfak ekranına iletilir."][step];
      label.textContent=["Komutu dene","Onayla","Başa dön"][step];
    };
    voice.addEventListener("click",()=>{step=(step+1)%3;render()});
    fix.addEventListener("click",()=>{status.textContent="Garson yanlış kalemi ekranda düzeltir; onaylanmayan komut adisyona yazılmaz.";});
  }

  // Kazanç hesaplayıcı (formüller sayfadaki "Nasıl hesaplanıyor?" bölümüyle aynıdır)
  const roi=$("#roi-form");
  if(roi){
    const out=name=>$(`[data-out="${name}"]`);
    const money=v=>new Intl.NumberFormat("tr-TR",{maximumFractionDigits:0}).format(Math.round(v))+" TL";
    const val=name=>{const n=Number(roi.elements[name].value);return Number.isFinite(n)&&n>=0?n:0};
    const plan=roi.elements.plan, software=roi.elements.software;
    plan.addEventListener("change",()=>{ if(plan.value!=="custom") software.value=plan.value; calc(); });
    software.addEventListener("input",()=>{ if(plan.value!==software.value) plan.value=[...plan.options].some(o=>o.value===software.value)?software.value:"custom"; });
    function calc(){
      const orders=val("orders"), days=val("days");
      const deltaSec=Math.max(0,val("secBefore")-val("secAfter"));
      const hours=deltaSec*orders*days*12/3600;
      const hourly=val("staffHours")>0?val("staffCost")/val("staffHours"):0;
      const capacity=hours*hourly;
      const errors=Math.max(0,val("errBefore")-val("errAfter"))*val("errCost")*12;
      const cash=val("cashSaving")*12;
      const oneTime=val("hardware")+val("setup");
      const yearlyCost=val("software")*12+val("fees")*12+oneTime;
      const net=errors+cash-yearlyCost;
      const monthlyNet=(errors+cash)/12-val("software")-val("fees");
      out("hours").textContent=number.format(Math.round(hours))+" saat";
      out("capacity").textContent=money(capacity);
      out("errors").textContent=money(errors);
      out("cash").textContent=money(cash);
      out("cost").textContent=money(yearlyCost);
      out("net").textContent=(net<0?"−":"")+money(Math.abs(net));
      out("payback").textContent=monthlyNet<=0?"Hesaplanamaz":oneTime===0?"Başlangıç yatırımı yok":number.format(Math.ceil(oneTime/monthlyNet*10)/10)+" ay";
      out("explain").textContent=monthlyNet<=0
        ? "Girdiğiniz rakamlarla ölçülebilen aylık katkı yazılım ve gider maliyetini karşılamıyor. Kazanılan süre yine de daha hızlı servis veya yoğun saatte kapasite olarak değer taşıyabilir; bu değer nakit sayılmadı."
        : "Bu sonuç sizin girdiğiniz rakamlara dayanan varsayımsal bir senaryodur. Gerçek etki, kurulumdan sonra kendi işletmenizde ölçülmelidir.";
    }
    roi.addEventListener("input",calc);
    calc();
  }
})();
