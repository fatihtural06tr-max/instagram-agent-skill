import {categories,storefrontSettings} from "./seed.mjs";
import {topics,solutionPaths,featurePaths,productGuide} from "./topics.mjs";
import {addable,cartMode,maxQuantity,priceText,productPath,productType,publiclyVisible,businessTypes} from "./model.mjs";

export const VERSION = "2.1.0";
export const h = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const icons = {
  arrow:"M4 12h15m-6-6 6 6-6 6", back:"M20 12H5m6-6-6 6 6 6", bag:"M5 8h14l2 13H3L5 8Zm3 1V6a4 4 0 0 1 8 0v3",
  menu:"M4 7h16M4 12h16M4 17h16", close:"M6 6l12 12M18 6 6 18", table:"M3 5h18v14H3zM3 10h18M9 10v9",
  monitor:"M3 4h18v13H3zM8 21h8m-4-4v4m-5-9h10", card:"M3 5h18v14H3zM3 10h18M7 15h4",
  chip:"M7 7h10v10H7zM9 2v5m6-5v5M9 17v5m6-5v5M2 9h5m-5 6h5m10-6h5m-5 6h5",
  clock:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5v5l3 2", calc:"M6 3h12v18H6zM9 7h6M9 11h1m2 0h1m2 0h0M9 15h1m2 0h1m2 0h0M9 18h1m2 0h1",
  check:"m5 12 4 4L19 6", plus:"M12 5v14M5 12h14", mic:"M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0zM5 10v2a7 7 0 0 0 14 0v-2m-7 9v3",
  search:"M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 4 4", help:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-2.5 6.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17h0",
  tag:"M3 12V4h8l10 10-8 8L3 12Zm5-4h0", nfc:"M6 8a8 8 0 0 1 0 8m4-11a12 12 0 0 1 0 14m4-17a16 16 0 0 1 0 20",
  tool:"M14 6a4 4 0 0 0-5 5l-6 6 3 3 6-6a4 4 0 0 0 5-5l-3 3-3-3 3-3Z",
};
const icon = name => `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="${icons[name]}"/></svg>`;
const link = (href,label,kind="link") => `<a class="${kind}" href="${h(href)}">${h(label)}${icon("arrow")}</a>`;
const asset = name => `/assets/${name}?v=${VERSION}`;
const visual = (name,alt,cls="") => `<img class="${cls}" src="/assets/${name}.svg" width="760" height="510" alt="${h(alt)}" loading="lazy">`;
const legacyProductArt = {
  "yazarkasa-pos":["terminal","odeme-terminali"],
  "kasa-cekmece":["printer","nakit-cekmecesi"],
  "garson-terminali":["qr","el-cihazi"],
  "musteri-ekrani":["terminal","kasa-musteri-ekrani"],
};
function productVisual(p,cls="",eager=false) {
  const art = Object.hasOwn(legacyProductArt,p.id) ? legacyProductArt[p.id] : null;
  const image = art && p.image === `/assets/${art[0]}.svg` ? `/assets/${art[1]}.svg` : p.image;
  return image
    ? `<img class="${cls}" src="${h(image)}" width="760" height="510" alt="${h(p.alt)}"${eager?' fetchpriority="high"':' loading="lazy"'}>`
    : `<div class="no-image ${cls}" role="img" aria-label="Ürün görseli henüz eklenmedi">${icon(p.category === "donanim" ? "chip":p.category==="nfc"?"nfc":"monitor")}</div>`;
}
const periodSuffix = p => p.period==="monthly"?"/ ay ":p.period==="yearly"?"/ yıl ":"";
const priceHtml = p => `${priceText(p.price)} <small>${periodSuffix(p)}+ KDV</small>`;
const modeHint = {quote:"Fiyat teklifle belirlenir", preorder:"Ön kayıt · ödeme alınmaz"};
function priceBlock(p) {
  const mode = cartMode(p);
  if (mode === "buy") return `<p class="price">${priceHtml(p)}</p>`;
  if (mode === "preorder") return `<p class="price price-soft">Yakında</p>`;
  return `<p class="price price-soft">${p.stock===0 && p.price!==null ? "Stok sorun" : "Teklif ile"}</p>`;
}
// Tüm yayındaki ürünlerde sepete ekleme düğmesi bulunur.
function addButton(p,kind="btn primary") {
  const mode = cartMode(p);
  if (!mode) return "";
  return `<button class="${kind} add" data-product="${h(p.id)}" data-name="${h(p.name)}" data-period="${h(p.period)}" data-mode="${mode}" type="button">${icon("bag")}<span>Sepete Ekle</span></button>`;
}
const statusBadge = p => p.status==="soon"?"Yakında":p.stock===0?"Stokta yok":!addable(p)?"Teklif ile":"";

function crumbs(items) {
  return `<nav class="crumbs" aria-label="Konum"><ol>${items.map(([name,url],i)=>i<items.length-1
    ? `<li><a href="${h(url)}">${h(name)}</a></li>` : `<li aria-current="page">${h(name)}</li>`).join("")}</ol></nav>`;
}
function breadcrumbLd(items,origin) {
  return {"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:items.map(([name,url],i)=>({
    "@type":"ListItem",position:i+1,name,...(url?{item:origin+url}:{})}))};
}
function pageHead({trail,eyebrow="",title,desc="",actions="",toneName="neutral",extra=""}) {
  return `<header class="page-head">${trail?crumbs(trail):""}
    <div class="page-head-body"><div>${eyebrow?`<p class="eyebrow">${h(eyebrow)}</p>`:""}<h1>${h(title)}</h1>${desc?`<p class="page-intro">${h(desc)}</p>`:""}</div>
    ${actions?`<div class="page-head-actions">${actions}</div>`:""}</div>${extra}</header>`;
}

const menuGroups = [
  ["Mağaza", [["/magaza","Tüm ürünler"],["/yazilim","Yazılım"],["/donanim","Donanım"],["/nfc","DOKUN NFC"],["/hizmet","Kurulum ve hizmet"]]],
  ["Paketler", [["/fiyatlar","Paketler ve fiyatlar"],["/kazanc-hesaplayici","Kazanç hesaplayıcı"]]],
  ["İşletmenize göre", [["/restoran-adisyon-programi","Restoran"],["/kafe-adisyon-programi","Kafe"],["/oyun-kafe-adisyon","Oyun kafe"],["/cozumler/premium-restoran","Premium restoran"],["/cozumler","Tüm çözümler"]]],
  ["Nasıl çalışır", [["/sesli-siparis","Bas-Konuş sesli sipariş"],["/qr-menu","QR Menü"],["/qr-siparis","QR sipariş"],["/mutfak-ekrani","Mutfak ekranı"],["/stok-recete","Stok ve reçete"]]],
  ["Destek", [["/kurulum","Kurulum"],["/rehber","Rehber"],["/iletisim","İletişim ve teklif"],["/hesap","Talep referansım"]]],
];

function base(title,content,{description="",page="store",admin=false,path="/",robots="noindex,nofollow",canonical="",origin="",ld=[],settings={}}={}) {
  const brandName="TUFAZ Teknoloji";
  const isActive = url => path===url || (url!=="/" && path.startsWith(url+"/")) || url==="/fiyatlar"&&path.startsWith("/paketler");
  const logo = `<img class="logo-light" src="${asset("tufaz-logo-mark.webp")}" width="145" height="88" alt="TUFAZ Teknoloji"><img class="logo-dark" src="${asset("tufaz-logo-light.png")}" width="145" height="88" alt="" aria-hidden="true">`;
  const themeSwitch = `<div class="theme-switch" role="group" aria-label="Görünüm">${[["system","Sistem"],["light","Açık"],["dark","Koyu"]].map(([v,n])=>`<button type="button" data-theme-set="${v}" aria-pressed="${v==="system"}">${n}</button>`).join("")}</div>`;
  const search = (id,placeholder="Ürün, yazılım veya cihaz ara") => `<form class="site-search" action="/magaza" method="get" role="search">
    <label class="sr-only" for="${id}">Mağazada ara</label><input type="search" name="q" id="${id}" placeholder="${placeholder}" maxlength="100" autocomplete="off">
    <button type="submit" aria-label="Ara">${icon("search")}</button></form>`;
  const groups = menuGroups.map(([name,links])=>`<section class="drawer-group"><h2>${h(name)}</h2><ul>${links.map(([url,label])=>
    `<li><a href="${url}"${isActive(url)?' aria-current="page"':""}>${h(label)}${icon("arrow")}</a></li>`).join("")}</ul></section>`).join("");
  const {phone,email}=settings;
  const pageTitle = page==="home"?brandName+" | Restoran ve kafe adisyon yazılımı, kasa ve NFC":title+" | "+brandName;
  const desc = description||"Restoran ve kafeler için adisyon yazılımı, kasa ekipmanı ve NFC ürünleri.";
  const ldScripts = ld.map(item=>`<script type="application/ld+json">${JSON.stringify(item).replace(/</g,"\\u003c")}</script>`).join("");
  const footerCols = [
    ["Mağaza",[["/magaza","Tüm ürünler"],["/yazilim","Yazılım"],["/donanim","Donanım"],["/nfc","DOKUN NFC"],["/hizmet","Kurulum ve hizmet"],["/fiyatlar","Paketler"]]],
    ["Çözümler",[["/restoran-adisyon-programi","Restoran"],["/kafe-adisyon-programi","Kafe"],["/oyun-kafe-adisyon","Oyun kafe"],["/sesli-siparis","Bas-Konuş sesli sipariş"],["/qr-menu","QR Menü"],["/kazanc-hesaplayici","Kazanç hesaplayıcı"]]],
    ["Destek",[["/kurulum","Kurulum"],["/ankara","Ankara kurulum"],["/rehber","Rehber"],["/iletisim","İletişim ve teklif"],["/hesap","Talep referansım"]]],
    ["Kurumsal",[["/kurumsal","Hakkımızda"],["/satis-kosullari","Satış koşulları"],["/iade","İade"],["/gizlilik","Gizlilik"],["/cerez","Çerezler"]]],
  ];
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${h(pageTitle)}</title>
    <meta name="description" content="${h(desc)}">
    <meta name="robots" content="${robots}"><meta name="color-scheme" content="light dark">
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f2f4fa"><meta name="theme-color" media="(prefers-color-scheme: dark)" content="#060d1f">
    <script src="${asset("theme.js")}"></script>
    ${canonical?`<link rel="canonical" href="${h(origin+canonical)}">`:""}
    <meta property="og:type" content="website"><meta property="og:locale" content="tr_TR"><meta property="og:site_name" content="${brandName}">
    <meta property="og:title" content="${h(pageTitle)}"><meta property="og:description" content="${h(desc)}">
    ${canonical?`<meta property="og:url" content="${h(origin+canonical)}">`:""}<meta property="og:image" content="${h(origin)}/assets/market-hero.webp">
    <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${asset("store.css")}">
    <script defer src="${asset("store.js")}"></script>${admin?`<script defer src="${asset("admin.js")}"></script>`:""}${ldScripts}
    </head><body class="page-${h(page)}"><a class="skip" href="#main">İçeriğe geç</a>
    <header class="top" id="top"><div class="wrap top-inner">
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-menu" data-menu-open>${icon("menu")}<span>Menü</span></button>
      <a class="brand" href="/" aria-label="TUFAZ Teknoloji ana sayfa">${logo}</a>
      <div class="desktop-search">${search("desk-search")}</div>
      <div class="top-actions">
        <details class="search-pop"><summary aria-label="Ürün ara">${icon("search")}</summary><div>${search("mobile-search","Ürün ara")}</div></details>
        <a class="support-link" href="/destek">${icon("help")}<span>Yardım</span></a>
        <a class="cart-link" href="/sepet" aria-label="Sepet">${icon("bag")} <span class="cart-label">Sepet</span> <span id="cart-count">0</span></a>
      </div>
    </div></header>
    <div class="drawer-backdrop" data-menu-close hidden></div>
    <nav class="drawer" id="site-menu" aria-label="Ana menü" data-open="false">
      <div class="drawer-head"><a class="brand" href="/" aria-label="TUFAZ Teknoloji ana sayfa">${logo}</a>
        <button type="button" class="drawer-close" data-menu-close aria-label="Menüyü kapat">${icon("close")}</button></div>
      <div class="drawer-search">${search("drawer-search","Ne arıyorsunuz?")}</div>
      <div class="drawer-groups">${groups}</div>
      <div class="drawer-foot"><div class="drawer-theme"><span>Görünüm</span>${themeSwitch}</div><a class="btn primary" href="/fiyatlar">Paketleri gör${icon("arrow")}</a><a class="btn secondary" href="/iletisim">Teklif iste</a>
        ${phone?`<a class="drawer-contact" href="tel:${h(phone.replace(/[ ()-]/g,""))}">${h(phone)}</a>`:""}${email?`<a class="drawer-contact" href="mailto:${h(email)}">${h(email)}</a>`:""}</div>
    </nav>
    <main id="main">${content}</main>
    <footer class="footer"><div class="wrap footer-grid">
      <div class="footer-brand"><img src="${asset("tufaz-logo-light.png")}" width="132" height="80" alt="TUFAZ Teknoloji" loading="lazy">
        <p>Restoran, kafe ve oyun kafeler için adisyon yazılımı, kasa ekipmanı ve NFC ürünleri.</p>
        ${phone?`<a href="tel:${h(phone.replace(/[ ()-]/g,""))}">${h(phone)}</a>`:""}${email?`<a href="mailto:${h(email)}">${h(email)}</a>`:""}</div>
      ${footerCols.map(([name,links])=>`<nav class="footer-col" aria-label="${h(name)}"><h2>${h(name)}</h2>${links.map(([url,label])=>`<a href="${url}">${h(label)}</a>`).join("")}</nav>`).join("")}
    </div><div class="wrap foot-end"><p>© ${new Date().getFullYear()} TUFAZ Teknoloji. Fiyatlar KDV hariçtir. Görseller temsilidir.</p>${themeSwitch}</div></footer>
    <div class="toast" hidden id="toast"><div>${icon("check")}<span id="toast-message" role="status"></span></div><a href="/sepet">Sepeti Gör</a><button type="button" class="toast-close" aria-label="Bildirimi kapat">×</button></div>
    </body></html>`;
}

function plansOf(state) {
  return state.products.filter(p=>p.category==="yazilim" && p.period!=="once" && publiclyVisible(p));
}
const shopFamilies = [
  {path:"/yazilim",name:"Yazılım",desc:"Adisyon paketleri, mutfak ekranı, QR menü ve modüller",art:"pos.svg"},
  {path:"/donanim",name:"Donanım",desc:"Kasa, fiş yazıcı, el terminali ve müşteri ekranı",art:"market-devices.webp"},
  {path:"/nfc",name:"DOKUN NFC",desc:"Menü, Google yorum, Wi-Fi ve bağlantı kartları",art:"market-nfc.webp"},
  {path:"/hizmet",name:"Kurulum ve hizmet",desc:"Cihaz, menü aktarımı ve personel eğitimi",art:"servis-sahnesi-mobil.webp"},
];
const slides = [
  {key:"adisyon",name:"Adisyon",image:"market-hero.webp",mobile:"market-hero-mobile.webp",caption:"Temsili kasa ekipmanı"},
  {key:"donanim",name:"Donanım",image:"market-devices.webp",caption:"Temsili fiş yazıcı ve barkod okuyucu"},
  {key:"nfc",name:"DOKUN NFC",image:"market-nfc.webp",caption:"Temsili NFC kartları"},
];

function productCard(p, heading="h3") {
  const badge = statusBadge(p);
  const mode = cartMode(p);
  return `<article class="market-product">
    <a class="product-art" href="${productPath(p)}" tabindex="-1" aria-hidden="true">
      ${productVisual(p)}${badge?`<span class="product-badge">${badge}</span>`:""}
    </a>
    <div class="product-body"><p class="product-kind">${h(categories[p.category])}${p.subcategory?`<span class="kind-sub"> · ${h(p.subcategory)}</span>`:""}</p>
      <${heading}><a href="${productPath(p)}">${h(p.name)}</a></${heading}><p class="product-brief">${h(p.brief)}</p>
      <div class="product-buy">${priceBlock(p)}${addButton(p)}${modeHint[mode]?`<p class="mode-hint">${modeHint[mode]}</p>`:""}</div>
    </div>
  </article>`;
}
const productGrid = (items,heading="h3") => `<div class="product-grid">${items.map(p=>productCard(p,heading)).join("")}</div>`;

function helpBand() {
  return `<section class="wrap market-section"><div class="help-band"><div><p class="eyebrow">Kurulum</p><h2>Elinizdeki cihazla başlayın.</h2>
    <p>Kasa, yazıcı veya ödeme cihazınızın marka ve modelini iletin. Yazılımla uyumunu kurulumdan önce kontrol edelim.</p></div>
    <div class="help-actions">${link("/iletisim","Cihaz uyumunu sor","btn signal")}${link("/kurulum","Kurulum nasıl ilerler?","hero-link")}</div></div></section>`;
}

const pains = [
  {q:"Sipariş mutfağa geç mi gidiyor?",a:"Masada alınan sipariş mutfak ekranına veya yazıcısına iletilir; garson aynı siparişi kâğıttan tekrar okumaz.",topic:"/mutfak-ekrani",product:"mutfak-ekrani",ic:"clock"},
  {q:"Garson menüde ürün ararken masa bekliyor mu?",a:"Bas-Konuş ile garson siparişi söyler, önizlemede kontrol edip onaylar. Onaysız komut adisyona yazılmaz.",topic:"/sesli-siparis",product:"bas-konus",ic:"mic"},
  {q:"Fiyat değişince menüyü yeniden mi bastırıyorsunuz?",a:"QR Menü’de fiyatı panelden güncellersiniz, masadaki kod güncel menüyü açar.",topic:"/qr-menu",product:"qr-menu",ic:"tag"},
  {q:"Sattığınız üründen gerçekten ne kalıyor?",a:"Reçete ve alış fiyatını girdiğinizde ürün bazında maliyet ve stok hareketini görürsünüz.",topic:"/stok-recete",product:"stok-recete",ic:"calc"},
];
const faqs = [
  ["İnternet kesilirse ne olur?","Bağlantı koptuğunda hangi işlemlerin sürdüğü cihaz ve kurulum düzeninize bağlıdır. Kurulumdan önce kendi cihazınızda bağlantıyı kesip birlikte deneriz; sonucu yazılı olarak paylaşırız."],
  ["Mevcut POS cihazım veya yazıcımla çalışır mı?","Marka ve modeli iletin. Test edilmiş cihazları ürün sayfasında belirtiriz; test edilmemiş bir model için uyumlu olduğunu varsaymayız, uygun seçenek öneririz."],
  ["Cihazı da sizden almak zorunda mıyım?","Hayır. Uyumlu olduğu doğrulanan mevcut cihazlarınızla başlayabilirsiniz. Eksik olan için teklif hazırlarız."],
  ["Kurulumu kim yapacak?","Kurulum kapsamı talebiniz üzerine belirlenir: cihaz kontrolü, menü ve masa aktarımı, örnek vardiya ve personel eğitimi. Ankara’da yerinde kurulum planlanabilir."],
  ["Fiyatlara KDV dahil mi, nasıl yenilenir?","Gösterilen paket fiyatları aylık ve KDV hariçtir. Sepette ilk dönem tutarı ile aylık yenileme tutarı ayrı görünür. Fiyatı teklifle belirlenen ürünler toplama eklenmez."],
  ["Sepete eklediğimde ödeme alınıyor mu?","Bu sürümde site üzerinden kartla ödeme alınmaz. Sepetinizi talep olarak gönderirsiniz; kapsamı ve tutarı sizinle teyit ettikten sonra kurulum planlanır."],
];
const faqHtml = list => `<div class="faq">${list.map(([q,a])=>`<details><summary>${h(q)}</summary><p>${h(a)}</p></details>`).join("")}</div>`;

function home(state) {
  const plans=plansOf(state);
  const items=state.products.filter(publiclyVisible);
  const main=plans.find(p=>p.featured&&addable(p))||plans.find(addable);
  const {heroTitle:title,heroText:lead,notice}=storefrontSettings(state.settings);
  const firstBuy=main?`<div class="hero-buy"><div><span>${h(main.name)} paketi</span><p class="price">${priceHtml(main)}</p></div>${addButton(main,"btn signal")}</div>`:"";
  const copy=[
    [title,lead,firstBuy,link("/fiyatlar","Paketleri karşılaştır","hero-link")],
    ["Kasanızla çalışan cihazlar","Fiş yazıcı, kasa çekmecesi ve garson el terminali. Modeli yazılımla test edip öneriyoruz.",link("/donanim","Donanıma bak","btn primary"),link("/iletisim","Cihaz uyumunu sor","hero-link")],
    ["Google yorum bağlantınızı tek tek tarif etmeyin","Misafir kartı telefonuna yaklaştırır, yorum veya menü sayfanız açılır. Yorum yazılması garanti değildir.",link("/nfc","NFC ürünlerini gör","btn primary"),""],
  ];
  const byId = id => items.find(p=>p.id===id);
  const featured=[...items.filter(p=>p.featured && !(p.category==="yazilim" && p.period!=="once")),...["termal-fis-yazici","google-yorum-karti","qr-menu","bas-konus","mutfak-ekrani"].map(byId)]
    .filter((p,i,a)=>p&&a.indexOf(p)===i).slice(0,8);
  return `${notice?`<div class="announcement"><div class="wrap">${h(notice)}</div></div>`:""}
  <section class="wrap hero-shell" data-campaign aria-label="Mağaza vitrini">
    ${slides.map((s,i)=>`<div class="campaign-panel" id="slide-${s.key}"${i?" hidden":""}>
      <div class="campaign-copy">
        <p class="campaign-index"><span></span> ${["TUFAZ POS adisyon","Kasa ve mutfak donanımı","DOKUN NFC"][i]}</p>
        ${i===0?`<h1>${h(copy[i][0])}</h1>`:`<h2>${h(copy[i][0])}</h2>`}<p class="campaign-lead">${h(copy[i][1])}</p>
        <div class="campaign-actions">${copy[i][2]}${copy[i][3]}</div>
      </div>
      <figure class="campaign-frame"><picture>${s.mobile?`<source media="(max-width: 700px)" srcset="/assets/${s.mobile}">`:""}<img src="/assets/${s.image}" width="1280" height="853" alt=""${i===0?' fetchpriority="high"':' loading="lazy"'}></picture><figcaption class="art-caption">${s.caption}</figcaption></figure>
    </div>`).join("")}
    <div class="campaign-controls"><div class="campaign-tabs" role="group" aria-label="Vitrin seçimi">
      ${slides.map((s,i)=>`<button type="button" data-slide="${s.key}" aria-controls="slide-${s.key}" aria-pressed="${i===0}"><span>0${i+1}</span> ${s.name}</button>`).join("")}
    </div><div class="campaign-arrows"><button type="button" data-slide-step="-1" aria-label="Önceki vitrin">${icon("back")}</button><button type="button" data-slide-step="1" aria-label="Sonraki vitrin">${icon("arrow")}</button></div></div>
  </section>

  <section class="wrap market-section"><div class="market-heading"><div><p class="eyebrow">Hangi sorunu çözüyor?</p><h2>Servisin aksadığı yerden başlayın</h2></div>${link("/cozumler","Tüm çözümler")}</div>
    <div class="pain-grid">${pains.map(x=>{const p=byId(x.product);return `<article class="pain-card"><span class="pain-icon">${icon(x.ic)}</span><h3>${h(x.q)}</h3><p>${h(x.a)}</p>
      <div class="pain-links">${link(x.topic,"Nasıl çalışır?")}${p?`<a class="link muted-link" href="${productPath(p)}">${h(p.name)}</a>`:""}</div></article>`}).join("")}</div>
  </section>

  ${plans.length?`<section class="wrap market-section" id="paketler"><div class="market-heading"><div><p class="eyebrow">Paketler</p><h2>İşletmenize uygun adisyon paketi</h2><p class="heading-note">Aylık fiyatlar, KDV hariç. Paket kapsamı kurulumdan önce yazılı olarak teyit edilir.</p></div>${link("/fiyatlar","Paketleri karşılaştır")}</div>
    ${productGrid(plans)}</section>`:""}

  <section class="wrap market-section"><div class="market-heading"><div><p class="eyebrow">Mağaza</p><h2>Kategorileri keşfet</h2></div>${link("/magaza","Tüm ürünler")}</div>
    <div class="family-grid">${shopFamilies.map((c,i)=>`<a class="family" href="${c.path}"><div class="family-copy"><span>0${i+1}</span><h3>${c.name}</h3><p>${c.desc}</p></div><div class="family-media"><img src="/assets/${c.art}" width="760" height="510" alt="" loading="lazy"><span class="family-arrow">${icon("arrow")}</span></div></a>`).join("")}</div>
  </section>

  ${featured.length?`<section class="wrap market-section featured-section"><div class="market-heading"><div><p class="eyebrow">Öne çıkanlar</p><h2>Sık birlikte seçilenler</h2></div><div class="rail-controls"><button type="button" data-rail-step="-1" aria-label="Önceki ürünler">${icon("back")}</button><button type="button" data-rail-step="1" aria-label="Sonraki ürünler">${icon("arrow")}</button></div></div>
    <div class="product-rail" data-product-rail tabindex="0" aria-label="Öne çıkan ürünler">${featured.map(p=>productCard(p)).join("")}</div>
  </section>`:""}

  <section class="wrap market-section"><div class="calc-band"><div><p class="eyebrow">Kazanç hesaplayıcı</p><h2>Kendi rakamlarınızla hesaplayın</h2>
    <p>Sipariş başına harcanan süreyi, hatalı sipariş sayısını ve maliyetleri girin. Sonuç sizin girdiğiniz verilere dayanan varsayımsal bir senaryodur, tasarruf garantisi değildir.</p></div>
    ${link("/kazanc-hesaplayici","Hesaplayıcıyı aç","btn primary")}</div></section>

  <section class="wrap market-section"><div class="market-heading"><div><p class="eyebrow">Sık sorulanlar</p><h2>Karar vermeden önce</h2></div>${link("/rehber","Rehber")}</div>${faqHtml(faqs)}</section>
  ${helpBand()}`;
}

const catalogData = {
  magaza:["Tüm ürünler","Yazılım paketleri, kasa ekipmanı, NFC ürünleri ve kurulum hizmetleri.","neutral"],
  yazilim:["Yazılım","Adisyon paketleri ve ek modüller. Paketler aylık, KDV hariç fiyatlıdır; modüller teklifle fiyatlanır.","yazilim"],
  donanim:["Donanım","Kasa ve mutfak için cihazlar. Her model yazılımla uyumu kontrol edildikten sonra önerilir.","donanim"],
  nfc:["DOKUN NFC","Telefonu yaklaştırınca menü, yorum veya bağlantı sayfası açılır. Kartlar teslimden önce test edilir.","nfc"],
  hizmet:["Kurulum ve hizmet","Cihaz kontrolü, menü ve masa aktarımı, personel eğitimi.","hizmet"],
};
function catalog(category,url,state) {
  const [title,desc,toneName] = catalogData[category];
  const q = (url.searchParams.get("q")||"").trim().slice(0,100);
  const sort = url.searchParams.get("sirala") || "default";
  const filter = url.searchParams.get("durum") || "";
  const sub = (url.searchParams.get("grup") || "").slice(0,50);
  const all = state.products.filter(p=>(category==="magaza"||p.category===category) && publiclyVisible(p));
  const groups = category==="magaza"?[]:[...new Set(all.map(p=>p.subcategory).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"tr"));
  const normalized = q.toLocaleLowerCase("tr");
  const products = all.filter(p=>(!filter||p.status===filter) && (!sub||p.subcategory===sub) && (!q || (p.name+" "+p.brief+" "+p.sku+" "+(p.subcategory||"")+" "+categories[p.category]).toLocaleLowerCase("tr").includes(normalized)));
  const order = {yazilim:0,donanim:1,nfc:2,hizmet:3};
  if(sort==="price") products.sort((a,b)=>(a.price??Infinity)-(b.price??Infinity));
  else products.sort((a,b)=>(order[a.category]-order[b.category]) || (Number(addable(b))-Number(addable(a))) || (Number(b.featured)-Number(a.featured)));
  function groupPath(group) {
    const params = new URLSearchParams();
    if(q) params.set("q",q);
    if(filter) params.set("durum",filter);
    if(sort==="price") params.set("sirala",sort);
    if(group) params.set("grup",group);
    return "/"+category+(params.size?"?"+params:"");
  }
  const tabs = `<nav class="category-tabs" aria-label="Kategoriler">${[["magaza","Tümü"],["yazilim","Yazılım"],["donanim","Donanım"],["nfc","DOKUN NFC"],["hizmet","Kurulum ve hizmet"]]
    .map(([c,n])=>`<a href="/${c}${q?"?q="+encodeURIComponent(q):""}"${c===category?' aria-current="page"':""}>${n}</a>`).join("")}</nav>`;
  const searchForm = `<form class="catalog-search" method="get">
      ${sub?`<input type="hidden" name="grup" value="${h(sub)}">`:""}
      <label class="sr-only" for="catalog-query">Bu kategoride ara</label>
      <div class="catalog-search-row"><input id="catalog-query" type="search" name="q" value="${h(q)}" maxlength="100" placeholder="Ürün adı veya kodu">
      <button class="btn primary" type="submit">${icon("search")} Ara</button></div>
      <details class="catalog-filters"${filter||sort==="price"?" open":""}><summary>Filtrele ve sırala</summary><div>
        <label>Satış durumu<select name="durum"><option value="">Tümü</option><option value="active"${filter==="active"?" selected":""}>Fiyatı belli</option><option value="quote"${filter==="quote"?" selected":""}>Teklif ile</option><option value="soon"${filter==="soon"?" selected":""}>Yakında</option></select></label>
        <label>Sırala<select name="sirala"><option value="default">Önerilen</option><option value="price"${sort==="price"?" selected":""}>Düşük fiyat</option></select></label>
        <button class="btn secondary" type="submit">Uygula</button>
      </div></details>
    </form>`;
  const trail = category==="magaza"?[["Ana sayfa","/"],["Tüm ürünler"]]:[["Ana sayfa","/"],["Mağaza","/magaza"],[title]];
  return {trail,html:`<div class="wrap page">${pageHead({trail,eyebrow:category==="magaza"?"Mağaza":"Kategori",title,desc,toneName,extra:tabs+searchForm})}
    <section class="section catalog">
    <div class="catalog-toolbar">
      ${groups.length?`<nav class="category-switch" aria-label="Ürün grupları">${["",...groups].map(group=>`<a href="${h(groupPath(group))}"${sub===group?' aria-current="page"':""}>${h(group||"Tüm "+title.toLocaleLowerCase("tr"))}</a>`).join("")}</nav>`:""}
      <p class="fine results-count">${products.length} ürün${q||filter||sub||sort==="price"?` · <a href="/${category}">Temizle</a>`:""}</p>
    </div>
    ${products.length?productGrid(products,"h2"):`<div class="empty-state"><p>Aramanıza uygun ürün bulamadık.</p>${link("/iletisim","Aradığınızı bize yazın","btn secondary")}</div>`}
    <p class="fine catalog-note">Fiyatı belli ürünler aylık veya tek seferlik, KDV hariç gösterilir. “Teklif ile” ürünler de sepete eklenir; fiyatı kapsam netleşince bildirilir.</p>
  </section></div>${helpBand()}`};
}

function related(p,state) {
  const visible = state.products.filter(x=>publiclyVisible(x) && x.id!==p.id);
  const pick = ids => ids.map(id=>visible.find(x=>x.id===id)).filter(Boolean);
  const guide = productGuide[p.id];
  const fromGuide = guide && topics[guide] ? pick(topics[guide].products) : [];
  const complements = {yazilim:["termal-fis-yazici","isletme-kurulumu","google-yorum-karti"],donanim:["kafe","restoran","isletme-kurulumu"],nfc:["qr-menu","masa-standi","google-yorum-karti"],hizmet:["kafe","restoran","egitim"]}[p.category]||[];
  const sameGroup = visible.filter(x=>x.category===p.category && x.subcategory===p.subcategory);
  return [...fromGuide,...pick(complements),...sameGroup].filter((x,i,a)=>a.indexOf(x)===i).slice(0,4);
}

function detail(p,state,origin) {
  const mode = cartMode(p);
  const cat = categories[p.category];
  const trail = [["Ana sayfa","/"],[p.category==="nfc"?"DOKUN NFC":cat,"/"+p.category],[p.name]];
  const guide = productGuide[p.id];
  const delivery = p.category==="yazilim"?"Lisans, talebiniz onaylanıp kurulum planlandıktan sonra açılır."
    : p.category==="hizmet"?"Yerinde veya uzaktan, kapsam teyidinden sonra planlanır."
    : "Kargo veya kurulumla teslim. Süre ve ücret teklifte netleşir.";
  const specs = [
    ["Satın alma türü",productType(p)],
    ["Fiyat",mode==="buy"?`${priceText(p.price)} ${periodSuffix(p)}+ KDV`:mode==="preorder"?"Henüz satışta değil":"Kapsam netleşince teklifle bildirilir"],
    ...(mode==="buy" && p.period!=="once"?[["Yenileme",p.period==="monthly"?"Her ay aynı tutar, KDV hariç":"Her yıl aynı tutar, KDV hariç"]]:[]),
    ["KDV",p.vat===null?"Fatura aşamasında eklenir":"%"+p.vat],
    ...(p.stock!==null?[["Stok",p.stock===0?"Stokta yok":p.stock+" adet"]]:[]),
    ["Teslim ve aktivasyon",delivery],
    ...(p.compatibility?[["Uyumluluk",p.compatibility]]:[]),
    ...(p.warranty?[["Garanti ve teslim",p.warranty]]:[]),
    ["Ürün kodu",p.sku],
  ];
  const note = mode==="quote"?"Sepete ekleyip talebinizi gönderin. Model, adet ve kurulum kapsamına göre fiyatı size bildiririz."
    : mode==="preorder"?"Bu ürün henüz satışta değil. Sepete eklerseniz ön kayıt olarak iletilir, ödeme alınmaz ve satışa açıldığında size haber verilir."
    : "Sepete ekleyin, talebinizi gönderin. Kapsamı ve tutarı sizinle teyit ettikten sonra kurulum planlanır.";
  const rel = related(p,state);
  const ld = [];
  if (mode==="buy") ld.push({"@context":"https://schema.org","@type":"Product",name:p.name,description:p.brief,sku:p.sku,
    brand:{"@type":"Brand",name:"TUFAZ"},image:p.image?origin+p.image:undefined,
    offers:{"@type":"Offer",url:origin+productPath(p),priceCurrency:"TRY",price:(p.price/100).toFixed(2),availability:"https://schema.org/InStock"}});
  return {trail,ld,html:`<div class="wrap page">${crumbs(trail)}
    <section class="product-detail">
      <figure class="detail-art">${productVisual(p,"",true)}${p.image?.startsWith("/assets/")?"<figcaption>Temsili ürün görseli</figcaption>":""}</figure>
      <div class="detail-copy">
        <p class="eyebrow">${h(cat)}${p.subcategory?` · ${h(p.subcategory)}`:""}</p>
        <h1>${h(p.name)}</h1><p class="page-intro">${h(p.brief)}</p>
        <div class="detail-buy" id="detail-buy">${priceBlock(p)}<div class="detail-actions">${addButton(p)}${link("/iletisim?urun="+encodeURIComponent(p.id),"Soru sor","btn secondary")}</div></div>
        <p class="buy-note">${note}</p>
        <p class="description">${h(p.description)}</p>
        ${guide&&topics[guide]?`<a class="guide-link" href="${guide}"><span><small>Nasıl çalışır?</small><b>${h(topics[guide].name)}</b></span>${icon("arrow")}</a>`:""}
        <dl class="spec-list">${specs.map(([k,v])=>`<div><dt>${h(k)}</dt><dd>${h(v)}</dd></div>`).join("")}</dl>
      </div>
    </section>
    <ol class="buy-steps" aria-label="Satın alma adımları"><li><b>1</b>Sepete ekleyin</li><li><b>2</b>İşletme bilgilerinizi gönderin</li><li><b>3</b>Kapsam ve tutarı birlikte teyit edelim</li><li><b>4</b>Kurulum ve aktivasyon</li></ol>
    ${rel.length?`<section class="market-section"><div class="market-heading"><div><p class="eyebrow">Birlikte değerlendirin</p><h2>Bu ürünle sık seçilenler</h2></div>${link("/"+p.category,"Tüm "+(p.category==="nfc"?"NFC ürünleri":cat.toLocaleLowerCase("tr")))}</div>${productGrid(rel)}</section>`:""}
  </div>
  <div class="buy-bar" data-buy-bar><div class="wrap buy-bar-inner"><div><b>${h(p.name)}</b>${priceBlock(p)}</div>${addButton(p)}</div></div>
  ${helpBand()}`};
}

function topicContent(path,state) {
  const t = topics[path];
  const visible = state.products.filter(publiclyVisible);
  const items = t.products.map(id=>visible.find(p=>p.id===id)).filter(Boolean);
  const groupName = {cozum:"İşletmenize göre",modul:"Nasıl çalışır",rehber:"Rehber",destek:"Destek"}[t.group];
  const groupUrl = {cozum:"/cozumler",modul:"/cozumler",rehber:"/rehber",destek:"/destek"}[t.group];
  const trail = [["Ana sayfa","/"],[groupName,groupUrl],[t.name]];
  const siblings = Object.entries(topics).filter(([p,x])=>p!==path && x.group===t.group).slice(0,8);
  const voice = path==="/sesli-siparis" ? `<div class="voice-demo" id="voice-demo" aria-live="polite">
      <p class="voice-label">Örnek akış · gerçek ses tanıma yapılmaz</p>
      <p class="voice-quote">“Masa 3’e iki ayran, beş lahmacun ekle.”</p>
      <div class="voice-preview" id="voice-preview" hidden><p><b>Masa 3</b> · önizleme</p><ul><li><span>2 ×</span> Ayran</li><li><span>5 ×</span> Lahmacun</li></ul></div>
      <p id="voice-status" class="voice-status"></p>
      <div class="voice-actions"><button class="btn primary" id="voice-action" type="button">${icon("mic")}<span>Komutu dene</span></button><button class="btn secondary" id="voice-fix" type="button" hidden>Düzelt</button></div>
    </div>`:"";
  return {trail,html:`<div class="wrap page">${pageHead({trail,eyebrow:groupName,title:t.name,desc:t.desc,toneName:t.group==="rehber"?"neutral":"yazilim",
      actions:t.target?link(t.target,t.target.startsWith("/yazilim")||t.target.startsWith("/paketler")||t.target.startsWith("/donanim")||t.target.startsWith("/hizmet")?"Ürünü incele":"Devamını oku","btn primary"):""})}
    <section class="section topic">
      <div class="topic-copy">
        ${t.question?`<p class="topic-question">${h(t.question)}</p>`:""}
        <h2 class="topic-h">Akış</h2>
        <ol class="steps" id="kullanim">${t.steps.map((s,i)=>`<li><span>${i+1}</span>${h(s)}</li>`).join("")}</ol>
        ${voice}
        ${t.note?`<p class="topic-note">${h(t.note)}</p>`:""}
        ${t.live?"":`<p class="topic-note soon-note">Bu özellik henüz satışta değil. Sepete ekleyerek ön kayıt bırakabilirsiniz; ödeme alınmaz.</p>`}
      </div>
      <figure class="topic-art">${visual(t.image,t.name+" örnek görseli")}<figcaption>Örnek ekran görseli. Gerçek ekran kurulumda gösterilir.</figcaption></figure>
    </section>
    ${items.length?`<section class="market-section"><div class="market-heading"><div><p class="eyebrow">İlgili ürünler</p><h2>Bu akış için gerekenler</h2></div>${link("/kazanc-hesaplayici","Kazancınızı hesaplayın")}</div>${productGrid(items)}</section>`:""}
    ${siblings.length?`<section class="market-section"><div class="market-heading"><div><p class="eyebrow">${h(groupName)}</p><h2>Diğer sayfalar</h2></div></div>
      <nav class="chip-links" aria-label="İlgili sayfalar">${siblings.map(([p,x])=>`<a href="${p}">${h(x.name)}${icon("arrow")}</a>`).join("")}</nav></section>`:""}
  </div>${helpBand()}`};
}

function directory(title,subtitle,paths,trail,eyebrow="TUFAZ") {
  return `<div class="wrap page">${pageHead({trail,eyebrow,title,desc:subtitle})}<section class="section"><div class="card-links">${paths.map(([path,label,desc,q])=>`<a href="${path}"><span>${q?`<small class="card-q">${h(q)}</small>`:""}<b>${h(label)}</b>${desc?`<small>${h(desc)}</small>`:""}</span>${icon("arrow")}</a>`).join("")}</div></section></div>${helpBand()}`;
}
const policy = {
  "/gizlilik":["Gizlilik","Talep formunda işletme adı, e-posta ve isteğe bağlı olarak telefon, şehir ve yazdığınız not kaydedilir. Bu bilgiler yalnız talebinizi incelemek ve size dönüş yapmak için kullanılır. Formda kart, kimlik veya vergi numarası istenmez. Kayıtlı bilgilerinizin silinmesini iletişim sayfasından isteyebilirsiniz."],
  "/cerez":["Çerezler","Sepetiniz bu tarayıcının yerel depolamasında tutulur ve sunucuya yalnız fiyat hesaplamak veya talep göndermek için iletilir. Reklam veya izleme çerezi kullanılmaz. Yönetim girişinde yalnız oturum çerezi kullanılır."],
  "/satis-kosullari":["Satış koşulları","Bu sürümde sepet bir talep olarak gönderilir; site üzerinden kartla ödeme alınmaz ve talep göndermek ücretli sipariş ya da abonelik başlatmaz. Fiyatı belli ürünlerde gösterilen tutarlar KDV hariçtir. Fiyatı teklifle belirlenen ürünlerin tutarı, kapsam netleştikten sonra yazılı olarak bildirilir. Yakında olarak işaretlenen ürünler için bırakılan ön kayıt bir satın alma değildir. Canlı satış açıldığında mesafeli satış sözleşmesi ve ön bilgilendirme formu ödeme öncesinde gösterilir."],
  "/iade":["İade","Bu sürümde site üzerinden tahsilat yapılmaz. Daha önce yaptığınız bir alışverişle ilgili iade veya iptal talebinizi iletişim formundan iletebilirsiniz. Canlı satış açıldığında iade ve cayma koşulları ürün türüne göre bu sayfada yayımlanır."],
};
function formMarkup(kind,product="",{full=false}={}) {
  return `<form class="form form-request" id="request-form" method="post" data-kind="${kind}" data-product="${h(product)}">
    <div class="form-grid">
    <label>İşletme adı<input name="business" required maxlength="100" autocomplete="organization"></label>
    <label>E-posta<input name="email" type="email" required maxlength="160" autocomplete="email"></label>
    <label>Telefon <small>(isteğe bağlı)</small><input name="phone" type="tel" maxlength="25" autocomplete="tel" inputmode="tel"></label>
    <label>İşletme türü<select name="businessType">${Object.entries(businessTypes).map(([v,n])=>`<option value="${v}">${h(v?n:"Seçin")}</option>`).join("")}</select></label>
    ${full?`<label class="span-2">Şehir ve ilçe <small>(isteğe bağlı)</small><input name="city" maxlength="60" autocomplete="address-level2" placeholder="Örneğin Ankara, Çankaya"></label>`:""}
    </div>
    <label>Not <small>(isteğe bağlı)</small><textarea name="message" maxlength="700" rows="4" placeholder="Örneğin masa sayısı, kullandığınız kasa veya yazıcı modeli"></textarea></label>
    <label hidden>Web sitesi<input name="website" tabindex="-1" autocomplete="off"></label>
    <p class="fine">Bilgileriniz yalnız talebinizi incelemek için kaydedilir. <a href="/gizlilik">Gizlilik bilgileri</a></p>
    <button type="submit" class="btn primary">${kind==="cart"?"Talebi Gönder":"Gönder"} ${icon("arrow")}</button><p class="form-message" role="status"></p>
  </form>`;
}
function checkoutSteps(active) {
  return `<ol class="checkout-steps" aria-label="Adımlar">${["Sepet","İşletme bilgileri","Talep referansı"].map((s,i)=>`<li${i===active?' aria-current="step"':""}${i<active?' class="done"':""}><b>${i+1}</b>${s}</li>`).join("")}</ol>`;
}
function shopRequest(kind) {
  const checkout = kind === "checkout";
  const trail = checkout?[["Ana sayfa","/"],["Sepet","/sepet"],["Talep bilgileri"]]:[["Ana sayfa","/"],["Sepet"]];
  return {trail,html:`<div class="wrap page">${pageHead({trail,eyebrow:"Mağaza",title:checkout?"İşletme bilgileri":"Sepetiniz",
      desc:checkout?"Sepetinizi talep olarak gönderin. Bu aşamada ödeme alınmaz; kapsamı ve tutarı sizinle teyit ederiz.":"Ürünleri, adetleri, ilk dönem tutarını ve teklif bekleyen kalemleri kontrol edin.",extra:checkoutSteps(checkout?1:0)})}
    <section class="section"><div class="checkout-grid" data-view="${kind}"><div id="cart-lines" class="cart-lines" aria-live="polite"><p class="empty">Sepet yükleniyor…</p></div>
    <aside class="totals" id="cart-totals"></aside>
    ${checkout?`<div id="cart-request" hidden><h2>İşletme bilgileri</h2>${formMarkup("cart","",{full:true})}</div>`:""}</div>
    <noscript><p class="fine">Sepet için tarayıcınızda JavaScript açık olmalıdır. Dilerseniz <a href="/iletisim">iletişim formundan</a> talep gönderebilirsiniz.</p></noscript>
  </section></div>`};
}

function roiPage(state) {
  const plans = plansOf(state).filter(addable);
  const trail = [["Ana sayfa","/"],["Paketler","/fiyatlar"],["Kazanç hesaplayıcı"]];
  const num = (name,label,value,{unit="",step="1",min="0",hint=""}={}) => `<label>${h(label)}${hint?` <small>${h(hint)}</small>`:""}<span class="input-unit"><input type="number" inputmode="decimal" name="${name}" value="${value}" min="${min}" step="${step}">${unit?`<i>${h(unit)}</i>`:""}</span></label>`;
  return {trail,html:`<div class="wrap page">${pageHead({trail,eyebrow:"Varsayımsal senaryo",title:"Kazanç hesaplayıcı",
    desc:"Kendi işletmenizin rakamlarını girin. Hesap yalnız sizin verdiğiniz verilere dayanır; tasarruf veya ciro artışı garantisi değildir.",toneName:"yazilim"})}
  <section class="section roi" id="roi">
    <form class="roi-form" id="roi-form">
      <fieldset><legend>Sipariş süresi</legend>
        ${num("orders","Günlük sipariş sayısı",120,{unit:"adet"})}
        ${num("secBefore","Bugün bir siparişin alınıp kasaya/mutfağa iletilmesi",75,{unit:"sn",hint:"garsonun yürüme süresi dahil"})}
        ${num("secAfter","TUFAZ ile beklediğiniz süre",45,{unit:"sn",hint:"kendi denemenize göre"})}
        ${num("days","Ayda açık gün",28,{unit:"gün",step:"1"})}
      </fieldset>
      <fieldset><legend>Personel ve hata</legend>
        ${num("staffCost","Bir çalışanın aylık toplam işveren maliyeti",35000,{unit:"TL",step:"100",hint:"örnek değer, kendi rakamınızı yazın"})}
        ${num("staffHours","Bir çalışanın aylık çalışma saati",225,{unit:"saat"})}
        ${num("cashSaving","Fiilen azalacak ücretli mesai/vardiya maliyeti",0,{unit:"TL / ay",step:"100",hint:"azalmıyorsa 0 bırakın"})}
        ${num("errBefore","Aylık hatalı sipariş (bugün)",30,{unit:"adet"})}
        ${num("errAfter","Aylık hatalı sipariş (beklenen)",15,{unit:"adet"})}
        ${num("errCost","Bir hatalı siparişin ortalama maliyeti",120,{unit:"TL",step:"10"})}
      </fieldset>
      <fieldset><legend>Maliyetler (KDV hariç)</legend>
        <label>Paket<select name="plan">${plans.map((p,i)=>`<option value="${p.price/100}"${i===0?" selected":""}>${h(p.name)} · ${priceText(p.price)} / ay</option>`).join("")}<option value="custom">Diğer tutar</option></select></label>
        ${num("software","Aylık yazılım ücreti",plans[0]?plans[0].price/100:0,{unit:"TL / ay",step:"10"})}
        ${num("hardware","Cihaz (tek seferlik)",0,{unit:"TL",step:"100"})}
        ${num("setup","Kurulum ve eğitim (tek seferlik)",0,{unit:"TL",step:"100"})}
        ${num("fees","Diğer aylık giderler (ödeme komisyonu vb.)",0,{unit:"TL / ay",step:"10"})}
      </fieldset>
    </form>
    <aside class="roi-result" id="roi-result" aria-live="polite">
      <h2>Sonuç</h2>
      <dl>
        <div><dt>Yıllık geri kazanılan iş gücü</dt><dd data-out="hours">—</dd></div>
        <div class="soft"><dt>Bu sürenin kapasite değeri <small>nakit tasarruf değildir</small></dt><dd data-out="capacity">—</dd></div>
        <div><dt>Hatalı sipariş maliyetindeki azalış (yıllık)</dt><dd data-out="errors">—</dd></div>
        <div><dt>Nakit personel tasarrufu (yıllık)</dt><dd data-out="cash">—</dd></div>
        <div><dt>İlk yıl toplam maliyet</dt><dd data-out="cost">—</dd></div>
        <div class="total"><dt>Net ilk yıl etkisi</dt><dd data-out="net">—</dd></div>
        <div><dt>Geri ödeme süresi</dt><dd data-out="payback">—</dd></div>
      </dl>
      <p class="fine" data-out="explain"></p>
      <details class="formula"><summary>Nasıl hesaplanıyor?</summary>
        <p><b>Geri kazanılan saat</b> = (bugünkü süre − beklenen süre) × günlük sipariş × ayda açık gün × 12 ÷ 3600.</p>
        <p><b>Kapasite değeri</b> = geri kazanılan saat × saatlik maliyet. Garson sayısı azalmıyorsa bu tutar cebinize nakit olarak girmez; daha hızlı servis veya yoğun saatte ek kapasite olarak düşünülmelidir.</p>
        <p><b>Hata maliyeti azalışı</b> = (bugünkü hata − beklenen hata) × hata başına maliyet × 12.</p>
        <p><b>Net ilk yıl etkisi</b> = hata azalışı + fiilen azalan mesai − (yazılım × 12 + cihaz + kurulum + diğer giderler × 12). Kapasite değeri net etkiye eklenmez.</p>
        <p><b>Geri ödeme</b> = tek seferlik yatırım ÷ net aylık katkı. Net aylık katkı sıfır veya negatifse geri ödeme süresi hesaplanmaz.</p>
        <p>Örnek: Aylık 35.000 TL maliyetli bir pozisyon tamamen kalkarsa yıllık karşılığı 420.000 TL’dir. Bu bir tasarruf vaadi değildir; gerçek tasarruf için iş gücünün fiilen değişmesi gerekir.</p>
      </details>
      <div class="roi-actions">${link("/fiyatlar","Paketleri gör","btn primary")}${link("/iletisim","Rakamlarımı birlikte değerlendirelim","btn secondary")}</div>
    </aside>
    <noscript><p class="fine">Hesaplayıcı için JavaScript açık olmalıdır.</p></noscript>
  </section></div>`};
}

export function sitemapPaths(state) {
  const indexable = Object.entries(topics).filter(([,t])=>t.live).map(([p])=>p);
  const products = state.products.filter(p=>publiclyVisible(p) && p.status!=="soon").map(productPath);
  return ["/","/magaza","/yazilim","/donanim","/nfc","/hizmet","/fiyatlar","/kazanc-hesaplayici","/cozumler","/rehber","/destek","/kurulum","/iletisim","/kurumsal",...indexable,...products,...Object.keys(policy)]
    .filter((p,i,a)=>a.indexOf(p)===i);
}

const adminTabs = {"/admin":"Genel bakış","/admin/urunler":"Ürünler","/admin/kuponlar":"Kuponlar","/admin/talepler":"Talepler","/admin/ayarlar":"Mağaza ayarları","/admin/gecmis":"İşlem geçmişi"};
function adminPage(path,auth) {
  if (!auth.authorized) {
    const intro = `<header class="page-head"><div class="page-head-body"><div><p class="eyebrow">TUFAZ Teknoloji</p><h1>Yönetim paneli</h1>`;
    if (!auth.local) return `<div class="wrap page narrow">${intro}<p class="page-intro">Bu kurulumda parola ile giriş kapalı. Yönetici erişimini barındırma ortamınızdan yapılandırın.</p></div></div></header></div>`;
    return `<div class="wrap page narrow">${intro}<p class="page-intro">${auth.configured?"Yönetici parolasıyla giriş yapın.":"Sunucuda yönetici parolası ayarlayın."}</p></div></div></header>${auth.configured?'<form class="form" id="admin-login" method="post"><label>Yönetici parolası<input name="password" type="password" autocomplete="current-password" required maxlength="240"></label><button type="submit" class="btn primary">Giriş Yap</button><p role="status" class="form-message"></p></form>':'<p class="fine">Kurulum adımları KURULUM.md dosyasındadır.</p>'}</div>`;
  }
  const title=adminTabs[path];
  return `<div class="wrap admin-layout"><aside class="admin-sidebar"><p class="eyebrow">Mağaza yönetimi</p><nav aria-label="Yönetim">${Object.entries(adminTabs).map(([url,name])=>`<a href="${url}"${path===url?' aria-current="page"':""}>${name}</a>`).join("")}</nav><a href="/">Mağazayı aç</a>${auth.local?'<button type="button" class="text-button" id="admin-logout">Çıkış yap</button>':""}</aside>
    <section class="admin-main"><header class="admin-head"><p class="eyebrow">Yönetim paneli</p><h1>${h(title)}</h1></header><p class="form-message" id="admin-status" role="status"></p><div id="admin-view" data-path="${path}"><p>Yükleniyor…</p></div></section></div>`;
}

export function renderPage(path,url,state,auth) {
  let title = "TUFAZ Teknoloji", content, status=200, page="store", admin=false, trail=null, ld=[], description="", canonical=path, indexable=true;
  const origin = url.origin;
  const settings = storefrontSettings(state.settings);
  const category = path.slice(1);
  const parts = path.split("/").slice(1);
  const item = parts.length===2 ? state.products.find(p=>publiclyVisible(p) && p.slug===parts[1] &&
    (p.category===parts[0] || parts[0]==="paketler" && p.category==="yazilim" && p.period!=="once")) : null;
  const take = r => {content=r.html;trail=r.trail;ld=r.ld||[];};
  if (path==="/") {content=home(state);page="home";description="TUFAZ POS: restoran, kafe ve oyun kafeler için adisyon yazılımı, kasa ekipmanı ve DOKUN NFC ürünleri. Paket fiyatları aylık, KDV hariç.";}
  else if (Object.hasOwn(catalogData,category)) {title=catalogData[category][0];description=catalogData[category][1];take(catalog(category,url,state));}
  else if (item) {title=item.name;description=item.brief+" "+item.description.slice(0,110);take(detail(item,state,origin));canonical=productPath(item);indexable=item.status!=="soon";page="product";}
  else if (["/fiyatlar","/paketler"].includes(path)) {
    title="Paketler ve fiyatlar";canonical="/fiyatlar";description="TUFAZ POS adisyon paketleri: aylık, KDV hariç fiyatlar. Ek modüller ve cihazlar teklifle.";
    trail=[["Ana sayfa","/"],["Paketler ve fiyatlar"]];
    const modules=state.products.filter(p=>p.category==="yazilim" && p.period==="once" && publiclyVisible(p));
    content=`<div class="wrap page">${pageHead({trail,eyebrow:"Paketler",title,desc:"İşletme tipinize göre paketi seçin. Fiyatlar aylık ve KDV hariçtir. Paket kapsamı, şube ve cihaz sınırları kurulumdan önce yazılı olarak teyit edilir.",toneName:"yazilim",
      actions:link("/kazanc-hesaplayici","Kazancınızı hesaplayın","btn secondary")})}
    <section class="section">${plansOf(state).length?productGrid(plansOf(state),"h2"):"<p class='empty'>Yayında paket bulunmuyor.</p>"}
      <div class="price-notes"><p><b>Sepette ne görürsünüz?</b> İlk dönem tutarı ve aylık yenileme tutarı ayrı gösterilir. Fiyatı teklifle belirlenen ürünler toplama eklenmez.</p>
      <p><b>Yıllık ödeme</b> ve KDV oranı netleştiğinde bu sayfada yayımlanır.</p><p><b>Ödeme</b> bu sürümde site üzerinden alınmaz; talebinizi gönderdikten sonra kapsam ve tutar sizinle teyit edilir.</p></div></section>
    ${modules.length?`<section class="market-section"><div class="market-heading"><div><p class="eyebrow">Ek modüller</p><h2>Paketin yanına ekleyin</h2><p class="heading-note">Modül fiyatları kapsamınıza göre teklifle bildirilir. Sepete ekleyip paketle birlikte talep edebilirsiniz.</p></div>${link("/yazilim","Tüm yazılım ürünleri")}</div>${productGrid(modules)}</section>`:""}
    <section class="market-section"><div class="market-heading"><div><p class="eyebrow">Sık sorulanlar</p><h2>Fiyat ve ödeme</h2></div></div>${faqHtml(faqs.slice(4).concat(faqs.slice(1,3)))}</section></div>${helpBand()}`;
  }
  else if (path==="/kazanc-hesaplayici") {title="Kazanç hesaplayıcı";description="Kendi sipariş süresi, hata ve maliyet rakamlarınızla varsayımsal kazanç hesabı.";take(roiPage(state));}
  else if (Object.hasOwn(topics,path)) {title=topics[path].name;description=topics[path].desc;take(topicContent(path,state));indexable=topics[path].live;}
  else if (path==="/cozumler") {
    title="İşletmenize göre çözümler";description="Restoran, kafe, oyun kafe ve premium restoranlar için adisyon akışları.";
    trail=[["Ana sayfa","/"],["Çözümler"]];
    content=`<div class="wrap page">${pageHead({trail,eyebrow:"Çözümler",title,desc:"İşletmenize benzeyen örnekten başlayın; ardından ihtiyacınız olan modülü seçin."})}
      <section class="section"><h2 class="list-h">İşletme türüne göre</h2><div class="card-links">${solutionPaths.map(p=>`<a href="${p}"><span><small class="card-q">${h(topics[p].question)}</small><b>${h(topics[p].name)}</b><small>${h(topics[p].desc)}</small></span>${icon("arrow")}</a>`).join("")}</div>
      <h2 class="list-h">İhtiyaca göre</h2><div class="card-links compact">${featurePaths.map(p=>`<a href="${p}"><span><b>${h(topics[p].name)}${topics[p].live?"":' <em class="soon-chip">Yakında</em>'}</b><small>${h(topics[p].question||topics[p].desc)}</small></span>${icon("arrow")}</a>`).join("")}</div></section></div>${helpBand()}`;
  }
  else if (path==="/rehber") {title="Rehber";trail=[["Ana sayfa","/"],["Rehber"]];content=directory(title,"Adisyon sistemi seçmeden ve kurmadan önce en çok sorulanlar.",Object.keys(topics).filter(p=>p.startsWith("/rehber/")).map(p=>[p,topics[p].name,topics[p].desc]),trail,"Rehber");}
  else if (path==="/destek") {title="Destek";trail=[["Ana sayfa","/"],["Destek"]];content=directory(title,"Cihaz, kurulum ve ürün sorularınız için.",[["/kurulum","Kurulum nasıl ilerler?","Cihaz, menü ve masa planı"],["/ankara","Ankara kurulum planı","Yerinde kurulum için ilçenizi iletin"],["/rehber","Rehber","Adisyon, QR ve yazıcı seçimi"],["/iletisim","Talep gönder","Ürün, cihaz veya kurulum sorusu"],["/hesap","Talep referansım","Gönderdiğiniz talebin numarası"]],trail,"Destek");}
  else if (path==="/iletisim") {
    title="İletişim ve teklif";trail=[["Ana sayfa","/"],["İletişim ve teklif"]];
    const requested=state.products.find(p=>p.id===url.searchParams.get("urun") && publiclyVisible(p));
    const {phone,email}=settings;
    content=`<div class="wrap page">${pageHead({trail,eyebrow:"İletişim",title,desc:requested?requested.name+" hakkında sorunuzu iletin. Size e-posta veya telefonla dönüş yapılır.":"Ürün, cihaz uyumu veya kurulum hakkında sorunuzu iletin. Size e-posta veya telefonla dönüş yapılır."})}
    <section class="section contact-grid"><div>${formMarkup("contact",requested?.id,{full:true})}</div>
      <aside class="contact-aside">${requested?`<div class="contact-product">${productCard(requested)}</div>`:""}
        ${email||phone?`<h2>Doğrudan ulaşın</h2>${email?`<p><a class="link" href="mailto:${h(email)}">${h(email)}</a></p>`:""}${phone?`<p><a class="link" href="tel:${h(phone.replace(/[ ()-]/g,""))}">${h(phone)}</a></p>`:""}`:""}
        <h2>Hızlı yanıt için</h2><ul class="tick-list"><li>Masa sayınızı</li><li>Kullandığınız kasa, yazıcı veya POS modelini</li><li>Bulunduğunuz ilçeyi</li></ul></aside></section></div>`;
  }
  else if (path==="/kurumsal") {title="Hakkımızda";trail=[["Ana sayfa","/"],["Hakkımızda"]];content=`<div class="wrap page">${pageHead({trail,eyebrow:"Kurumsal",title:"TUFAZ Teknoloji",desc:"TUFAZ Teknoloji, restoran, kafe ve oyun kafeler için TUFAZ POS adisyon yazılımını, kasa ekipmanını ve DOKUN NFC ürünlerini sunar. İlk kurulum odağımız Ankara’dır."})}
    <section class="section narrow-copy"><p>Satış sitemizde yalnız çalışan ve kurulumunu yapabildiğimiz ürünleri fiyatıyla gösteriyoruz. Henüz doğrulanmamış özellikleri “Yakında” olarak işaretliyor, test etmediğimiz bir cihaz için uyumluluk iddiasında bulunmuyoruz.</p>
    <div class="inline-actions">${link("/iletisim","İletişim","btn primary")}${link("/kurulum","Kurulum süreci","btn secondary")}</div></section></div>`;}
  else if (path==="/sepet" || path==="/odeme") {title=path==="/sepet"?"Sepet":"Talep bilgileri";take(shopRequest(path==="/sepet"?"cart":"checkout"));indexable=false;}
  else if (path==="/siparis/sonuc" || path==="/hesap") {title="Talep referansı";indexable=false;trail=[["Ana sayfa","/"],["Talep referansı"]];content=`<div class="wrap page">${pageHead({trail,eyebrow:"Mağaza",title,desc:"Talebinizi aldık. Referans numaranızı not edin; size e-posta veya telefonla dönüş yapılır.",extra:checkoutSteps(2)})}
    <section class="section narrow-copy"><p class="reference" id="request-reference" role="status"></p><p class="fine">Referans numarası bir ödeme veya abonelik numarası değildir.</p><div class="inline-actions">${link("/magaza","Mağazaya dön","btn secondary")}${link("/destek","Destek","btn secondary")}</div></section></div>`;}
  else if (Object.hasOwn(policy,path)) {title=policy[path][0];trail=[["Ana sayfa","/"],["Kurumsal","/kurumsal"],[title]];content=`<div class="wrap page">${pageHead({trail,eyebrow:"Mağaza bilgileri",title})}<section class="section narrow-copy"><p>${h(policy[path][1])}</p>${link("/iletisim","Sorunuz mu var? Bize yazın")}</section></div>`;}
  else if (Object.hasOwn(adminTabs,path)) {title=adminTabs[path];content=adminPage(path,auth);page="admin";admin=true;indexable=false;}
  else {status=404;indexable=false;title="Sayfa bulunamadı";content=`<div class="wrap page">${pageHead({eyebrow:"404",title,desc:"Adres değişmiş veya ürün yayından kaldırılmış olabilir."})}<section class="section"><div class="inline-actions">${link("/","Ana sayfaya dön","btn primary")}${link("/magaza","Mağazaya git","btn secondary")}</div></section></div>`;}
  const robots = settings.indexing && indexable ? "index,follow" : settings.indexing ? "noindex,follow" : "noindex,nofollow";
  if (trail) ld = [breadcrumbLd(trail,origin),...ld];
  if (path==="/") ld.push({"@context":"https://schema.org","@type":"Organization",name:"TUFAZ Teknoloji",url:origin+"/",logo:origin+"/assets/tufaz-logo-mark.png",
    ...(settings.email?{email:settings.email}:{}),...(settings.phone?{telephone:settings.phone}:{})});
  return {status,html:base(title,content,{page,admin,path,description,robots,canonical:status===200&&!admin?canonical:"",origin,ld,settings})};
}
