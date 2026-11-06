import {categories,storefrontSettings} from "./seed.mjs";
import {topics} from "./topics.mjs";
import {addable,priceText,productPath,publiclyVisible,periodText} from "./model.mjs";

export const h = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const icons = {
  arrow:"M4 12h15m-6-6 6 6-6 6", bag:"M5 8h14l2 13H3L5 8Zm3 1V6a4 4 0 0 1 8 0v3",
  menu:"M4 7h16M4 12h16M4 17h16", table:"M3 5h18v14H3zM3 10h18M9 10v9",
  monitor:"M3 4h18v13H3zM8 21h8m-4-4v4m-5-9h10", card:"M3 5h18v14H3zM3 10h18M7 15h4",
  chip:"M7 7h10v10H7zM9 2v5m6-5v5M9 17v5m6-5v5M2 9h5m-5 6h5m10-6h5m-5 6h5",
  clock:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5v5l3 2",
  check:"m5 12 4 4L19 6", plus:"M12 5v14M5 12h14", mic:"M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0zM5 10v2a7 7 0 0 0 14 0v-2m-7 9v3",
  search:"M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 4 4",
};
const icon = name => `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="${icons[name]}"/></svg>`;
const link = (href,label,kind="link") => `<a class="${kind}" href="${h(href)}">${h(label)}${icon("arrow")}</a>`;
const intro = (tag,title,desc="") => `<header class="section-title">${tag?`<p class="eyebrow">${h(tag)}</p>`:""}<h1>${h(title)}</h1>${desc?`<p class="section-intro">${h(desc)}</p>`:""}</header>`;
const visual = (name,alt,cls="") => `<img class="${cls}" src="/assets/${name}.svg" width="760" height="510" alt="${h(alt)}">`;
const legacyProductArt = {
  "yazarkasa-pos":["terminal","odeme-terminali"],
  "kasa-cekmece":["printer","nakit-cekmecesi"],
  "garson-terminali":["qr","el-cihazi"],
  "musteri-ekrani":["terminal","kasa-musteri-ekrani"],
};
function productVisual(p,cls="") {
  const art = Object.hasOwn(legacyProductArt,p.id) ? legacyProductArt[p.id] : null;
  const image = art && p.image === `/assets/${art[0]}.svg` ? `/assets/${art[1]}.svg` : p.image;
  return image
    ? `<img class="${cls}" src="${h(image)}" width="760" height="510" alt="${h(p.alt)}" loading="lazy">`
    : `<div class="no-image ${cls}" aria-label="Ürün görseli henüz eklenmedi">${icon(p.category === "donanim" ? "chip":"monitor")}</div>`;
}
const price = p => p.price === null ? (p.status==="soon"?"Yakında":"Teklif ile")
  : `${priceText(p.price)} <small>${p.period==="monthly"?"/ ay ":p.period==="yearly"?"/ yıl ":""}+ KDV</small>`;
const action = (p,kind="btn primary") => addable(p) ?
  `<button class="${kind} add" data-product="${h(p.id)}" data-name="${h(p.name)}" data-period="${h(p.period)}" type="button">${icon("bag")}<span>Sepete Ekle</span></button>`
  : p.status==="soon" ? '<span class="tag">Yakında</span>'
  : link("/iletisim?urun="+encodeURIComponent(p.id),p.stock===0?"Stok Sor":"Teklif Al",kind==="btn primary"?"btn secondary":kind);
const crumb = (name,url="/") => `<a class="breadcrumb" href="${h(url)}">‹ ${h(name)}</a>`;
const statusNames = {active:"Yayında",quote:"Teklif",soon:"Yakında",draft:"Taslak"};

function base(title,content,{description="",page="store",admin=false,path="/"}={}) {
  const brandName="TUFAZ Teknoloji";
  const active = url => path===url || path.startsWith(url+"/") || url==="/fiyatlar"&&path.startsWith("/paketler");
  const navigation=[["/magaza","Mağaza"],["/yazilim","Yazılım"],["/donanim","Donanım"],["/nfc","NFC"],["/fiyatlar","Paketler"],["/cozumler","Çözümler"]]
    .map(([url,name])=>`<a href="${url}"${active(url)?' aria-current="page"':""}>${name}</a>`).join("");
  const logo = '<img src="/assets/tufaz-logo.png" width="106" height="106" alt="TUFAZ Teknoloji">';
  const search = (id) => `<form class="site-search" action="/magaza" method="get" role="search">
    <label class="sr-only" for="${id}">Mağazada ara</label><input type="search" name="q" id="${id}" placeholder="Ürün, yazılım veya cihaz ara" maxlength="100">
    <button type="submit" aria-label="Ara">${icon("search")}</button></form>`;
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${h(page==="home"?brandName+" | Restoran ve kafe teknolojileri":title+" | "+brandName)}</title>
    <meta name="description" content="${h(description||"Restoran ve kafeler için adisyon yazılımı, kasa ekipmanı ve NFC ürünleri.")}">
    <meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#0a1830">
    <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/store.css">
    <script defer src="/assets/store.js"></script>${admin?'<script defer src="/assets/admin.js"></script>':""}
    </head><body class="page-${h(page)}"><a class="skip" href="#main">İçeriğe geç</a>
    <header class="top"><div class="wrap top-inner">
      <a class="brand" href="/" aria-label="TUFAZ Teknoloji ana sayfa"><span class="logo">${logo}</span></a>
      <div class="desktop-search">${search("desk-search")}</div>
      <div class="top-actions">
        <details class="search-pop"><summary aria-label="Ürün ara">${icon("search")}</summary><div>${search("mobile-search")}</div></details>
        <a class="support-link" href="/destek">Yardım</a>
        <a class="cart-link" href="/sepet" aria-label="Sepet">${icon("bag")} <span class="cart-label">Sepet</span> <span id="cart-count">0</span></a>
      </div>
    </div><div class="shop-nav"><nav class="wrap" id="nav" aria-label="Ana menü">${navigation}</nav></div></header>
    <main id="main">${content}</main>
    <footer class="footer"><div class="wrap footer-inner"><div class="footer-brand"><strong>TUFAZ Teknoloji</strong><p>Restoran ve kafe teknolojileri</p></div>
      <nav aria-label="Alt menü"><a href="/magaza">Mağaza</a><a href="/kurulum">Kurulum</a><a href="/iletisim">İletişim</a><a href="/kurumsal">Kurumsal</a></nav></div>
      <div class="wrap foot-end"><nav aria-label="Mağaza koşulları"><a href="/gizlilik">Gizlilik</a><a href="/cerez">Çerezler</a><a href="/satis-kosullari">Satış koşulları</a><a href="/iade">İade</a></nav><a href="/admin">Yönetim</a></div>
    </footer>
    <div class="toast" hidden id="toast"><div>${icon("check")}<span id="toast-message" role="status"></span></div><a href="/sepet">Sepeti Gör</a><button type="button" class="toast-close" aria-label="Bildirimi kapat">×</button></div>
    </body></html>`;
}
function plansOf(state) {
  return state.products.filter(p=>p.category==="yazilim" && p.period!=="once" && publiclyVisible(p));
}
const shopFamilies = [
  {path:"/yazilim",name:"Yazılım",desc:"Adisyon, mutfak ekranı ve QR menü",art:"kitchen.svg",tone:"blue"},
  {path:"/donanim",name:"Donanım",desc:"Kasa, fiş yazıcı ve el terminali",art:"market-devices.webp",tone:"ice"},
  {path:"/nfc",name:"DOKUN NFC",desc:"Menü, yorum ve bağlantı kartları",art:"market-nfc.webp",tone:"lime"},
];
const slides = [
  {key:"adisyon",name:"Adisyon",tone:"midnight",image:"market-hero.webp",caption:"Temsili kasa ekipmanı"},
  {key:"donanim",name:"Donanım",tone:"ice",image:"market-devices.webp",caption:"Temsili fiş yazıcı ve barkod okuyucu"},
  {key:"nfc",name:"NFC",tone:"lime",image:"market-nfc.webp",caption:"Temsili NFC kartları"},
];

function productCard(p, heading="h3") {
  const state = p.status==="soon"?"Yakında":p.stock===0?"Stokta yok":!addable(p)?"Teklif ile":"";
  return `<article class="market-product" data-reveal>
    <a class="product-art" href="${productPath(p)}" aria-label="${h(p.name)} ürününü incele">
      ${productVisual(p)}${state?`<span class="product-badge">${state}</span>`:""}
      <span class="product-arrow">${icon("arrow")}</span>
    </a>
    <div class="product-body"><p class="product-kind">${h(categories[p.category])}</p>
      <${heading}><a href="${productPath(p)}">${h(p.name)}</a></${heading}><p class="product-brief">${h(p.brief)}</p>
      <div class="product-buy">${p.price!==null?`<div class="price">${price(p)}</div>`:""}${p.status==="soon"?link(productPath(p),"İncele","btn secondary"):action(p)}</div>
    </div>
  </article>`;
}

function home(state) {
  const plans=plansOf(state);
  const main=plans.find(p=>p.featured&&addable(p))||plans.find(addable);
  const {heroTitle:title,heroText:lead,notice}=storefrontSettings(state.settings);
  const firstBuy=main?`<div class="hero-buy"><div><span>${h(main.name)}</span><p class="price">${price(main)}</p></div>${action(main,"btn signal")}</div>`:"";
  const copy=[
    [title,lead,firstBuy,link("/fiyatlar","Paketleri karşılaştır","hero-link")],
    ["Kasa ve mutfak ekipmanı","Fiş yazıcıdan garson el terminaline, işletmenize uygun cihazları bulun.",link("/donanim","Donanımı keşfet","btn primary"),link("/iletisim","Cihaz uyumunu sor","hero-link")],
    ["Menünüz bir dokunuş uzağınızda","DOKUN kartına telefonu yaklaştırın, menünüz veya yorum sayfanız açılsın.",link("/nfc","NFC ürünlerini gör","btn primary"),""],
  ];
  const items=state.products.filter(publiclyVisible);
  const featured=[main,...["termal-fis-yazici","google-yorum-karti","qr-menu","restoran","pos-terminali"]
    .map(id=>items.find(p=>p.id===id))].filter((p,i,a)=>p&&a.indexOf(p)===i);
  return `${notice?`<div class="announcement">${h(notice)}</div>`:""}
  <section class="campaign" data-campaign aria-label="Mağaza vitrini">
    ${slides.map((s,i)=>`<div class="campaign-panel tone-${s.tone}" id="slide-${s.key}"${i?" hidden":""}>
      <picture class="campaign-picture">${i===0?'<source media="(max-width: 700px)" srcset="/assets/market-hero-mobile.webp">':""}<img src="/assets/${s.image}" width="1280" height="853" alt=""${i===0?' fetchpriority="high"':' loading="lazy"'}></picture>
      <div class="wrap campaign-inner"><div class="campaign-copy">
        <p class="campaign-index"><span></span> ${["Mağaza","Kasa ve mutfak","DOKUN NFC"][i]}</p>
        ${i===0?`<h1>${h(copy[i][0])}</h1>`:`<h2>${h(copy[i][0])}</h2>`}<p class="campaign-lead">${h(copy[i][1])}</p>
        <div class="campaign-actions">${copy[i][2]}${copy[i][3]}</div>
      </div><p class="art-caption">${s.caption}</p></div>
    </div>`).join("")}
    <div class="campaign-controls wrap"><div class="campaign-tabs" role="group" aria-label="Vitrin seçimi">
      ${slides.map((s,i)=>`<button type="button" data-slide="${s.key}" aria-controls="slide-${s.key}" aria-pressed="${i===0}"><span>0${i+1}</span> ${s.name}</button>`).join("")}
    </div><div class="campaign-arrows"><button type="button" data-slide-step="-1" aria-label="Önceki vitrin">←</button><button type="button" data-slide-step="1" aria-label="Sonraki vitrin">→</button></div></div>
  </section>
  <section class="wrap market-section"><div class="market-heading" data-reveal><div><p class="eyebrow">Mağaza</p><h2>Kategorileri keşfet</h2></div>${link("/magaza","Tüm ürünler")}</div>
    <div class="family-grid">${shopFamilies.map((c,i)=>`<a class="family family-${c.tone}" href="${c.path}" data-reveal><div class="family-copy"><span>0${i+1}</span><h3>${c.name}</h3><p>${c.desc}</p></div><img src="/assets/${c.art}" width="760" height="510" alt="" loading="lazy"><span class="family-arrow">${icon("arrow")}</span></a>`).join("")}</div>
  </section>
  ${featured.length?`<section class="wrap market-section featured-section"><div class="market-heading" data-reveal><h2>Öne çıkan ürünler</h2><div class="rail-controls"><button type="button" data-rail-step="-1" aria-label="Önceki ürünler">←</button><button type="button" data-rail-step="1" aria-label="Sonraki ürünler">→</button></div></div>
    <div class="product-rail" data-product-rail tabindex="0" aria-label="Öne çıkan ürünler">${featured.map(p=>productCard(p)).join("")}</div>
  </section>`:""}
  <section class="wrap market-section"><div class="help-band" data-reveal><div><p class="eyebrow">Kurulum</p><h2>Elinizdeki cihazla başlayın.</h2><p>Kasa veya yazıcı modelini iletin. Yazılımla uyumunu kontrol edelim.</p></div>${link("/iletisim","Cihaz uyumu sor","btn signal")}</div></section>`;
}
const catalogData = {
  magaza:["Tüm ürünler","İşletmeniz için yazılım, ekipman ve dijital menü ürünleri."],
  yazilim:["Yazılım ürünleri","Adisyon paketlerini, QR menüyü ve ek modülleri inceleyin."],
  donanim:["Donanım ürünleri","Kasanız ve mutfağınız için cihaz seçenekleri."],
  nfc:["DOKUN NFC ürünleri","Telefonu yaklaştırınca menü ya da yorum bağlantısı açılır."],
  hizmet:["Kurulum ve hizmet","Menü, cihaz ve masa düzeninizi hazırlayın."],
};
function catalog(category,url,state) {
  const [title,desc] = catalogData[category];
  const q = (url.searchParams.get("q")||"").trim().slice(0,100);
  const sort = url.searchParams.get("sirala") || "default";
  const filter = url.searchParams.get("durum") || "";
  const sub = (url.searchParams.get("grup") || "").slice(0,50);
  const all = state.products.filter(p=>(category==="magaza"||p.category===category) && publiclyVisible(p));
  const groups = category==="magaza"?[]:[...new Set(all.map(p=>p.subcategory).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"tr"));
  const normalized = q.toLocaleLowerCase("tr");
  const products = all.filter(p=>(!filter||p.status===filter) && (!sub||p.subcategory===sub) && (!q || (p.name+" "+p.brief+" "+p.sku+" "+(p.subcategory||"")+" "+categories[p.category]).toLocaleLowerCase("tr").includes(normalized)));
  if(sort==="price") products.sort((a,b)=>(a.price??Infinity)-(b.price??Infinity));
  else products.sort((a,b)=>Number(b.featured)-Number(a.featured));
  function groupPath(group) {
    const params = new URLSearchParams();
    if(q) params.set("q",q);
    if(filter) params.set("durum",filter);
    if(sort==="price") params.set("sirala",sort);
    if(group) params.set("grup",group);
    return "/"+category+(params.size?"?"+params:"");
  }
  return `<section class="wrap section catalog">${crumb("Ana sayfa")}
    ${intro("",title,desc)}
    <form class="catalog-search" method="get">
      ${sub?`<input type="hidden" name="grup" value="${h(sub)}">`:""}
      <div class="catalog-search-row"><label for="catalog-query">Ürün ara</label><div><input id="catalog-query" type="search" name="q" value="${h(q)}" maxlength="100" placeholder="Ürün adı veya kodu">
      <button class="btn primary" type="submit">${icon("search")} Ara</button></div></div>
      <details class="catalog-filters"${filter||sort==="price"?" open":""}><summary>Filtreler</summary><div>
        <label>Satış durumu<select name="durum"><option value="">Tümü</option><option value="active"${filter==="active"?" selected":""}>Sepete açık</option><option value="quote"${filter==="quote"?" selected":""}>Teklif ile</option><option value="soon"${filter==="soon"?" selected":""}>Yakında</option></select></label>
        <label>Sırala<select name="sirala"><option value="default">Varsayılan</option><option value="price"${sort==="price"?" selected":""}>Düşük fiyat</option></select></label>
        <button class="btn secondary" type="submit">Filtreleri Uygula</button>
      </div></details>
    </form>
    <div class="catalog-toolbar">
      ${groups.length?`<nav class="category-switch" aria-label="Ürün grupları">${["",...groups].map(group=>`<a href="${h(groupPath(group))}"${sub===group?' aria-current="page"':""}>${h(group||"Tüm ürünler")}</a>`).join("")}</nav>`:""}
      <p class="fine results-count">${products.length} ürün${q||filter||sub||sort==="price"?` · <a href="/${category}">Temizle</a>`:""}</p>
    </div>
    ${products.length?`<div class="product-grid">${products.map(p=>productCard(p,"h2")).join("")}</div>`:"<p class='empty'>Aramanıza uygun ürün yok.</p>"}
  </section>`;
}
function detail(p) {
  const purchase = p.price !== null ? `<p class="price">${price(p)}</p>` : "";
  const priceNote = p.price === null && p.status === "quote" ? "Fiyat, model ve kurulum kapsamına göre belirlenir." : "";
  const stockNote = p.stock === 0 ? "Stokta yok." : p.stock !== null ? p.stock+" adet stokta." : "";
  return `<section class="wrap section">${crumb(categories[p.category],"/"+p.category)}<div class="detail product-detail">
    <div class="detail-head">${intro(categories[p.category],p.name,p.brief)}</div>
    <figure>${productVisual(p)}${p.image?.startsWith("/assets/")?"<figcaption>Örnek ürün görseli</figcaption>":""}</figure>
    <div class="detail-copy">
      <div class="detail-buy">${purchase}${action(p)}</div>
      ${stockNote||priceNote?`<p class="fine">${[stockNote,priceNote].filter(Boolean).join(" ")}</p>`:""}
      <p class="description">${h(p.description)}</p>
      ${p.compatibility?`<dl><dt>Uyumluluk</dt><dd>${h(p.compatibility)}</dd></dl>`:""}
      ${p.warranty?`<dl><dt>Garanti ve teslim</dt><dd>${h(p.warranty)}</dd></dl>`:""}
      <p class="sku">Ürün kodu ${h(p.sku)}</p>
      ${p.id==="bas-konus"?link("/sesli-siparis","Örnek sipariş akışını dene"):""}
    </div></div></section>`;
}
function topicContent(path,t) {
  const [name,desc,image,steps,target] = t;
  const voice = path==="/sesli-siparis" ? `<div class="voice-demo" id="voice-demo"><p><b>Masa 3</b> · 2 ayran, 5 lahmacun</p><button class="btn primary" id="voice-action" type="button">${icon("mic")} Siparişi önizle</button><p id="voice-status" role="status"></p></div>`:"";
  return `<section class="wrap section">${crumb("Ana sayfa")}<div class="detail topic"><div>${intro("Kullanım rehberi",name,desc)}
    <ol class="steps" id="kullanim">${steps.map((s,i)=>`<li><span>${i+1}</span>${h(s)}</li>`).join("")}</ol>${voice}${link(target,"İlgili sayfaya git","btn secondary")}</div>
    <figure>${visual(image,name+" örnek görseli")}<figcaption>Örnek görsel</figcaption></figure></div></section>`;
}
function directory(title,subtitle,paths) {
  return `<section class="wrap section narrow">${crumb("Ana sayfa")}${intro("TUFAZ Teknoloji",title,subtitle)}<div class="directory">${paths.map(([path,label,desc])=>`<a href="${path}"><span><b>${h(label)}</b>${desc?`<small>${h(desc)}</small>`:""}</span>${icon("arrow")}</a>`).join("")}</div></section>`;
}
const policy = {
  "/gizlilik":["Gizlilik","Talep formunda işletme adı, e-posta ve yazdığınız not yönetim panelinde kaydedilir. Talep formunda kart, kimlik veya vergi numarası istenmez."],
  "/cerez":["Çerezler","Sepet bu tarayıcıda saklanır. Yerel yönetim girişinde oturum çerezi kullanılır."],
  "/satis-kosullari":["Satış koşulları","Bu sürümde sepet ve talep akışı kullanılabilir. Talep göndermek ücretli sipariş veya abonelik başlatmaz. Canlı satış açıldığında fiyat ve satış metinleri ödeme öncesinde gösterilir."],
  "/iade":["İade","Bu sürümde tahsilat yapılmaz. Daha önceki bir alışverişle ilgili sorunuz varsa iletişim formundan iletebilirsiniz."],
};
function formMarkup(kind,product="") {
  return `<form class="form form-request" id="request-form" method="post" data-kind="${kind}" data-product="${h(product)}">
    <label>İşletme adı<input name="business" required maxlength="100" autocomplete="organization"></label>
    <label>E-posta<input name="email" type="email" required maxlength="160" autocomplete="email"></label>
    <label>Not <small>(isteğe bağlı)</small><textarea name="message" maxlength="700" rows="4" placeholder="Örneğin cihazınızın marka ve modeli"></textarea></label>
    <label hidden>Web sitesi<input name="website" tabindex="-1" autocomplete="off"></label>
    <p class="fine">Formdaki bilgiler talebinizi incelemek için kaydedilir. <a href="/gizlilik">Gizlilik bilgileri</a></p>
    <button type="submit" class="btn primary">Talebi Gönder ${icon("arrow")}</button><p class="form-message" role="status"></p>
  </form>`;
}
function shopRequest(kind) {
  const checkout = kind === "checkout";
  return `<section class="wrap section">${crumb(checkout?"Sepet":"Yazılım ürünleri",checkout?"/sepet":"/yazilim")}
    ${intro("Mağaza",checkout?"Talep ve tutar özeti":"Sepetiniz",checkout?"Toplamı kontrol edip işletme bilgilerinizi gönderin. Bu aşamada ödeme alınmaz.":"Ürünleri, adetleri ve ilk dönem tutarını kontrol edin.")}
    <div class="checkout-grid" data-view="${kind}"><div><div id="cart-lines" class="cart-lines" aria-live="polite"></div>
    ${checkout?`<div id="cart-request" hidden><h2>İşletme bilgileri</h2><p class="fine">Talep yönetim paneline gider. Abonelik başlatılmaz.</p>${formMarkup("cart")}</div>`:""}</div>
    <aside class="totals" id="cart-totals"></aside></div>
  </section>`;
}
const adminTabs = {"/admin":"Genel bakış","/admin/urunler":"Ürünler","/admin/kuponlar":"Kuponlar","/admin/talepler":"Talepler","/admin/ayarlar":"Mağaza ayarları","/admin/gecmis":"İşlem geçmişi"};
function adminPage(path,auth) {
  if (!auth.authorized) {
    if (!auth.local) {
      return `<section class="wrap section narrow">${intro("TUFAZ Teknoloji","Yönetim paneli",auth.configured?"Yetkili ChatGPT hesabıyla giriş yapın.":"Yönetici erişimi yapılandırılıyor.")}${auth.configured?'<a class="btn primary" href="/signin-with-chatgpt?return_to=%2Fadmin" target="_top">ChatGPT ile giriş</a>':""}</section>`;
    }
    return `<section class="wrap section narrow">${intro("TUFAZ Teknoloji","Yönetim paneli",auth.configured?"Yönetici parolasıyla giriş yapın.":"Sunucuda yönetici parolası ayarlayın.")}${auth.configured?'<form class="form" id="admin-login" method="post"><label>Yönetici parolası<input name="password" type="password" autocomplete="current-password" required maxlength="240"></label><button type="submit" class="btn primary">Giriş Yap</button><p role="status" class="form-message"></p></form>':'<p class="fine">Yerel kurulum adımları ZIP içindeki KURULUM.md dosyasında.</p>'}</section>`;
  }
  const title=adminTabs[path];
  return `<div class="wrap admin-layout"><aside class="admin-sidebar"><p class="eyebrow">Mağaza yönetimi</p><nav aria-label="Yönetim">${Object.entries(adminTabs).map(([url,name])=>`<a href="${url}"${path===url?' aria-current="page"':""}>${name}</a>`).join("")}</nav><a href="/">Mağazayı aç</a>${auth.local?'<button type="button" class="text-button" id="admin-logout">Çıkış yap</button>':'<a target="_top" href="/signout-with-chatgpt?return_to=%2F">Çıkış yap</a>'}</aside>
    <section class="admin-main">${intro("Yönetim paneli",title)}<p class="form-message" id="admin-status" role="status"></p><div id="admin-view" data-path="${path}"><p>Yükleniyor…</p></div></section></div>`;
}

export function renderPage(path,url,state,auth) {
  let title = "TUFAZ Teknoloji", content, status=200, page="store", admin=false;
  const category = path.slice(1);
  const parts = path.split("/").slice(1);
  const item = parts.length===2 ? state.products.find(p=>publiclyVisible(p) && p.slug===parts[1] &&
    (p.category===parts[0] || parts[0]==="paketler" && p.category==="yazilim" && p.period!=="once")) : null;
  if (path==="/") {content=home(state);page="home";}
  else if (Object.hasOwn(catalogData,category)) {title=catalogData[category][0];content=catalog(category,url,state);}
  else if (item) {title=item.name;content=detail(item);}
  else if (["/fiyatlar","/paketler"].includes(path)) {
    title="Paketler ve fiyatlar";
    content=`<section class="wrap section pricing-page">${crumb("Ana sayfa")}${intro("",title,"İşletme tipinize göre paketi inceleyin. Aylık fiyatlar KDV hariçtir.")}<div class="product-grid">${plansOf(state).map(p=>productCard(p,"h2")).join("")||"<p class='empty'>Yayında paket bulunmuyor.</p>"}</div>
    <p class="fine">Kurulum kapsamı, şube ve cihaz sınırları pakete göre değişebilir.</p>${link("/kurulum","Kurulumu incele")}</section>`;
  }
  else if (Object.hasOwn(topics,path)) {title=topics[path][0];content=topicContent(path,topics[path]);}
  else if (path==="/cozumler") {
    title="İşletmenize göre çözümler";
    const paths=["/restoran-adisyon-programi","/kafe-adisyon-programi","/oyun-kafe-adisyon","/cozumler/premium-restoran","/sesli-siparis","/qr-siparis","/yemek-platformu-entegrasyonlari"];
    content=directory(title,"İşletmenize benzeyen örnekten başlayın.",paths.map(p=>[p,topics[p][0],topics[p][1]]));
  }
  else if (path==="/rehber") {title="Rehber";content=directory(title,"Kurulumdan önce en çok sorulanlar.",Object.keys(topics).filter(p=>p.startsWith("/rehber/")).map(p=>[p,topics[p][0],topics[p][1]]));}
  else if (path==="/destek") {title="Destek";content=directory(title,"Cihaz, kurulum ve ürün sorularınız için.",[["/kurulum","Kurulum adımları"],["/rehber","Rehber"],["/ankara","Ankara kurulum planı"],["/iletisim","Talep gönder"],["/hesap","Talep referansım"]]);}
  else if (path==="/iletisim") {
    title="İletişim ve teklif";
    const requested=state.products.find(p=>p.id===url.searchParams.get("urun") && publiclyVisible(p));
    const {phone,email}=state.settings;
    content=`<section class="wrap section narrow">${crumb("Ana sayfa")}${intro("TUFAZ Teknoloji",title,requested?requested.name+" hakkında talep gönderin.":"Ürün, cihaz veya kurulum hakkında talebinizi iletin.")}
    ${email?`<p><a href="mailto:${h(email)}">${h(email)}</a></p>`:""}${phone?`<p><a href="tel:${h(phone.replace(/[ ()-]/g,""))}">${h(phone)}</a></p>`:""}${formMarkup("contact",requested?.id)}</section>`;
  }
  else if (path==="/kurumsal") {title="TUFAZ Teknoloji";content=`<section class="wrap section narrow">${intro("Kurumsal",title,"TUFAZ Teknoloji, restoran ve kafeler için yazılım ve ekipman sunar.")}${link("/iletisim","İletişim","btn primary")}</section>`;}
  else if (path==="/sepet" || path==="/odeme") {title=path==="/sepet"?"Sepet":"Ödeme özeti";content=shopRequest(path==="/sepet"?"cart":"checkout");}
  else if (path==="/siparis/sonuc" || path==="/hesap") {title="Talep referansı";content=`<section class="wrap section narrow">${intro("Mağaza",title,"Talep gönderdiğinizde referans numaranız bu tarayıcıda gösterilir.")}<p class="reference" id="request-reference" role="status"></p>${link("/destek","Destek sayfası","btn secondary")}</section>`;}
  else if (Object.hasOwn(policy,path)) {title=policy[path][0];content=`<section class="wrap section narrow">${crumb("Ana sayfa")}${intro("Mağaza bilgileri",title,policy[path][1])}${link("/iletisim","İletişim")}</section>`;}
  else if (Object.hasOwn(adminTabs,path)) {title=adminTabs[path];content=adminPage(path,auth);page="admin";admin=true;}
  else {status=404;title="Sayfa bulunamadı";content=`<section class="wrap section narrow">${intro("404",title,"Adres değişmiş veya ürün yayından kaldırılmış olabilir.")}${link("/","Ana sayfaya dön","btn primary")}</section>`;}
  return {status,html:base(title,content,{page,admin,path,description:topics[path]?.[1] || item?.brief})};
}
