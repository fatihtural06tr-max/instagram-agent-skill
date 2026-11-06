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
  const search = $(".search-pop");
  search?.addEventListener("toggle",()=>{
    if (search.open) $("input",search).focus();
  });
  search?.addEventListener("keydown",e=>{
    if (e.key==="Escape" && search.open) {
      search.open=false;
      $("summary",search).focus();
    }
  });

  const campaign = $("[data-campaign]");
  if (campaign) {
    const tabs = list("[data-slide]",campaign);
    const panels = tabs.map(tab=>document.getElementById(tab.getAttribute("aria-controls")));
    let selected = 0;
    function showSlide(index) {
      selected = (index + tabs.length) % tabs.length;
      tabs.forEach((tab,i)=>{
        tab.setAttribute("aria-pressed",String(i===selected));
        panels[i].hidden = i!==selected;
      });
    }
    tabs.forEach((tab,i)=>tab.addEventListener("click",()=>showSlide(i)));
    for (const button of list("[data-slide-step]",campaign)) {
      button.addEventListener("click",()=>showSlide(selected + Number(button.dataset.slideStep)));
    }
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
    function updateRail() {
      previous.disabled = rail.scrollLeft < 2;
      next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2;
    }
    for (const button of [previous,next]) {
      button.addEventListener("click",()=>{
        const card = rail.firstElementChild;
        const gap = parseFloat(getComputedStyle(rail).columnGap)||0;
        rail.scrollBy({
          left:(card.offsetWidth + gap) * Number(button.dataset.railStep),
          behavior:motion.matches ? "auto" : "smooth",
        });
      });
    }
    rail.addEventListener("scroll",updateRail,{passive:true});
    window.addEventListener("resize",updateRail,{passive:true});
    updateRail();
  }

  if ("IntersectionObserver" in window && !motion.matches) {
    const reveal = new IntersectionObserver(entries=>{
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        reveal.unobserve(entry.target);
      }
    },{threshold:.08});
    document.body.classList.add("can-reveal");
    for (const item of list("[data-reveal]")) reveal.observe(item);
  }

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
  function updateHeader(){
    const count=cart.items.reduce((a,i)=>a+i.quantity,0);
    $("#cart-count").textContent=count;
    $(".cart-link").setAttribute("aria-label",`Sepet, ${count} ürün`);
    for(const button of list(".add")){
      const inCart=cart.items.some(i=>i.id===button.dataset.product);
      button.classList.toggle("in-cart",inCart);
      $("span",button).textContent=inCart?"Sepette":"Sepete Ekle";
      button.setAttribute("aria-label",inCart?button.dataset.name+" sepette, sepeti aç":button.dataset.name+" ürününü sepete ekle");
    }
  }
  function save(){
    write(cartKey,cart);
    updateHeader();
  }
  function notify(text){
    clearTimeout(timer);
    toast.hidden=false;
    $("#toast-message").textContent=text;
    timer=setTimeout(()=>toast.hidden=true,7000);
  }
  $(".toast-close")?.addEventListener("click",()=>toast.hidden=true);
  for(const button of list(".add")) button.addEventListener("click",()=>{
    if(cart.items.some(i=>i.id===button.dataset.product)){location.assign("/sepet");return}
    if(cart.items.length>=30){notify("Sepet sınırına ulaştınız.");return}
    cart.items.push({id:button.dataset.product,quantity:1,name:button.dataset.name,period:button.dataset.period});
    save();
    notify(button.dataset.name+" sepete eklendi.");
  });
  updateHeader();

  const cartView=$(".checkout-grid");
  const cartLines=$("#cart-lines");
  const cartTotals=$("#cart-totals");
  const cartRequest=$("#cart-request");
  let quoteVersion=0;
  const moneyLine=(label,value)=>`<p><span>${h(label)}</span><strong>${h(value)}</strong></p>`;
  const renderLine=(item,quoted=true)=>`<article class="cart-line"><div>
    <h3>${quoted?`<a href="${h(item.url)}">${h(item.name)}</a>`:h(item.name||"Ürün")}</h3>
    <p>${item.period==="monthly"?"Aylık abonelik":item.period==="yearly"?"Yıllık abonelik":"Tek seferlik"}</p>
    ${quoted && item.period==="once"?`<div class="qty-group"><button type="button" class="qty" aria-label="${h(item.name)} adedini azalt" data-id="${h(item.id)}" data-delta="-1">−</button><span>${item.quantity}</span><button type="button" class="qty" aria-label="${h(item.name)} adedini artır" data-id="${h(item.id)}" data-delta="1">+</button></div>`:""}</div>
    <div>${quoted?`<b>${tl(item.amount)}</b>`:""}<button type="button" class="text-button" data-remove="${h(item.id)}">Kaldır</button></div></article>`;
  function applyQuote(result,feedback=""){
    const view=cartView.dataset.view;
    if(cartRequest) cartRequest.hidden=!result.lines.length;
    cartLines.innerHTML=result.lines.length?result.lines.map(i=>renderLine(i)).join(""):'<p class="empty">Sepetiniz boş. <a class="link" href="/yazilim">Yazılım ürünlerine bakın.</a></p>';
    cartTotals.innerHTML="<h2>Tutar özeti</h2>"+moneyLine("Ara toplam",tl(result.subtotal))+
      (result.discount?moneyLine("Kupon indirimi","−"+tl(result.discount)):"")+
      (result.tax===null?"":moneyLine("KDV",tl(result.tax)))+
      moneyLine("İlk dönem",result.total===null?tl(result.net)+" + KDV":tl(result.total))+
      (result.monthly?moneyLine("Aylık yenileme",tl(result.monthly)+" + KDV"):"")+
      (result.yearly?moneyLine("Yıllık yenileme",tl(result.yearly)+" + KDV"):"")+
      (result.lines.length?`<form class="coupon-form"><label>Kupon kodu</label><div><input name="coupon" aria-label="Kupon kodu" maxlength="24" value="${h(cart.coupon)}"><button type="submit" class="btn secondary">Uygula</button></div><p class="form-message" role="status">${h(feedback)}</p></form>
      ${view==="cart"?'<a class="btn primary" href="/odeme">Talebe Devam Et</a>':""}`:"");
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
      list("[data-delta]",cartLines).find(b=>b.dataset.id===button.dataset.id && b.dataset.delta===button.dataset.delta)?.focus();
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
      try{
        id ||= [...crypto.getRandomValues(new Uint8Array(18))].map(b=>b.toString(16).padStart(2,"0")).join("");
        const input=Object.fromEntries(new FormData(request));
        const {reference}=await api("/api/request",{...cart,...input,key:id,kind:request.dataset.kind,product:request.dataset.product});
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
  const voice=$("#voice-action");
  if(voice){
    let step=0;
    voice.addEventListener("click",()=>{
      step=(step+1)%3;
      $("#voice-status").textContent=["","Önizleme · Masa 3 · 2 ayran · 5 lahmacun","Örnek sipariş onaylandı. Adisyona ve ilgili mutfak ekranına iletilir."][step];
      voice.textContent=["Siparişi önizle","Örnek siparişi onayla","Başa dön"][step];
    });
  }
})();
