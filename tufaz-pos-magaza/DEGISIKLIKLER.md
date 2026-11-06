# TUFAZ POS Mağaza — Sürüm 2.1.0: tema birliği

Tarih: 6 Kasım 2026. 2.0.0 sonrası geri bildirim: “Hâlâ tema uyumsuzluğu var, her şey birbiriyle uyumlu olsun.”

## Sorunun kaynağı (ölçüldü)

Sitede dört ayrı renk dünyası vardı:

| Parça | 2.0.0’daki renk | Logo ve arayüzle ilişkisi |
|---|---|---|
| 14 ürün çizimi (SVG) | Deniz yeşili / mint (`#142e3c`, `#285d60`, `#b9f0d8`) | Logoda ve arayüzde yeşil yok |
| Vitrin slaytları | Lacivert, buz mavisi, lime: her slayt ayrı zemin | Slayt değişince sayfanın teması değişiyordu |
| Kategori kartları ve sayfa başlıkları | Lavanta, buz mavisi, lime, bej: dört ayrı pastel | Her kategori ayrı tema gibi duruyordu |
| Fotoğraflar | Gök mavisi zemin, lime zemin, turuncu ahşap restoran | Sıcak ahşap tonu tamamen dışarıdaydı |
| Koyu mod | Yoktu | Telefon koyu moddayken tarayıcı siteyi kendi başına koyulaştırıp renkleri bozabiliyordu |

## Yapılan

- **Tek palet:** logo laciverti (`#081a3b`), marka mavisi (`#2a46d6`), açık mavi-gri yüzeyler ve tek vurgu rengi lime (`#d4f56b`). CSS’teki bütün renkler token’lardan geliyor; token dışında sabit renk yok (yalnız mavi/lacivert üstündeki beyaz yazı).
- **Tek kural:** Lacivert kartlar her sayfayı çerçeveliyor (vitrin, tüm iç sayfa başlıkları, ürün görsel çerçevesi, kurulum bandı, hesap sonucu, alt bilgi). Lacivert üstünde ana düğme lime, açık zeminde marka mavisi.
- **Vitrin:** Üç slayt da aynı lacivert kart. Görsel sağda, aynı köşe yarıçapında bir çerçevede. Slayt değişince yalnız içerik değişiyor, tema değil.
- **Kategoriler ve ürün kartları:** Dört pastel kaldırıldı. Hepsi aynı beyaz kart, görsel alanı aynı açık mavi-gri.
- **Görseller yeniden boyandı:** 14 SVG’de yeşil/mint tonları marka mavisine taşındı. Vitrin fotoğrafındaki nane yeşili vurgular lime’a çevrildi (sitedeki vurgu rengiyle aynı). Cihaz ve NFC fotoğraflarının zeminleri açık mavi-griye, restoran fotoğrafı lacivert-mavi üç tona alındı. Favicon’daki teal çatı lime oldu.
- **Açık ve koyu tema:** Aynı kurallarla iki tema. Telefonun ayarını izler; menünün altında ve alt bilgide **Sistem / Açık / Koyu** seçimi var (seçim yalnız o tarayıcıda saklanır, ilk çizimden önce uygulanır, sayfa geçişinde yanıp sönme olmaz). `color-scheme` bildirildiği için tarayıcılar siteyi kendi başına koyulaştırmaz. Koyu temada logo açık sürüme geçer, açık zeminli ürün görselleri hafifçe kısılır.
- Sürüm parametresi 2.1.0’a çıktı; tarayıcılar eski CSS’i önbellekten getirmez. `/favicon.ico` isteği artık 404 sayfası yerine simgeye yönlenir.

## Doğrulama

- Testler: 2/2 geçti. Yeni kontroller: `color-scheme` etiketi, görünüm seçici, koyu logo, koyu tema CSS’i, bölüm bazlı renk sınıflarının kalmadığı, theme.js ve favicon yönlendirmesi.
- Açık ve koyu temada 1366 px ve 390 px’te 5 sayfa: konsol hatası yok, yatay taşma yok.
- Görünüm seçici: Koyu seçildi → başka sayfaya geçildi → koyu kaldı → Sistem’e dönüldü.
- Sepetten talebe uçtan uca akış, yönetim paneli, 82 sayfalık metin denetimi ve bağlantı taraması yeniden geçti.

---

# TUFAZ POS Mağaza — Sürüm 2.0.0 değişiklikleri

Tarih: 6 Kasım 2026. Önceki sürüm: 1.2.0 (Sitess.zip).

## 1. İstenen değişiklikler

| İstek | Yapılan |
|---|---|
| Sepete Ekle tüm ürünlerde olmalı | Yayındaki 34 ürünün hepsinde (kartta, ürün sayfasında, mobil yapışkan çubukta) **Sepete Ekle** var. Sepet üç gruba ayrılır: fiyatı belli ürünler, **Teklif ile fiyatlanacaklar** ve **Ön kayıt** (Yakında). Fiyatsız ürün hiçbir yerde 0 TL sayılmaz, toplama girmez. |
| Sayfalar birbirinden bağımsız durmamalı | Her iç sayfa aynı başlık kartıyla açılır (konum yolu + başlık + açıklama). Ürün sayfası → “Nasıl çalışır?” rehberi → rehber sayfası → ilgili ürün kartları (Sepete Ekle ile) → komşu sayfalar zinciri kuruldu. Önceden hiçbir sayfadan bağlantı almayan 12 rehber/çözüm sayfası artık menüden, alt bilgiden, ürün sayfalarından ve /cozumler sayfasından erişilebilir. |
| En üst banner gövdeyle uyumsuz | Header artık sayfa zeminiyle aynı renkte, kaydırırken sabit ve yarı saydam. Vitrin tam genişlik lacivert şerit yerine gövdedeki kartlarla aynı genişlik ve köşe yarıçapında bir kart oldu. Kategori renkleri (yazılım mavi, donanım buz mavisi, NFC açık yeşil, hizmet bej) vitrinde, kategori kartlarında, sayfa başlıklarında ve ürün görsel alanlarında aynı. |
| Mağaza / Yazılım / ... dizmek yerine hamburger menü | Yatay menü satırı kaldırıldı. Her ekran boyutunda **Menü** düğmesi soldan açılan panel açar (masaüstünde 3 sütun, mobilde tek sütun). Esc ile kapanır, odak panel içinde kalır, arka plana tıklayınca kapanır, açıkken sayfa kaymaz. Menüde arama kutusu ve “Paketleri gör / Teklif iste” düğmeleri var. |
| Master prompta uygun devam | Aşağıdaki 3. bölüme bakın. |

## 2. Bulunan ve düzeltilen hatalar

1. **Yetim sayfalar:** Ana sayfadan başlayan taramada /mutfak-ekrani, /stok-recete, /patron, /tedarik, /kiosk, /sadakat, /cok-sube-yonetimi, /rezervasyon-sistemi, /online-siparis, /masadan-odeme, /play ve /play/101-okey hiçbir sayfadan bağlantı almıyordu (12 sayfa). Yeni sürümde aynı tarama tüm rehber ve çözüm sayfalarına ulaşıyor.
2. **Mobil menü taşması:** 390 px genişlikte “Çözümler” ekran dışına taşıyordu (yatay kaydırma gerekiyordu).
3. **Soluk içerik:** `data-reveal` animasyonu öğeleri %74 opaklıkta duraklatıyordu; ekranda görünmeyen kartlar ve tam sayfa görüntülerde içerik soluk kalıyordu. Animasyon kaldırıldı.
4. **Logo:** 354 KB, 1254×1254 PNG, 105 px’lik kutuya `transform` ile kırpılarak gösteriliyordu. Kenarları kırpılmış 13 KB WebP (header) ve lacivert zemin için açık renkli sürüm (alt bilgi) üretildi.
5. **Çift içerik:** /paketler/kafe ve /yazilim/kafe aynı sayfayı canonical olmadan yayınlıyordu. Canonical eklendi.
6. **Yönetim görsel seçimi:** Ödeme terminali, el terminali, kasa çekmecesi ve müşteri ekranı çizimleri pakette olduğu hâlde yönetim panelinden seçilemiyordu (doğrulama listesinde yoktu).
7. **ChatGPT kalıntısı:** Yönetim giriş sayfasında ve API hatalarında “ChatGPT ile giriş / Bu kurulum ChatGPT oturumu kullanır” metinleri kalmıştı. Kaldırıldı.
8. **Yönetim bağlantısı herkese açıktı:** Alt bilgideki “Yönetim” bağlantısı kaldırıldı (panel /admin adresinde, parola korumalı).
9. **Statik dosyalar önbelleksiz ve sıkıştırmasızdı.** Sürüm parametreli dosyalara 30 günlük önbellek, metin yanıtlarına gzip eklendi.
10. **Kullanılmayan görsel:** servis-sahnesi.webp pakette olup hiçbir yerde kullanılmıyordu; “Kurulum ve hizmet” kategori kartında kullanıldı.
11. **Ödeme adımında özet formun altında kalıyordu** (mobil). Sıra: ürünler → tutar özeti → form.
12. **Form alanlarında metin kalın görünüyordu** (etiket kalınlığı kutuya geçiyordu).

## 3. Master prompt kurallarına göre yapılanlar

- **Bas-Konuş** her yerde sesli sipariş girişi olarak anlatılıyor: komut → önizleme → garson onayı → adisyon ve mutfak ekranı. Onaysız komutun adisyona yazılmadığı, gürültüde tanıma hatası olabileceği ve mikrofon yoksa elle girişin sürdüğü yazıyor. Sayfadaki örnek akış “gerçek ses tanıma yapılmaz” etiketli. Testte “telsiz/walkie” geçmediği kontrol ediliyor.
- **Fiyatlar** yalnız 0.8’deki dört paket (2.499 / 2.999 / 3.990 / 4.990 TL, aylık, KDV hariç). Modüllerin taslak fiyatları sitede yok; modüller “Teklif ile”. KDV oranı girilmediği için toplamlar “+ KDV” gösteriliyor.
- **QR Menü, QR Sipariş ve Masadan ödeme ayrı ürün.** Masadan ödeme ve Play/101 Okey “Yakında”; sayfaları arama motoruna kapalı.
- **İlk ekranda iş sonucu:** Ana sayfada vitrinden hemen sonra dört işletme sorusu (“Sipariş mutfağa geç mi gidiyor?” vb.), her biri rehbere ve ürüne bağlı.
- **Kazanç hesaplayıcı** (/kazanc-hesaplayici), 6.3’teki formüllerle çalışıyor: geri kazanılan saat, kapasite değeri (ayrı satırda, “nakit tasarruf değildir”), hata maliyeti azalışı, yalnız kullanıcının girdiği fiili mesai azalışı nakit tasarruf sayılıyor, net ilk yıl etkisi, net aylık katkı ≤ 0 ise “Hesaplanamaz”. 35.000 / 420.000 TL örneği vaat değil açıklama olarak geçiyor.
- **Ürün sayfası şablonu (9.1–9.2):** satın alma türü (aylık abonelik / modül / fiziksel cihaz / NFC / hizmet), fiyat, yenileme, KDV, stok, teslim ve aktivasyon, uyumluluk, garanti, ürün kodu.
- **Sepet (9.3):** ilk dönem toplamı ile aylık yenileme ayrı; teklif ve ön kayıt kalemleri toplam dışı; birden fazla adisyon paketi seçilirse uyarı. Adım göstergesi: Sepet → İşletme bilgileri → Talep referansı.
- **Kısa ihtiyaç keşfi (8.1):** talep formunda işletme türü, telefon, şehir/ilçe (isteğe bağlı).
- **Yeni ürünler:** TUFAZ Garson, QR Sipariş, Yemek platformu entegrasyonu (Yakında), QR + NFC masa kiti, DOKUN Wi-Fi kartı, Personel eğitimi. Mevcut veritabanına yalnız hiç bulunmayanlar otomatik eklenir; yönetici düzenlemelerine dokunulmaz.
- **SEO altyapısı:** canonical, Open Graph, BreadcrumbList, ana sayfada Organization, yalnız fiyatı belli ürünlerde Product/Offer şeması; panelden açılan robots.txt ve sitemap.xml. Varsayılan **kapalı**: satış koşulları ve yasal metinler kesinleşmeden siteyi indekslemeyin.
- **Klişe denetimi:** “dijital dönüşüm”, “bir üst seviye”, “7/24”, “Türkiye’nin bir numarası”, garantili tasarruf/ciro, lorem ve • sembolü 82 sayfada tarandı, bulunmadı.

## 4. Bilinçli olarak yapılmayanlar / sizin kararınız gereken konular

- **“Sepete Ekle her üründe” ile master prompttaki “hazır olmayan ürüne satın alma CTA’sı üretme” kuralı çelişiyor.** Çözüm: düğme her üründe var, ancak bu sürümde sepet bir **talep** olarak gönderiliyor, ödeme alınmıyor; Yakında ürünler sepete “Ön kayıt, ödeme alınmaz” etiketiyle giriyor. Canlı sanal POS açılınca Yakında ürünlerin ödemeye girmemesi gerekir. Bu kural `cartMode` fonksiyonunda hazır.
- **Gerçek ekran görüntüleri, müşteri yorumu, iletişim bilgisi, adres** eklenmedi; elimizde doğrulanmış veri yok. Panelden e-posta/telefon girilince header menüsünde, alt bilgide ve iletişim sayfasında görünür.
- **Anahtar kelime hacmi, rakip analizi, SERP araştırması** bu çalışmada yapılmadı; site metinleri hacim verisine dayanmıyor.
- **Canlı ödeme, abonelik tahsilatı, lisans aktivasyonu, kargo** yok (1.2.0’da da yoktu).
- **Mesafeli satış sözleşmesi ve ön bilgilendirme formu** hukuki inceleme gerektirir; satış koşulları sayfası bunu belirtiyor.

## 5. Doğrulama

- `node --test tests/shop.test.mjs`: 2 test geçti. Eski testlerin hepsi korunarak şunlar eklendi: her karttaki Sepete Ekle, karma sepet hesabı (fiyatlı + teklif + ön kayıt), fiyatsız kalemin 0 TL sayılmaması, yeni talep alanları, Bas-Konuş metni, hamburger menü, canonical, robots/sitemap açma-kapama, veri taşıma.
- Playwright ile 1366 px ve 390 px’te uçtan uca: 5 farklı türde ürün sepete eklendi → adet artırıldı → talep formu dolduruldu → referans numarası alındı → sepet boşaldı. Tarayıcı konsolunda hata yok, yatay taşma yok.
- Yönetim paneli: giriş, talep detayı (yeni alanlar ve teklif/ön kayıt satırları), ayarlar, ürün kaydetme denendi.
