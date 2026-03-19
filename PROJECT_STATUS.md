# Proje Durum Raporu — Supply Chain CorDapp
**Son güncelleme:** 2026-03-19
**Geliştirici:** Onur
**Asistan:** Claude (Sonnet 4.6)

---

## Genel İlerleme

```
MVP v1 — Blockchain Katmanı
─────────────────────────────────────────
[✅] Adım 1  — Proje iskeleti ve Gradle yapılandırması
[✅] Adım 2  — ProductState (blockchain veri modeli)
[✅] Adım 3  — ProductContract (iş kuralları)
[✅] Adım 4  — CreateProductFlow + Responder
[✅] Adım 5  — TransferProductFlow + Responder
[✅] Adım 6  — 4 node deploy edildi (Notary, Manufacturer, Distributor, Retailer)
[✅] Adım 7  — Node'lar başarıyla ayağa kalktı
[⏳] Adım 8  — Corda shell üzerinden uçtan uca demo (disk sorunu çözülünce)

MVP v2 — Web Katmanı
─────────────────────────────────────────
[✅] Adım 9  — Spring Boot backend (clients modülü)
[✅] Adım 10 — REST API (create, transfer, list, getById)
[✅] Adım 11 — RPC bağlantısı NodeRPCConnection
[✅] Adım 12 — Web arayüzü (4 HTML sayfası + CSS)
[✅] Adım 13 — Üç ayrı node profili (manufacturer / distributor / retailer)
[✅] Adım 14 — Başarılı build (bootJar)
[⏳] Adım 15 — Web arayüzü üzerinden uçtan uca demo (disk sorunu çözülünce)

Açık Sorunlar
─────────────────────────────────────────
[❌] Disk alanı yetersiz (%97.6 dolu) → Flow'lar ve web demo bloke
```

---

## MVP v1 — Blockchain Katmanı (Tamamlandı)

### Proje Altyapısı

Projenin tüm build sistemi sıfırdan kuruldu:

- **Gradle 7.6.4** wrapper ayarlandı
- **constants.properties** ile tüm Corda versiyon sabitleri merkezi yönetildi
- `contracts` ve `workflows` modülleri tanımlandı
- `cordaProvided` konfigürasyonu kullanıldı (Corda 4.12 uyumlu)

---

### ProductState — Blockchain Veri Modeli

Corda ledger'ında saklanan ürün kaydı. `LinearState` arayüzünü implement eder, böylece her ürün benzersiz bir ID'ye (`linearId`) sahip olur ve tarihçesi takip edilebilir.

| Alan | Tip | Açıklama |
|------|-----|----------|
| linearId | UniqueIdentifier | Ürünün blockchain kimliği |
| productName | String | Ürün adı |
| serialNumber | String | Seri numarası |
| owner | Party | Mevcut sahip (node kimliği) |
| status | String | `CREATED` veya `TRANSFERRED` |

- Participants listesinde yalnızca `owner` var — yani sadece o anki sahibin vault'unda bu kayıt görünür.

---

### ProductContract — İş Kuralları

Ledger'a yazılacak her işlemin geçerliliğini bu kontrat denetler. İki komut tanımlıdır:

**Create komutu kuralları:**
- Hiç input state olmamalı (ürün sıfırdan yaratılıyor)
- Tam olarak 1 output ProductState olmalı
- `productName` ve `serialNumber` boş olamaz
- `status` değeri `CREATED` olmalı
- Sahibin dijital imzası zorunlu

**Transfer komutu kuralları:**
- 1 input + 1 output ProductState (mevcut kayıt tüketilip yenisi yazılıyor)
- `linearId` değişmemeli (aynı ürün, farklı sahip)
- Sahip mutlaka değişmeli
- Hem eski hem yeni sahip imzalamalı
- `status` değeri `TRANSFERRED` olmalı

---

### Akışlar (Flows)

**CreateProductFlow:**
Manufacturer bu flow'u çalıştırarak ledger'a yeni bir ürün kaydeder. Parametreler: `productName`, `serialNumber`, `owner`. FinalityFlow ile işlem tüm katılımcılara dağıtılır.

**TransferProductFlow:**
Mevcut sahip bu flow'u çalıştırarak ürünü başka bir node'a devreder. Vault'tan ürün sorgulanır, yeni sahibin imzası toplanır (`CollectSignaturesFlow`), ardından işlem finalize edilir.

**CreateProductResponder & TransferProductResponder:**
Karşı taraftaki node'larda çalışan responder flow'lar. Yeni sahip `SignTransactionFlow` ile işlemi imzalar ve `ReceiveFinalityFlow` ile kendi vault'una kaydeder.

---

### Node Ağı

`deployNodes` task'ı ile 4 Corda node'u yapılandırılıp deploy edildi:

| Node | P2P Port | RPC Port | Rol |
|------|----------|----------|-----|
| Notary | 10002 | 10003 | İşlem doğrulayıcı |
| Manufacturer | 10005 | 10006 | Ürün üretici |
| Distributor | 10008 | 10009 | Dağıtıcı |
| Retailer | 10011 | 10012 | Perakendeci |

Node'lar `start-nodes.bat` ile başlatılıyor. Türkçe locale fix (`-Duser.language=en`) bu script'e gömülü.

---

## MVP v2 — Web Katmanı (Tamamlandı)

### Mimari

```
Tarayıcı (HTML/CSS/JS)
       ↓  HTTP
Spring Boot REST API  (port 8081 / 8082 / 8083)
       ↓  Corda RPC
Corda Node  (Manufacturer / Distributor / Retailer)
       ↓
Corda Ledger (blockchain)
```

Her katılımcı için ayrı bir Spring Boot instance çalışır ve kendi Corda node'una RPC ile bağlanır.

---

### Backend — Spring Boot (clients modülü)

`clients/` altında üç katman oluşturuldu:

**NodeRPCConnection.java**
Spring bean olarak ayağa kalkar, `@PostConstruct` ile Corda node'una RPC bağlantısı açar, `@PreDestroy` ile kapatır. Host/port/kullanıcı bilgileri `application.properties`'dan okunur.

**ProductService.java**
Tüm iş mantığı burada. RPC proxy üzerinden:
- `createProduct()` → `CreateProductFlow` başlatır, dönüşte `ProductState`'i DTO'ya çevirir
- `transferProduct()` → `partiesFromName()` ile party lookup yapar, `TransferProductFlow` başlatır
- `getAllProducts()` → `vaultQuery()` ile vault'taki tüm ürünleri listeler
- `getProductById()` → `LinearStateQueryCriteria` ile UUID bazlı sorgu yapar
- `getMyNodeName()` → bağlı node'un kimliğini döner

**ProductController.java**
REST endpoint'leri:

| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/node-info` | Bağlı node adını döner |
| POST | `/api/products` | Yeni ürün oluşturur |
| POST | `/api/products/transfer` | Ürün transferi yapar |
| GET | `/api/products` | Tüm ürünleri listeler |
| GET | `/api/products/{linearId}` | ID'ye göre ürün getirir |

**DTO Sınıfları:**
- `CreateProductRequest` → `{ productName, serialNumber }`
- `TransferProductRequest` → `{ linearId, newOwner }`
- `ProductResponse` → `{ linearId, productName, serialNumber, owner, status }`

---

### Node Profilleri

Her node için ayrı Spring profile:

| Profil | Server Port | Corda RPC Port |
|--------|-------------|----------------|
| manufacturer | 8081 | 10006 |
| distributor | 8082 | 10009 |
| retailer | 8083 | 10012 |

---

### Frontend — Web Arayüzü

`clients/src/main/resources/static/` altında 4 HTML sayfası ve 1 CSS dosyası:

**index.html — Dashboard**
Hangi node'a bağlı olduğunu gösterir (sol üstte node badge). Üç ana işleve hızlı erişim kartları: Ürün oluştur, listele, transfer et.

**products.html — Ürün Listesi**
Vault'taki tüm ürünleri tablo şeklinde gösterir. Status badge'leri var (CREATED=yeşil, TRANSFERRED=mavi). Her satırda Linear ID'yi panoya kopyalayan buton mevcut — transfer sayfasında kullanmak için.

**create-product.html — Ürün Oluşturma**
`productName` ve `serialNumber` alanlarından oluşan form. Submit sonrası başarı kartı açılır, oluşturulan ürünün tüm detaylarını gösterir. Linear ID kopyalanabilir.

**transfer-product.html — Transfer**
Linear ID metin alanı + yeni sahip dropdown (Manufacturer / Distributor / Retailer). Başarı sonrası işlem detaylarını gösterir. URL'den `?linearId=xxx` parametresi de alabilir.

---

### Build ve Çalıştırma

**Build:**
```powershell
./gradlew :clients:build
# Çıktı: clients/build/libs/supply-chain-client.jar
```

**Web app başlatma:**
```powershell
.\start-web.bat manufacturer   # http://localhost:8081
.\start-web.bat distributor    # http://localhost:8082
.\start-web.bat retailer       # http://localhost:8083
```

`start-web.bat` locale fix'ini (`-Duser.language=en -Duser.country=US`) otomatik ekler.

---

## Açık Sorunlar

### Disk Alanı — KRİTİK
**Hata:** `AMQ222212: Disk Full! Blocking message production`
**Durum:** Disk %97.6 dolu (6.1GB boş / 255.4GB). Artemis mesaj broker'ı %90 üzerinde P2P mesajlaşmayı bloke ediyor. Flow'lar çalışamaz, web demo yapılamaz.
**Çözüm:** En az 20GB disk alanı boşaltılmalı. Sonra `start-nodes.bat` ile node'lar yeniden başlatılmalı.

---

## Kritik Teknik Not — Türkçe Locale Hatası

Bu proje Türkçe Windows sisteminde geliştirildi. Corda 4.12'nin AMQP serializer'ı method isimlerini sınıflandırırken `String.toUpperCase()` kullanıyor ancak `Locale` belirtmiyor.

```
Türkçe'de:  "is".toUpperCase() → "İS"  ← MethodClassifier.valueOf("İS") → HATA
İngilizce:  "is".toUpperCase() → "IS"  ← MethodClassifier.IS → DOĞRU
```

**Etkilenen yerler:** Corda node başlatma, RPC bağlantısı, Spring Boot app
**Fix:** Her JVM process'ine `-Duser.language=en -Duser.country=US` ekle
**Uygulanan yerler:** `deploy.bat`, `start-nodes.bat`, `start-web.bat`

---

## Sıradaki Adımlar (Disk Temizlendikten Sonra)

1. **Uçtan uca testi tamamla** — Manufacturer web panelinden ürün oluştur, Distributor'a transfer et, Retailer'da doğrula
2. **Ekran görüntüleri al** — tez/sunum için
3. **Hata yönetimini geliştir** — Flow timeout, party not found gibi edge case'ler için daha açıklayıcı mesajlar
4. **Test sınıfları yaz** — `ProductContractTest`, `CreateProductFlowTest`
5. **README güncelle** — MVP v2 bölümü ekle

---

## Tüm Komutlar — Hızlı Referans

```powershell
# 1. Projeyi build et
./gradlew clean build

# 2. Node'ları deploy et
.\deploy.bat

# 3. Node'ları başlat (4 pencere açılır)
$env:JAVA_TOOL_OPTIONS="-Duser.language=en -Duser.country=US -Dfile.encoding=UTF-8"
.\start-nodes.bat

# 4. Web backend'leri başlat (her biri ayrı pencerede)
.\start-web.bat manufacturer    # → http://localhost:8081
.\start-web.bat distributor     # → http://localhost:8082
.\start-web.bat retailer        # → http://localhost:8083

# Logları canlı izle
Get-Content "build\nodes\Manufacturer\logs\node-DESKTOP-ISF5HJO.log" -Wait -Tail 20
```

---

## Dosya Yapısı Özeti

```
supply-chain-cordapp/
├── contracts/          → ProductState, ProductContract
├── workflows/          → CreateProductFlow, TransferProductFlow + Responders
├── clients/            → Spring Boot backend + HTML frontend
│   └── src/main/
│       ├── java/com/supplychain/
│       │   ├── SupplyChainApplication.java
│       │   ├── config/NodeRPCConnection.java
│       │   ├── service/ProductService.java
│       │   ├── controller/ProductController.java
│       │   └── dto/ (3 sınıf)
│       └── resources/
│           ├── application*.properties (4 dosya)
│           └── static/ (index, products, create, transfer HTML + CSS)
├── deploy.bat          → Node deploy (locale fix dahil)
├── start-nodes.bat     → 4 node başlat (locale fix dahil)
└── start-web.bat       → Web backend başlat (locale fix dahil)
```
