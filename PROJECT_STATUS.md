# Proje Durum Raporu — Supply Chain CorDapp MVP v1

**Son güncelleme:** 2026-03-19
**Geliştirici:** Onur
**Asistan:** Claude (Sonnet 4.6)

---

## Genel Durum

```
[✅] Contracts modülü yazıldı
[✅] Workflows modülü yazıldı
[✅] Build sistemi kuruldu (Gradle 7.6.4)
[✅] Node konfigürasyonu hazırlandı (4 node)
[✅] deployNodes başarıyla çalıştı
[✅] Node'lar başlatıldı (locale fix ile)
[⏳] Shell demo test edilecek
[⏳] Flow'lar doğrulanacak
[❌] Disk alanı sorunu çözülmedi
```

---

## Tamamlanan Adımlar

### Adım 1 — Proje İskeleti
- `settings.gradle`, `build.gradle`, `gradle.properties`, `constants.properties` oluşturuldu
- `contracts/` ve `workflows/` modülleri tanımlandı
- Gradle wrapper 7.6.4 kuruldu (`cordapp-template-java`'dan kopyalandı)

### Adım 2 — Contracts Modülü

**ProductState.java**
- `LinearState` implement ediyor
- Alanlar: `linearId`, `productName`, `serialNumber`, `owner`, `status`
- Participants: sadece `owner`
- Status sabitleri: `CREATED`, `TRANSFERRED`

**ProductContract.java**
- `Create` komutu: input yok, 1 output, status=CREATED, owner imzalıyor
- `Transfer` komutu: 1 input + 1 output, linearId sabit, sahip değişiyor, her iki taraf imzalıyor
- `requireThat` ile kural doğrulama

### Adım 3 — Workflows Modülü

**CreateProductFlow.java** (Initiator)
- Parametreler: `productName`, `serialNumber`, `owner`
- `FinalityFlow` ile finalize
- ProgressTracker entegre

**CreateProductResponder.java**
- `ReceiveFinalityFlow` ile işlemi alır
- Sadece owner farklı node'daysa devreye girer

**TransferProductFlow.java** (Initiator)
- Parametreler: `linearId` (UUID), `newOwner`
- Vault'tan ürünü `LinearStateQueryCriteria` ile sorgular
- `CollectSignaturesFlow` ile yeni sahipin imzasını toplar
- `FinalityFlow` ile finalize

**TransferProductResponder.java**
- `SignTransactionFlow` ile imzalar
- Transaction'ın kendisine adreslendiğini doğrular
- `ReceiveFinalityFlow` ile kaydeder

### Adım 4 — Build Konfigürasyonu

**Karşılaşılan sorun:** `cordaCompile` konfigürasyonu Corda 4.12'de kaldırıldı.
**Çözüm:** `cordaProvided` kullanıldı (template projesinden örnek alındı).

**Karşılaşılan sorun:** `LinearStateQueryCriteria` constructor'ı `List<UniqueIdentifier>` değil `List<UUID>` alıyor.
**Çözüm:** `linearId.getId()` ile UUID extract edildi.

### Adım 5 — Deploy ve Başlatma

**deployNodes:**
```bat
deploy.bat
```
Bu script `JAVA_TOOL_OPTIONS` ile Türkçe locale fix'ini uygular.

**Node başlatma:**
```powershell
$env:JAVA_TOOL_OPTIONS="-Duser.language=en -Duser.country=US -Dfile.encoding=UTF-8"
.\start-nodes.bat
```

**Node'lar başarıyla başlatıldı:**
- Notary: `localhost:10002`
- Manufacturer: `localhost:10005`
- Distributor: `localhost:10008`
- Retailer: `localhost:10011`

---

## Açık Sorunlar

### 1. Disk Alanı — KRİTİK
**Durum:** Bloke edici
**Hata:** `AMQ222212: Disk Full! Blocking message production`
**Detay:** Disk %97.6 dolu (6.1GB boş / 255.4GB toplam). Artemis broker, disk %90+ olduğunda P2P mesajlaşmayı bloke ediyor. Bu durumda flow'lar node'lar arası mesaj gönderemedikleri için çalışmaz.
**Çözüm:** Diskte en az 20GB alan boşaltmak gerekiyor. Ardından node'ları yeniden başlat.

### 2. Shell Demo — Henüz Test Edilmedi
**Durum:** Disk sorunu çözüldükten sonra yapılacak
**Yapılacaklar:**
- Manufacturer'da `CreateProductFlow` çalıştır
- `linearId`'yi not al
- Manufacturer'dan Distributor'a transfer et
- Distributor vault'unu doğrula
- Distributor'dan Retailer'a transfer et
- Retailer vault'unu doğrula

---

## Kritik Teknik Not — Türkçe Locale Hatası

Bu proje Türkçe Windows sisteminde geliştirildi. Corda 4.12'nin AMQP serializer'ı (`PropertyDescriptor.kt`) method isimlerini sınıflandırırken `String.toUpperCase()` kullanıyor ancak `Locale` belirtmiyor.

Türkçe'de:
```
"is".toUpperCase(Locale.getDefault())  →  "İS"   ← HATALI (dotless-I)
"is".toUpperCase(Locale.ENGLISH)       →  "IS"   ← DOĞRU
```

`MethodClassifier.valueOf("İS")` → `IllegalArgumentException` fırlatıyor.

**Kalıcı fix:** Her JVM başlatılırken `-Duser.language=en -Duser.country=US` eklenmeli.
**Bu proje için:** `deploy.bat` ve `start-nodes.bat` bu parametreyi otomatik ekliyor.

---

## Sonraki Adımlar (MVP v2 için)

Disk sorunu çözüldükten ve v1 demo tamamlandıktan sonra:

1. **Shell demo'yu tamamla** ve ekran görüntüleri al
2. **Test sınıfları yaz** (`ContractTests`, `FlowTests`)
3. **REST API ekle** (Corda HTTP RPC veya Spring Boot)
4. **QueryFlow ekle** — vault'tan ürün sorgulama flow'u
5. **Hata yönetimi** — flow'larda daha iyi exception handling
6. **Daha fazla katılımcı** — ShippingCompany node'u

---

## Önemli Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `deploy.bat` | Node'ları build edip deploy eder (locale fix içerir) |
| `start-nodes.bat` | 4 node'u başlatır (locale fix içerir) |
| `SHELL_DEMO.md` | Adım adım Corda shell komutları |
| `constants.properties` | Tüm Corda versiyon sabitleri |
| `build/nodes/` | Deploy edilen node'lar (git'e eklenmez) |

---

## Komut Referansı

```powershell
# Deploy (ilk kurulum veya kod değişikliğinde)
.\deploy.bat

# Node'ları başlat
$env:JAVA_TOOL_OPTIONS="-Duser.language=en -Duser.country=US -Dfile.encoding=UTF-8"
.\start-nodes.bat

# Sadece build (deploy etmeden)
./gradlew clean build

# Logları izle
Get-Content "build\nodes\Manufacturer\logs\node-DESKTOP-ISF5HJO.log" -Wait -Tail 20
```
