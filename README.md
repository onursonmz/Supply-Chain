# Supply Chain CorDapp — MVP v1

Corda R3 4.12 teknolojisi ile geliştirilmiş, blockchain tabanlı tedarik zinciri uygulaması.
Ürünlerin sahipliğini dağıtık defterde (distributed ledger) takip eder.

---

## Teknoloji Yığını

| Bileşen | Versiyon |
|---------|----------|
| Corda Open Source | 4.12 |
| Java | 17 (Eclipse Adoptium) |
| Gradle | 7.6.4 |
| Kotlin (build ekosistemi) | 1.9.22 |
| Platform Version | 12 |

---

## Ağ Katılımcıları

| Node | Rol | P2P Port | RPC Port |
|------|-----|----------|----------|
| Notary | İşlem doğrulayıcı | 10002 | 10003 |
| Manufacturer | Ürün üretici | 10005 | 10006 |
| Distributor | Dağıtıcı | 10008 | 10009 |
| Retailer | Perakendeci | 10011 | 10012 |

---

## İş Akışı

```
Manufacturer  →  (ürün oluşturur)  →  Ledger
Manufacturer  →  (transfer eder)   →  Distributor
Distributor   →  (transfer eder)   →  Retailer
```

---

## Proje Yapısı

```
supply-chain-cordapp/
│
├── contracts/                          # Akıllı kontrat modülü
│   └── src/main/java/com/supplychain/
│       ├── states/
│       │   └── ProductState.java       # Ürün durumu (LinearState)
│       └── contracts/
│           └── ProductContract.java    # Create ve Transfer kuralları
│
├── workflows/                          # Flow modülü
│   └── src/main/java/com/supplychain/flows/
│       ├── CreateProductFlow.java      # Ürün oluşturma flow'u
│       ├── CreateProductResponder.java # Oluşturma responder'ı
│       ├── TransferProductFlow.java    # Transfer flow'u
│       └── TransferProductResponder.java # Transfer responder'ı
│
├── build.gradle                        # Root build + deployNodes
├── settings.gradle                     # Modül tanımları
├── constants.properties                # Corda versiyon sabitleri
├── gradle.properties                   # Gradle ayarları
├── deploy.bat                          # Node deploy scripti (locale fix içerir)
├── start-nodes.bat                     # Node başlatma scripti (locale fix içerir)
├── SHELL_DEMO.md                       # Corda shell demo komutları
└── PROJECT_STATUS.md                   # Proje ilerleme durumu
```

---

## Veri Modeli

### ProductState
```java
UniqueIdentifier linearId    // Ürün benzersiz ID
String productName           // Ürün adı
String serialNumber          // Seri numarası
Party owner                  // Mevcut sahip
String status                // "CREATED" | "TRANSFERRED"
```

### Kontrat Kuralları

**Create:**
- Input state yok
- 1 output ProductState
- status = "CREATED"
- Sahip imzalamalı

**Transfer:**
- 1 input, 1 output ProductState
- linearId değişmez
- Sahip değişmeli
- Eski sahip + yeni sahip imzalamalı
- status = "TRANSFERRED"

---

## Kurulum ve Çalıştırma

### Gereksinimler
- Java 17 (Eclipse Adoptium önerilir)
- Git

### 1. Projeyi klonla
```bash
git clone <repo-url>
cd supply-chain-cordapp
```

### 2. Node'ları deploy et
```bat
deploy.bat
```

### 3. Node'ları başlat
```powershell
$env:JAVA_TOOL_OPTIONS="-Duser.language=en -Duser.country=US -Dfile.encoding=UTF-8"
.\start-nodes.bat
```

> **Önemli:** `start-nodes.bat` yerine direkt `build\nodes\runnodes.bat` kullanmayın.
> Türkçe sistem locale'i Corda'nın AMQP serializer'ını bozuyor (detay: PROJECT_STATUS.md).

### 4. Shell Demo
Detaylı komutlar için [SHELL_DEMO.md](SHELL_DEMO.md) dosyasına bakın.

```
# Manufacturer shell'inde:
flow start CreateProductFlow productName: "Laptop Model X", serialNumber: "SN-001", owner: "O=Manufacturer,L=New York,C=US"

# Manufacturer shell'inde (linearId'yi kopyala):
flow start TransferProductFlow linearId: "<uuid>", newOwner: "O=Distributor,L=Paris,C=FR"

# Distributor shell'inde vault sorgula:
run vaultQuery contractStateType: com.supplychain.states.ProductState
```

---

## Bilinen Sorunlar

### Türkçe Locale Hatası
**Hata:** `No enum constant net.corda.serialization.internal.amqp.MethodClassifier.İS`

**Neden:** Corda'nın AMQP serializer'ı `String.toUpperCase()` kullanırken `Locale` belirtmiyor.
Türkçe sistemlerde `"is".toUpperCase()` → `"İS"` (dotless-I) üretiyor, `"IS"` değil.

**Çözüm:** Node başlatılırken `-Duser.language=en -Duser.country=US` JVM parametresi ekle.
`start-nodes.bat` ve `deploy.bat` bu fix'i otomatik uygular.

### Disk Alanı Uyarısı
**Hata:** `AMQ222212: Disk Full! Blocking message production`

**Neden:** Artemis mesaj broker'ı disk %90+ dolduğunda P2P mesajlaşmayı bloke eder.

**Çözüm:** Disk temizle, en az %10 boş alan bırak (~20GB+).

---

## MVP v1 Kapsam Dışı

Aşağıdakiler sonraki versiyonlara ertelendi:
- REST API / Web arayüzü
- Spring Boot entegrasyonu
- Accounts SDK
- Token SDK
- Fatura / ödeme flow'ları
- GPS / lojistik takip
- Docker / Kubernetes deployment
- Bildirim sistemi
- Harici veritabanı entegrasyonu
