# Proje Durum Raporu — Supply Chain CorDapp
**Son güncelleme:** 2026-03-21
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
[✅] Adım 6  — 4 node deploy edildi (Notary, Manufacturer, Distributor, Retailer→Pharmacy)
[✅] Adım 7  — Node'lar başarıyla ayağa kalktı
[⏳] Adım 8  — Corda shell üzerinden uçtan uca demo (disk sorunu çözülünce)

MVP v2 — Web Katmanı (Genel Ürün Odaklı)
─────────────────────────────────────────
[✅] Adım 9  — Spring Boot backend (clients modülü)
[✅] Adım 10 — REST API (create, transfer, list, getById)
[✅] Adım 11 — RPC bağlantısı NodeRPCConnection
[✅] Adım 12 — Web arayüzü (4 HTML sayfası + CSS)
[✅] Adım 13 — Üç ayrı node profili (manufacturer / distributor / retailer)
[✅] Adım 14 — Başarılı build (bootJar)
[⏳] Adım 15 — Web arayüzü üzerinden uçtan uca demo (disk sorunu çözülünce)

MVP v2.1 — İlaç Sektörü Odaklı (TAMAMLANDI)
─────────────────────────────────────────
[✅] Adım 16 — MedicineState (ilaç veri modeli — 9 alan)
[✅] Adım 17 — MedicineContract (ilaç iş kuralları)
[✅] Adım 18 — CreateMedicineFlow + Responder
[✅] Adım 19 — TransferMedicineFlow + Responder (otomatik status belirleme)
[✅] Adım 20 — AuthService + AuthController (login/logout/me)
[✅] Adım 21 — MedicineService + MedicineController (CRUD + transfer)
[✅] Adım 22 — DashboardController (istatistik API)
[✅] Adım 23 — Pharmacy node profili eklendi (Retailer → Pharmacy)
[✅] Adım 24 — Pharma-temalı login ekranı (index.html)
[✅] Adım 25 — Dashboard (istatistikler + son işlemler)
[✅] Adım 26 — Medicine List, Create Medicine, Transfer Medicine, Medicine Detail sayfaları
[✅] Adım 27 — İlaç sektörüne uygun CSS tema (mavi/teal/beyaz)
[⏳] Adım 28 — Disk sorunu çözüldükten sonra build + uçtan uca demo

Açık Sorunlar
─────────────────────────────────────────
[❌] Disk alanı yetersiz (%97.6 dolu) → deployNodes ve demo bloke
[⚠️] Pharmacy node: build.gradle güncellendi (Retailer → Pharmacy)
     → Yürürlüğe girmesi için ./gradlew deployNodes tekrar çalıştırılmalı
```

---

## MVP v2.1 — İlaç Tedarik Zinciri (Tamamlandı)

### Ne Değişti / Ne Eklendi

| Kategori | MVP v2 (Önceki) | MVP v2.1 (Şimdiki) |
|----------|-----------------|---------------------|
| Veri Modeli | ProductState (5 alan) | MedicineState (9 alan) |
| Durum Değerleri | CREATED, TRANSFERRED | CREATED, IN_DISTRIBUTION, AT_PHARMACY |
| Node Ağı | Retailer | Pharmacy (İstanbul) |
| Login | Yok | Demo login (manufacturer/distributor/pharmacy) |
| Dashboard | Basit kart | İstatistikler + son işlemler |
| Frontend | Genel ürün teması | İlaç sektörü teması (mavi/teal) |
| Sayfalar | 4 sayfa | 6 sayfa (login + dashboard + list + create + transfer + detail) |

---

## MVP v2.1 — Blockchain Katmanı

### MedicineState

Corda ledger'ında saklanan ilaç kaydı. `LinearState` implement eder.

| Alan | Tip | Açıklama |
|------|-----|----------|
| linearId | UniqueIdentifier | Blockchain benzersiz kimliği |
| medicineName | String | İlaç adı (e.g. "Paracetamol 500mg") |
| batchNumber | String | Lot/batch numarası |
| serialNumber | String | Seri numarası |
| manufacturerName | String | Üretici firma adı |
| expiryDate | String | Son kullanma tarihi |
| category | String | Kategori (Painkiller, Antibiotic, vb.) |
| owner | Party | Mevcut sahip node |
| status | String | CREATED / IN_DISTRIBUTION / AT_PHARMACY |

### MedicineContract

| Komut | Kurallar |
|-------|----------|
| Create | Input yok, 1 output, medicineName/batchNumber/serialNumber/manufacturerName dolu olmalı, status=CREATED |
| Transfer | 1 input + 1 output, linearId değişmemeli, owner değişmeli, status IN_DISTRIBUTION veya AT_PHARMACY olmalı, her iki taraf imzalamalı |

### Akışlar

**CreateMedicineFlow:** medicineName, batchNumber, serialNumber, manufacturerName, expiryDate, category, owner parametrelerini alır. Owner bu node'un kendisidir (backend otomatik belirler).

**TransferMedicineFlow:** linearId + newOwner alır. Yeni owner'ın organizasyon adına göre status otomatik belirlenir:
- Contains "Pharmacy" → AT_PHARMACY
- Otherwise → IN_DISTRIBUTION

---

## MVP v2.1 — Web Katmanı

### Mimari

```
Tarayıcı (HTML/CSS/JS)
       ↓  HTTP (same-origin)
Spring Boot REST API  (port 8081 / 8082 / 8083)
       ↓  HttpSession (demo auth)
       ↓  Corda RPC
Corda Node  (Manufacturer / Distributor / Pharmacy)
       ↓
Corda Ledger (blockchain)
```

### Login Sistemi (Demo)

Sabit kullanıcılar — `AuthService.java` içinde tanımlı:

| Kullanıcı | Şifre | Rol | Panel Port |
|-----------|-------|-----|-----------|
| manufacturer | 1234 | MANUFACTURER | 8081 |
| distributor | 1234 | DISTRIBUTOR | 8082 |
| pharmacy | 1234 | PHARMACY | 8083 |

Session: Spring `HttpSession` ile tutulur. Login → `POST /api/auth/login` session oluşturur. Çıkış → `POST /api/auth/logout`.

### REST API Endpointleri

| Method | URL | Açıklama |
|--------|-----|----------|
| POST | `/api/auth/login` | Giriş yap |
| GET | `/api/auth/me` | Oturum bilgisi |
| POST | `/api/auth/logout` | Çıkış yap |
| GET | `/api/node-info` | Bağlı node adı |
| GET | `/api/dashboard` | İstatistikler |
| POST | `/api/medicines` | Yeni ilaç oluştur |
| POST | `/api/medicines/transfer` | İlaç transfer et |
| GET | `/api/medicines` | Tüm ilaçları listele |
| GET | `/api/medicines/{linearId}` | ID ile ilaç getir |

### Frontend Sayfaları

| Dosya | Açıklama |
|-------|----------|
| `index.html` | Login ekranı (pharma-temalı, gradient arka plan) |
| `dashboard.html` | İstatistik kartları + son işlemler tablosu |
| `medicines.html` | İlaç listesi — status badge'leri, kopyala/detay/transfer butonları |
| `create-medicine.html` | İlaç oluşturma formu (6 alan) + başarı sonuç kartı |
| `transfer-medicine.html` | Transfer formu — yeni owner seçimi + status preview |
| `medicine-detail.html` | Tek ilaç detay görünümü + ownership chain |

---

## Node Ağı

| Node | P2P Port | RPC Port | Web Port | Rol |
|------|----------|----------|----------|-----|
| Notary | 10002 | 10003 | — | İşlem doğrulayıcı |
| Manufacturer | 10005 | 10006 | 8081 | İlaç Üreticisi |
| Distributor | 10008 | 10009 | 8082 | Ecza Deposu |
| Pharmacy | 10011 | 10012 | 8083 | Eczane |

> **Not:** build.gradle'da Retailer → Pharmacy olarak güncellendi. Yürürlüğe girmesi için `./gradlew deployNodes` tekrar çalıştırılmalı (disk sorunu çözüldükten sonra).

---

## Açık Sorunlar

### Disk Alanı — KRİTİK
**Hata:** `AMQ222212: Disk Full! Blocking message production`
**Durum:** Disk %97.6 dolu (6.1GB boş / 255.4GB). Artemis %90 üzerinde P2P mesajlaşmayı bloke ediyor.
**Çözüm:** En az 20GB disk alanı boşaltılmalı → `start-nodes.bat` ile node'lar yeniden başlatılmalı → `./gradlew deployNodes` ile Pharmacy node deploy edilmeli.

---

## Kritik Teknik Not — Türkçe Locale Hatası

Corda 4.12'nin AMQP serializer'ı `String.toUpperCase()` kullanırken `Locale` belirtmiyor:

```
Türkçe:  "is".toUpperCase() → "İS"  ← MethodClassifier.valueOf("İS") → HATA
İngilizce: "is".toUpperCase() → "IS"  ← MethodClassifier.IS → DOĞRU
```

**Fix:** Her JVM process'ine `-Duser.language=en -Duser.country=US` ekle.
**Uygulandığı yerler:** `deploy.bat`, `start-nodes.bat`, `start-web.bat`

---

## Demo Senaryosu (Disk Sorunu Çözüldükten Sonra)

```
1. ./gradlew clean build          # Tüm modüller derle
2. .\deploy.bat                   # Pharmacy dahil 4 node deploy et
3. .\start-nodes.bat              # 4 node başlat

4. .\start-web.bat manufacturer   # http://localhost:8081
5. .\start-web.bat distributor    # http://localhost:8082
6. .\start-web.bat pharmacy       # http://localhost:8083
```

**Demo Akışı:**
1. `localhost:8081` → Manufacturer ile login
2. Create Medicine → Paracetamol, BATCH-2026-001 oluştur
3. Medicines listesinde kayıt görünür
4. Transfer → Distributor'a gönder (status: IN_DISTRIBUTION)
5. `localhost:8082` → Distributor ile login → ilaç görünür
6. Transfer → Pharmacy'ye gönder (status: AT_PHARMACY)
7. `localhost:8083` → Pharmacy ile login → son sahibi görünür

---

## Tüm Komutlar — Hızlı Referans

```powershell
# 1. Projeyi build et
./gradlew clean build

# 2. Node'ları deploy et (Pharmacy dahil)
.\deploy.bat

# 3. Node'ları başlat (4 pencere açılır)
$env:JAVA_TOOL_OPTIONS="-Duser.language=en -Duser.country=US -Dfile.encoding=UTF-8"
.\start-nodes.bat

# 4. Web backend'leri başlat (her biri ayrı pencerede)
.\start-web.bat manufacturer    # → http://localhost:8081
.\start-web.bat distributor     # → http://localhost:8082
.\start-web.bat pharmacy        # → http://localhost:8083

# Logları canlı izle
Get-Content "build\nodes\Manufacturer\logs\node-DESKTOP-ISF5HJO.log" -Wait -Tail 20
```

---

## Dosya Yapısı Özeti (MVP v2.1)

```
supply-chain-cordapp/
├── contracts/src/main/java/com/supplychain/
│   ├── states/
│   │   ├── ProductState.java      (MVP v1/v2 — korundu)
│   │   └── MedicineState.java     ← YENİ (MVP v2.1)
│   └── contracts/
│       ├── ProductContract.java   (MVP v1/v2 — korundu)
│       └── MedicineContract.java  ← YENİ (MVP v2.1)
│
├── workflows/src/main/java/com/supplychain/flows/
│   ├── CreateProductFlow.java     (MVP v1/v2 — korundu)
│   ├── TransferProductFlow.java   (MVP v1/v2 — korundu)
│   ├── CreateMedicineFlow.java    ← YENİ
│   ├── TransferMedicineFlow.java  ← YENİ
│   ├── CreateMedicineResponder.java ← YENİ
│   └── TransferMedicineResponder.java ← YENİ
│
├── clients/src/main/
│   ├── java/com/supplychain/
│   │   ├── SupplyChainApplication.java
│   │   ├── config/NodeRPCConnection.java
│   │   ├── controller/
│   │   │   ├── AuthController.java      ← YENİ
│   │   │   ├── MedicineController.java  ← YENİ
│   │   │   └── DashboardController.java ← YENİ
│   │   ├── service/
│   │   │   ├── AuthService.java    ← YENİ
│   │   │   └── MedicineService.java ← YENİ
│   │   └── dto/
│   │       ├── MedicineResponse.java    ← YENİ
│   │       ├── CreateMedicineRequest.java ← YENİ
│   │       ├── TransferMedicineRequest.java ← YENİ
│   │       ├── LoginRequest.java        ← YENİ
│   │       └── LoginResponse.java       ← YENİ
│   └── resources/
│       ├── application.properties
│       ├── application-manufacturer.properties
│       ├── application-distributor.properties
│       ├── application-pharmacy.properties  ← YENİ
│       └── static/
│           ├── index.html           ← GÜNCELLENDİ (login ekranı)
│           ├── dashboard.html       ← YENİ
│           ├── medicines.html       ← YENİ
│           ├── create-medicine.html ← YENİ
│           ├── transfer-medicine.html ← YENİ
│           ├── medicine-detail.html ← YENİ
│           └── style.css            ← GÜNCELLENDİ (pharma tema)
│
├── build.gradle    ← GÜNCELLENDİ (Retailer → Pharmacy)
├── deploy.bat
├── start-nodes.bat
└── start-web.bat
```
