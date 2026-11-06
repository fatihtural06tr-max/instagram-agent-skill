# TUFAZ Teknoloji mağazası ve yönetim paneli

Bu paket aynı sunucuda çalışan mağazayı, yönetim panelini ve tüm görselleri içerir. Node.js 24 LTS ile doğrulandı. Yerel sürüm ek paket kurmadan çalışır.

## Yerelde çalıştırma

1. ZIP’i bir klasöre çıkarın ve terminali bu klasörde açın.
2. `node portable/server.mjs` komutunu çalıştırın. Windows’ta `BASLAT.cmd` dosyasını da kullanabilirsiniz.
3. Mağaza için `http://127.0.0.1:4173`, yönetim için `http://127.0.0.1:4173/admin` adresini açın.
4. İlk açılışta oluşan `data` klasörüne `admin-password.txt` adında bir dosya ekleyin ve içine kendi belirlediğiniz en az 12 karakterli güçlü parolayı yazın. Sunucuyu durdurup yeniden başlatın. Parolayı ortamda `TUFAZ_ADMIN_PASSWORD` ile vermek de mümkündür.

Portu değiştirmek için `node portable/server.mjs --port 4180` komutunu kullanın. Sunucu varsayılan olarak yalnızca çalıştığı cihazda erişilebilir.

## Yönetim

- **Ürünler** bölümünden ad, ürün kodu, kategori, alt kategori, kısa ve uzun açıklama, görsel, KDV, fiyat dönemi, stok, uyumluluk ve garanti/teslim bilgisi girilir. Yeni bir alt kategori adı yazdığınızda katalogda filtre olarak görünür. PNG, JPEG ve WebP yüklemeleri en fazla 1,5 MB olabilir.
- **Yayın durumu** yayında, teklif, yakında veya taslak olarak seçilir. Sepete açık ürün için fiyat gerekir. Fiyatı kesinleşmeyen ürün teklif olarak yayınlanabilir. Taslaklar mağazada görünmez.
- **Kuponlar** bölümünde yüzde veya tutar indirimi, kategori, alt sepet tutarı, en yüksek indirim, başlangıç ve bitiş ile kullanım kotası tanımlanır. İndirim ilk döneme uygulanır. Kota, onaylanan talepler üzerinden sayılır. Sepet fiyat ve kupon uygunluğunu sunucudan hesaplar.
- **Talepler** bölümünde ürün teklifi, kurulum ve sepet talepleri incelenir. Talep referansı bir ödeme veya abonelik numarası değildir.
- **Mağaza ayarları** ana sayfa başlığı ve kısa metni, duyuru ve iletişim bilgilerini düzenler. **İşlem geçmişi** son 100 yönetim ve talep hareketini gösterir.

## Veri ve yedek

Veriler `data/tufaz.sqlite`, yüklenen görseller `data/media` içindedir. İkisini birlikte yedekleyin. Basit dosya yedeği almadan önce sunucuyu durdurun. Yönetici parola dosyasını dağıtılan ZIP’e eklemeyin. `TUFAZ_DATA_DIR` ile veri konumunu değiştirebilirsiniz.

Bir VPS’te ters vekil ve HTTPS kullanın. Sunucuyu dışarıya doğrudan açmak yerine vekili loopback portuna bağlayın ve `TUFAZ_ORIGIN` değerini siteye erişilecek HTTPS kökeni olarak tanımlayın. Veri klasörünü web kökünün dışında tutun.

## Bu sürümün kapsamı

Katalog, ürün detayları, fiyatlar, sepet, kupon, ödeme özeti, talep formu ve yönetim paneli çalışır. İlk dört paket önceki plandaki çalışma fiyatlarıyla başlar. Donanım ve ayrı modüllerde teyitsiz fiyat gösterilmez. Vitrin görselleri ve ürün çizimleri temsilidir.

Canlı sanal POS, otomatik abonelik tahsilatı, lisans aktivasyonu ve kargo entegrasyonu için sağlayıcı ve operasyon bilgileri ayrıca gerekir. Bu sürüm kart bilgisi almaz. Satış metinleri ve indeksleme, mağazanın gerçek satış koşulları kesinleştiğinde yayına hazırlanmalıdır.

## Doğrulama

`node --test tests/shop.test.mjs` komutu ayrı bir geçici veritabanıyla ürün, görsel, kupon, sepet, talep, yönetici erişimi ve veri kalıcılığını sınar.
