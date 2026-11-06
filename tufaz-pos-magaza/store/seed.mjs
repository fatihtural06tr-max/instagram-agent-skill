export const categories = {
  yazilim: "Yazılım", donanim: "Donanım", nfc: "NFC", hizmet: "Kurulum ve hizmet"
};

export const SEED_VERSION = 2;

function product(slug, sku, category, name, brief, description, image, price = null, extra = {}) {
  return { id: slug, slug, sku, category, name, brief, description, image: "/assets/" + image + ".svg", alt: name + " örnek görseli",
    price, period: price === null ? "once" : "monthly", vat: null, stock: null, status: price === null ? "quote" : "active",
    featured: false, subcategory: category === "yazilim" ? (price === null ? "Modüller" : "Adisyon paketleri") : "", compatibility: "", warranty: "", ...extra };
}

const storefrontCopy = {
  heroTitle:"Restoran ve kafe teknolojileri",
  heroText:"Adisyon yazılımı, kasa ekipmanı ve NFC ürünleri. Masada alınan sipariş mutfağa, hesap kasaya aynı adisyondan gider.",
};

export function storefrontSettings(settings = {}) {
  const {heroTitle,heroText} = settings;
  const oldDescriptions = ["Siparişi masada alın. Mutfak hazırlasın. Hesabı kasada kapatın.","Garson siparişi alır, mutfak görür, kasa hesabı kapatır.",
    "Adisyon yazılımı, kasa ekipmanı ve dijital menü ürünlerini aynı mağazada inceleyin."];
  return {
    email:"", phone:"", notice:"", indexing:false,
    ...settings,
    heroTitle:!heroTitle || heroTitle==="Restoran ve kafe adisyonu"?storefrontCopy.heroTitle:heroTitle,
    heroText:!heroText || oldDescriptions.includes(heroText)?storefrontCopy.heroText:heroText,
    indexing:settings.indexing === true,
  };
}

// İkinci sürümde eklenen ürünler. Mevcut veritabanına yalnız kimliği hiç bulunmayanlar eklenir.
function secondWave() {
  return [
    product("garson-uygulamasi", "MOD-GRS", "yazilim", "TUFAZ Garson", "Masa başında siparişi telefondan girin.", "Garson siparişi masada telefon veya el terminalinden girer, sipariş adisyona ve ilgili mutfak ekranına iletilir. Desteklenen cihaz modelleri kurulumdan önce teyit edilir.", "el-cihazi"),
    product("qr-siparis", "MOD-QRS", "yazilim", "QR Sipariş", "Misafir menüden seçer, sipariş masaya işlenir.", "Misafir masadaki kodu okutur, ürünleri seçip siparişi gönderir. Sipariş işletmenin ayarına göre onaya düşer veya doğrudan adisyona girer. Düz QR Menü’den ayrı bir üründür.", "qr"),
    product("yemek-platformu", "MOD-PLT", "yazilim", "Yemek platformu entegrasyonu", "Platform siparişlerini kasaya aktarma planı.", "Her platform için iş ortaklığı ve erişim onayı doğrulandıktan sonra açılır. Ön kayıt bırakırsanız kullandığınız platformlara göre size dönüş yapılır.", "kitchen", null, {status:"soon"}),
    product("qr-nfc-masa-kiti", "NFC-KIT", "nfc", "QR + NFC masa kiti", "Masa başına QR kod ve NFC etiketi bir arada.", "Her masa için QR kodu ve NFC etiketi hazırlanır. Bağlantılar teslimden önce test edilir. Adet, baskı ve bağlantılar siparişte belirlenir.", "nfc"),
    product("nfc-wifi-karti", "NFC-WIFI", "nfc", "DOKUN Wi-Fi kartı", "Telefonu yaklaştırınca Wi-Fi bilgisi açılır.", "Misafir kartı okutur, ağ bilgisi telefonda açılır. Telefon modeline göre doğrudan bağlanma veya bilgi ekranı görünür.", "nfc"),
    product("egitim", "HZM-EGT", "hizmet", "Personel eğitimi", "Garson, kasa ve mutfak için uygulamalı eğitim.", "Açılıştan önce ekibinizle örnek bir vardiya üzerinden eğitim yapılır. Süre ve kapsam işletmenize göre belirlenir.", "pos"),
  ];
}

export function initialState() {
  return {
    seedVersion: SEED_VERSION,
    products: [
      product("kafe", "POS-KAFE", "yazilim", "Ana Adisyon / Kafe", "Masalar, siparişler ve kasa.", "Masa açma, ek sipariş alma ve hesabı kapatma akışını aynı adisyonda takip edin.", "pos", 249900, {featured:true}),
      product("restoran", "POS-REST", "yazilim", "Restoran", "Salon, mutfak ve kasa.", "Garsonun aldığı siparişi mutfağa iletme ve masanın hesabını kasada kapatma akışı.", "kitchen", 299900, {featured:true}),
      product("eglence", "POS-EGL", "yazilim", "Eğlence", "Oyun kafeleri ve sosyal mekânlar.", "Oyun kafe ve eğlence mekânlarının servis düzenine göre adisyon paketi. Play ve oyun modülü kapsamı ayrıca teyit edilir.", "play", 399000, {featured:true}),
      product("pro", "POS-PRO", "yazilim", "Pro", "Daha geniş kurulum kapsamı.", "Daha fazla cihaz, şube veya operasyon ihtiyacı olan işletmeler için paket seçeneği. Şube ve cihaz sınırları kurulumdan önce teyit edilir.", "pos", 499000, {featured:true}),
      product("qr-menu", "MOD-QR", "yazilim", "QR Menü", "Masadaki koddan açılan menü.", "Ürünleri ve fiyatları telefondan gösterin. Masadan sipariş ve ödeme ayrı değerlendirilir.", "qr"),
      product("mutfak-ekrani", "MOD-KDS", "yazilim", "Mutfak ekranı", "Sıradaki siparişler tek ekranda.", "Sıcak mutfak ve içecek istasyonu gibi hazırlık noktalarında sıradaki ürünleri görün.", "kitchen"),
      product("bas-konus", "MOD-SES", "yazilim", "Bas-Konuş", "Sesle sipariş girme.", "Garson masa, ürün ve adedi söyler. Siparişi önizlemede kontrol edip onaylayınca adisyona ve ilgili mutfak ekranına gider.", "voice"),
      product("stok-recete", "MOD-STOK", "yazilim", "Stok ve reçete", "Malzeme miktarını ve maliyeti görün.", "Bir ürünün reçetesindeki malzemeleri tanımlayıp satışın stoğa etkisini takip edin.", "kitchen"),
      product("patron", "MOD-PATRON", "yazilim", "TUFAZ Patron", "Vardiya ve satış özeti.", "Yetkili işletme sahibinin vardiya ve tahsilat özetini görebileceği yönetim ekranı.", "pos"),
      product("tedarik", "MOD-TED", "yazilim", "TUFAZ Tedarik", "Mal kabul ve depo hareketleri.", "Sipariş edilen ve teslim alınan miktarı karşılaştırın, depo hareketini kayda alın.", "kitchen"),
      product("play", "MOD-PLAY", "yazilim", "TUFAZ Play", "Oyun masasından menüye geçiş.", "Planlanan akışta 101 Okey oturumu masaya bağlanır, oyun içinden alınan sipariş adisyona iletilir.", "play", null, {status:"soon"}),
      product("rezervasyon", "MOD-REZ", "yazilim", "Rezervasyon", "Masa, saat ve ön sipariş.", "Misafirin geliş saatini ve varsa ön siparişini takip edin. Depozito, iade ve servis kapsamı ayrı belirlenir.", "qr"),
      product("online-siparis", "MOD-SIP", "yazilim", "Kendi sipariş bağlantınız", "Gel-al ve teslimat için işletme bağlantısı.", "Müşteri menünüzden siparişini iletir. Dış yemek platformları için uyumluluk ve yetki ayrı doğrulanır.", "qr"),
      product("masadan-odeme", "MOD-ODE", "yazilim", "Masadan ödeme", "Misafir hesabı telefonundan görür.", "Tahsilat işletmenin kendi yetkili ödeme hesabına yapılır. Kısmi ödeme ve mutabakat, sağlayıcı doğrulamasından sonra açılır.", "qr", null, {status:"soon"}),
      product("kiosk", "MOD-KSK", "yazilim", "Kiosk ve ikinci ekran", "Sipariş ve hazırlık numarası.", "Kiosk müşterinin sipariş vermesini, ikinci ekran kasadaki sepeti ve toplamı görmesini sağlar.", "terminal"),
      product("sadakat", "MOD-CRM", "yazilim", "Sadakat ve CRM", "Puan, kupon ve tekrar ziyaret.", "Geçerli puan ve kuponları işletme bazında takip edin.", "qr"),
      product("cok-sube", "MOD-SUBE", "yazilim", "Çok şube yönetimi", "Şubeleri ayrı takip edin.", "Fiyat, rapor ve kullanıcı yetkilerini şube bazında yönetin.", "pos"),
      product("termal-fis-yazici", "DNM-FIS", "donanim", "Termal fiş yazıcı", "Kasada veya mutfakta adisyon çıktısı.", "Yazıcı modeli, kâğıt genişliği ve bağlantı türü seçilecek cihaza göre belirlenir.", "printer", null, {featured:true, subcategory:"Yazıcılar", compatibility:"USB veya ağ bağlantısı model bazında doğrulanır."}),
      product("pos-terminali", "DNM-TERM", "donanim", "Dokunmatik POS terminali", "Kasa tezgâhı için dokunmatik ekran.", "Mevcut yazıcı, çekmece ve ödeme cihazıyla birlikte kurulum kapsamı belirlenir.", "terminal", null, {featured:true, subcategory:"Kasa ve ekranlar"}),
      product("yazarkasa-pos", "DNM-OKC", "donanim", "Yeni nesil yazarkasa POS", "Model ve yetkili kurulum kontrolü.", "ÖKC uyumluluğu cihaz ve yazılım sürümüne göre doğrulanır. Satış ve aktivasyon için yetkili süreç uygulanır.", "odeme-terminali", null, {subcategory:"Kasa ve ekranlar"}),
      product("barkod-okuyucu", "DNM-BRK", "donanim", "Barkod okuyucu", "Kasada ürün tanıma.", "Bağlantı ve barkod türü kasa kurulumuyla birlikte kontrol edilir.", "scanner", null, {subcategory:"Okuyucular"}),
      product("kasa-cekmece", "DNM-CKM", "donanim", "Kasa çekmecesi", "Nakit tahsilat için çekmece.", "Açma bağlantısı, fiş yazıcısı ve kasa düzeniyle eşleştirilir.", "nakit-cekmecesi", null, {subcategory:"Kasa ve ekranlar"}),
      product("garson-terminali", "DNM-GRS", "donanim", "Garson el terminali", "Masadan sipariş girişi için el cihazı.", "Ekran, pil ve kablosuz ağ uyumu işletme koşullarına göre değerlendirilir.", "el-cihazi", null, {subcategory:"El terminalleri"}),
      product("musteri-ekrani", "DNM-EKR", "donanim", "Müşteri ekranı", "Kasadaki toplamı müşteriye gösterin.", "Kasadan ayrı ekran kurulumu, bağlantı ve ekran modeli kontrolünden sonra planlanır.", "kasa-musteri-ekrani", null, {subcategory:"Kasa ve ekranlar"}),
      product("google-yorum-karti", "NFC-YRM", "nfc", "DOKUN Google yorum kartı", "Telefonu yaklaştırınca yorum bağlantısı açılır.", "Kart kişiselleştirilir ve hedef bağlantı teslimden önce kontrol edilir. Yorum yazılması garanti edilmez, yorum karşılığı ödül verilmez.", "nfc", null, {featured:true}),
      product("masa-standi", "NFC-STD", "nfc", "DOKUN NFC masa standı", "Menü bağlantısını masaya taşıyın.", "Masa standına NFC bağlantısı ve uygun baskıda QR yedeği eklenebilir.", "nfc"),
      product("nfc-sosyal-kart", "NFC-SOS", "nfc", "DOKUN sosyal bağlantı kartı", "Instagram, WhatsApp veya dijital kartvizit.", "Kullanılacak bağlantı hazırlık öncesi belirlenir. Özel baskı, adet ve teslimat teklife bağlıdır.", "nfc"),
      product("isletme-kurulumu", "HZM-KRL", "hizmet", "İşletme kurulumu", "Cihaz, masa düzeni ve menü hazırlığı.", "Uyumlu cihazlar, menü aktarımı, masa düzeni ve örnek servis akışıyla kurulum kapsamı belirlenir.", "terminal"),
      ...secondWave(),
    ],
    coupons: [], requests: [], audit: [],
    settings: { ...storefrontCopy, email:"", phone:"", notice:"", indexing:false },
  };
}

// Kayıtlı mağazayı yeni sürüme taşır. Admin tarafından düzenlenmiş ürünlere dokunmaz.
export function migrateState(state) {
  if ((state.seedVersion || 1) >= SEED_VERSION) return false;
  const known = new Set(state.products.map(p => p.id));
  const usedSku = new Set(state.products.map(p => p.sku));
  const room = Math.max(0, 120 - state.products.length);
  const additions = secondWave().filter(p => !known.has(p.id) && !usedSku.has(p.sku)).slice(0, room);
  state.products.push(...additions);
  state.seedVersion = SEED_VERSION;
  return true;
}
