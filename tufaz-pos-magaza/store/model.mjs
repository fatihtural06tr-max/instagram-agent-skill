import {categories} from "./seed.mjs";

export class InputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
const fail = (message, status) => { throw new InputError(message, status); };
export const inText = (value, max, label, required = false) => {
  if (value != null && typeof value !== "string") fail(label + " metin olmalı.");
  const text = (value || "").trim();
  if (text.length > max || (required && !text)) fail(label + " alanını kontrol edin.");
  return text;
};
const int = (value, min, max, label, optional = false) => {
  if (optional && value == null) return null;
  if (!Number.isInteger(value) || value < min || value > max) fail(label + " değerini kontrol edin.");
  return value;
};
export const validEmail = s => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s);
export const slugFor = s => s.toLocaleLowerCase("tr").replaceAll("ı","i").normalize("NFD")
  .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,65);
export const productPath = p => "/" + p.category + "/" + p.slug;
export const publiclyVisible = p => p.status !== "draft";
export const addable = p => p.status === "active" && p.price !== null && p.stock !== 0;
const formats = new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",minimumFractionDigits:0,maximumFractionDigits:2});
export const priceText = cents => formats.format(cents / 100).replace("₺","").trim() + " TL";
export const periodText = {once:"Tek seferlik",monthly:"Aylık",yearly:"Yıllık"};
export const discountCode = s => inText(s, 32, "Kupon kodu").toUpperCase();
export const imagePath = /^(?:\/assets\/(?:pos|terminal|printer|scanner|play|qr|voice|kitchen|nfc)\.svg|\/media\/[0-9a-f-]{36}\.(?:webp|png|jpg))$/;
const addEvent = (state, action, subject) => {
  state.audit = [{at:new Date().toISOString(), action, subject}, ...state.audit].slice(0, 100);
};

function validateProduct(input, old) {
  const name = inText(input.name, 85, "Ürün adı", true);
  const sku = inText(input.sku, 40, "Ürün kodu", true).toUpperCase();
  const slug = slugFor(inText(input.slug, 85, "Adres adı") || name);
  if (!slug || !/^[A-Z0-9._-]+$/.test(sku)) fail("Ürün kodu veya adres adı geçersiz.");
  if (!Object.hasOwn(categories, input.category)) fail("Ürün kategorisi geçersiz.");
  if (!Object.hasOwn(periodText, input.period)) fail("Fiyat dönemi geçersiz.");
  if (!["active","quote","soon","draft"].includes(input.status)) fail("Yayın durumu geçersiz.");
  const price = int(input.price, 1, 500000000, "Fiyat", true);
  if (input.status === "active" && price === null) fail("Sepete açık ürün için fiyat girin. Fiyatsız ürünü teklif durumuna alın.");
  const image = inText(input.image, 100, "Görsel");
  if (image && !imagePath.test(image)) fail("Görsel adresi geçersiz.");
  return {
    id: old?.id || crypto.randomUUID(), name, sku, slug, category:input.category,
    brief:inText(input.brief,120,"Kısa açıklama",true), description:inText(input.description,1800,"Açıklama",true),
    subcategory:inText(input.subcategory,50,"Alt kategori"), image, alt:inText(input.alt,120,"Görsel açıklaması") || name,
    price, period:input.period, vat:int(input.vat,0,100,"KDV",true), stock:int(input.stock,0,99999,"Stok",true),
    status:input.status, featured:input.featured === true,
    compatibility:inText(input.compatibility,360,"Uyumluluk"), warranty:inText(input.warranty,240,"Garanti veya teslim bilgisi"),
  };
}
function validateCoupon(input, old) {
  const code = discountCode(input.code);
  if (!/^[A-Z0-9][A-Z0-9_-]{2,23}$/.test(code)) fail("Kupon kodu 3–24 karakter olmalı. A–Z, rakam, tire ve alt çizgi kullanın.");
  if (!["percent","fixed"].includes(input.type)) fail("İndirim türünü seçin.");
  const value = int(input.value,1,input.type === "percent" ? 100 : 500000000,"İndirim");
  const minimum = int(input.minimum,0,500000000,"En az sepet tutarı",true);
  const maximum = int(input.maximum,1,500000000,"En yüksek indirim",true);
  if (input.category !== "" && !Object.hasOwn(categories,input.category)) fail("Kupon kategorisi geçersiz.");
  const date = (s,label) => {
    if (!s) return null;
    if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(s) || !Number.isFinite(Date.parse(s))) fail(label + " geçersiz.");
    return s;
  };
  const start = date(input.start, "Başlangıç tarihi"), end = date(input.end, "Bitiş tarihi");
  if (start && end && end <= start) fail("Bitiş başlangıçtan sonra olmalı.");
  return {id:old?.id || crypto.randomUUID(),code,type:input.type,value,minimum,maximum,
    category:input.category, start,end, limit:int(input.limit,1,10000,"Kullanım sınırı",true), active:input.active === true};
}

function couponFor(state, code, lines, total, now) {
  const coupon = state.coupons.find(c => c.code === code && c.active);
  if (!coupon || coupon.start && Date.parse(coupon.start) > now || coupon.end && Date.parse(coupon.end) <= now) {
    fail("Kupon geçersiz veya kullanım süresi dışında.");
  }
  const used = state.requests.filter(r => r.status === "approved" && r.couponId === coupon.id).length;
  if (coupon.limit !== null && used >= coupon.limit) fail("Kupon kullanım sınırına ulaştı.");
  if (total < (coupon.minimum || 0)) fail("Kupon için sepet en az " + priceText(coupon.minimum) + " olmalı.");
  const eligible = lines.filter(l => !coupon.category || l.category === coupon.category).reduce((a,l)=>a+l.amount,0);
  if (eligible === 0) fail("Kupon bu sepetteki ürünlerde geçerli değil.");
  const value = coupon.type === "percent" ? Math.round(eligible * coupon.value / 100) : coupon.value;
  return {id:coupon.id,code:coupon.code,eligible,category:coupon.category,amount:Math.min(value,eligible,coupon.maximum ?? eligible)};
}

export function quoteCart(state, input, now = Date.now()) {
  if (!Array.isArray(input.items) || input.items.length > 30) fail("Sepeti kontrol edin.");
  const combined = new Map();
  for (const item of input.items) {
    if (!item || typeof item.id !== "string") fail("Ürün seçimini kontrol edin.");
    const quantity = int(item.quantity,1,99,"Adet");
    combined.set(item.id,(combined.get(item.id) || 0) + quantity);
  }
  const lines = [...combined].map(([id,quantity]) => {
    const p = state.products.find(p => p.id === id);
    if (!p || !addable(p)) fail("Sepette satışa kapalı bir ürün var. Ürünü kaldırıp yeniden deneyin.");
    if (quantity > (p.period === "once" ? (p.stock ?? 99) : 1)) fail(p.name + " için seçilen adet uygun değil.");
    return {id:p.id,sku:p.sku,name:p.name,url:productPath(p),category:p.category,period:p.period,
      image:p.image,price:p.price,vatRate:p.vat,quantity,amount:p.price*quantity};
  });
  const subtotal = lines.reduce((a,l)=>a+l.amount,0);
  const code = discountCode(input.coupon);
  const coupon = code ? couponFor(state, code, lines, subtotal, now) : null;
  const discount = coupon?.amount ?? 0;
  const net = subtotal - discount;
  let remainingDiscount = discount;
  let remainingEligible = coupon?.eligible ?? 0;
  let vat = 0;
  for (const line of lines) {
    if (coupon && (!coupon.category || coupon.category === line.category)) {
      const part = Math.min(remainingDiscount, Math.round(line.amount * remainingDiscount / remainingEligible));
      remainingDiscount -= part;
      remainingEligible -= line.amount;
      if (line.vatRate !== null) vat += Math.round((line.amount - part) * line.vatRate / 100);
    } else if (line.vatRate !== null) {
      vat += Math.round(line.amount * line.vatRate / 100);
    }
  }
  const monthly = lines.filter(l=>l.period === "monthly").reduce((a,l)=>a+l.amount,0);
  const yearly = lines.filter(l=>l.period === "yearly").reduce((a,l)=>a+l.amount,0);
  const taxKnown = lines.length > 0 && lines.every(l=>l.vatRate !== null);
  return {lines,subtotal,discount,net,tax:taxKnown ? vat : null,total:taxKnown ? net + vat : null,monthly,yearly,
    coupon:coupon ? {id:coupon.id,code:coupon.code} : null};
}

export function submitRequest(state, input) {
  const key = inText(input.key,36,"İşlem anahtarı",true);
  if (!/^[0-9a-f-]{36}$/.test(key)) fail("İşlem anahtarı geçersiz.");
  const email = inText(input.email,160,"E-posta",true).toLowerCase();
  if (!validEmail(email)) fail("Geçerli bir e-posta adresi girin.");
  const prior = state.requests.find(r=>r.key === key);
  if (prior) {
    if (prior.email !== email) fail("Bu istek anahtarı kullanıldı.",409);
    return {changed:false,data:{reference:prior.reference}};
  }
  if (state.requests.length >= 300) fail("Talep listesi dolu. İşletme ile iletişime geçin.",503);
  let selection = null, subject = "";
  if (input.kind === "cart") {
    selection = quoteCart(state,input);
    if (!selection.lines.length) fail("Sepetinize en az bir ürün ekleyin.");
    subject = "Paket ve ürün talebi";
  } else {
    const item = state.products.find(p=>p.id === input.product && publiclyVisible(p));
    if (input.product && !item) fail("Ürün bulunamadı.",404);
    subject = item?.name || "Genel bilgi ve kurulum";
  }
  const request = {id:crypto.randomUUID(),key,reference:"TFZ-" + crypto.randomUUID().slice(0,12).toUpperCase(),
    email, business:inText(input.business,100,"İşletme adı",true), message:inText(input.message,700,"Not"),
    subject,selection,couponId:selection?.coupon?.id ?? null,status:"new", at:new Date().toISOString()};
  state.requests.unshift(request);
  addEvent(state,"Talep alındı",request.reference);
  return {changed:true,data:{reference:request.reference}};
}

export function updateAdmin(state, input) {
  const action = inText(input.action,35,"İşlem",true);
  const id = inText(input.id,70,"Kayıt kimliği");
  let subject;
  if (action === "save-product") {
    const old = state.products.find(p=>p.id === id);
    if (id && !old) fail("Ürün bulunamadı.",404);
    if (!old && state.products.length >= 120) fail("Katalog sınırına ulaşıldı.");
    const product = validateProduct(input.item || {},old);
    if (state.products.some(p=>p.id !== id && (p.sku === product.sku || p.category === product.category && p.slug === product.slug))) {
      fail("Ürün kodu veya kategori adresi zaten kullanılıyor.",409);
    }
    state.products = old ? state.products.map(p=>p.id === id ? product : p) : [...state.products,product];
    subject = product.name;
  } else if (action === "archive-product") {
    const item = state.products.find(p=>p.id === id);
    if (!item) fail("Ürün bulunamadı.",404);
    item.status = "draft";
    subject = item.name;
  } else if (action === "save-coupon") {
    const old = state.coupons.find(c=>c.id === id);
    if (id && !old) fail("Kupon bulunamadı.",404);
    if (!old && state.coupons.length >= 100) fail("Kupon sınırına ulaşıldı.");
    const coupon = validateCoupon(input.item || {},old);
    if (state.coupons.some(c=>c.id !== id && c.code === coupon.code)) fail("Kupon kodu zaten kullanılıyor.",409);
    state.coupons = old ? state.coupons.map(c=>c.id === id ? coupon : c) : [...state.coupons,coupon];
    subject = coupon.code;
  } else if (action === "disable-coupon") {
    const coupon = state.coupons.find(c=>c.id === id);
    if (!coupon) fail("Kupon bulunamadı.",404);
    coupon.active = false;
    subject = coupon.code;
  } else if (action === "request-status") {
    const request = state.requests.find(r=>r.id === id);
    if (!request) fail("Talep bulunamadı.",404);
    if (!["new","review","approved","closed"].includes(input.status)) fail("Durum geçersiz.");
    if (input.status === "approved" && request.status !== "approved" && request.couponId) {
      const coupon = state.coupons.find(c=>c.id === request.couponId);
      const uses = state.requests.filter(r=>r.status === "approved" && r.couponId === request.couponId).length;
      if (coupon?.limit != null && uses >= coupon.limit) fail("Bu kuponun onaylanan talep sınırı doldu.",409);
    }
    request.status = input.status;
    subject = request.reference;
  } else if (action === "save-settings") {
    const s = input.item || {};
    const email = inText(s.email,160,"E-posta");
    const phone = inText(s.phone,25,"Telefon");
    if (email && !validEmail(email)) fail("Geçerli bir e-posta girin.");
    if (phone && !/^\+?[0-9 ()-]{7,25}$/.test(phone)) fail("Geçerli bir telefon girin.");
    state.settings = {heroTitle:inText(s.heroTitle,60,"Ana başlık",true),heroText:inText(s.heroText,140,"Ana açıklama",true),
      email,phone,notice:inText(s.notice,100,"Duyuru")};
    subject = "Mağaza";
  } else {
    fail("İşlem bulunamadı.",404);
  }
  const names = {"save-product":"Ürün kaydedildi","archive-product":"Ürün taslağa alındı","save-coupon":"Kupon kaydedildi",
    "disable-coupon":"Kupon kapatıldı","request-status":"Talep durumu değişti","save-settings":"Mağaza ayarları kaydedildi"};
  addEvent(state,names[action],subject);
}
