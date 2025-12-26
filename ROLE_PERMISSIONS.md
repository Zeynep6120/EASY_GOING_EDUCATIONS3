# Rol Bazlı Yetkilendirme Dokümantasyonu

Bu dokümantasyon, EasyGoing Education projesindeki tüm rollerin yapabileceği ve yapamayacağı görevleri detaylı olarak açıklar.

## Rol Hiyerarşisi

```
ADMIN (En Üst Yetki)
  ↓
MANAGER
  ↓
ASSISTANT_MANAGER
  ↓
TEACHER
  ↓
STUDENT (En Alt Seviye)
```

**Kural:** Üst seviyedeki bir rol, alt seviyedeki rollerin tüm yetkilerine sahiptir. Alt seviyedeki roller, üst seviyedeki rollerin yetkilerine sahip değildir.

---

## 🔴 ADMIN (Yönetici)

### Yapabilecekleri (Sadece ADMIN)

#### 1. Admin Yönetimi
- ✅ Tüm admin'leri görüntüleme (listeleme)
- ✅ Yeni admin oluşturma
- ✅ Admin silme
- ✅ Admin bilgilerini güncelleme

#### 2. Manager Yönetimi
- ✅ Tüm manager'ları görüntüleme
- ✅ Yeni manager oluşturma
- ✅ Manager silme
- ✅ Manager bilgilerini güncelleme

#### 3. Assistant Manager Yönetimi
- ✅ Tüm assistant manager'ları görüntüleme
- ✅ Yeni assistant manager oluşturma
- ✅ Assistant manager silme
- ✅ Assistant manager bilgilerini güncelleme

#### 4. Teacher Yönetimi
- ✅ Tüm teacher'ları görüntüleme
- ✅ Yeni teacher oluşturma
- ✅ Teacher silme
- ✅ Teacher bilgilerini güncelleme

#### 5. Student Yönetimi
- ✅ Tüm student'ları görüntüleme
- ✅ Yeni student oluşturma
- ✅ Student silme
- ✅ Student bilgilerini güncelleme

#### 6. Lesson (Ders) Yönetimi
- ✅ Tüm lesson'ları görüntüleme
- ✅ Yeni lesson oluşturma
- ✅ Lesson silme
- ✅ Lesson bilgilerini güncelleme

#### 7. Education Term (Eğitim Dönemi) Yönetimi
- ✅ Tüm education term'leri görüntüleme
- ✅ Yeni education term oluşturma
- ✅ Education term silme
- ✅ Education term bilgilerini güncelleme

#### 8. Program (Ders Programı) Yönetimi
- ✅ Tüm program'ları görüntüleme
- ✅ Yeni program oluşturma
- ✅ Program silme
- ✅ Program bilgilerini güncelleme
- ✅ Program'a lesson ekleme/çıkarma
- ✅ Program'a teacher atama/kaldırma
- ✅ Program'a student kaydetme/kayıt silme

#### 9. Meet (Toplantı) Yönetimi
- ✅ Tüm meet'leri görüntüleme
- ✅ Yeni meet oluşturma
- ✅ Meet silme
- ✅ Meet bilgilerini güncelleme
- ✅ Meet'e student ekleme/çıkarma

#### 10. Student Info (Öğrenci Bilgileri) Yönetimi
- ✅ Tüm student info'ları görüntüleme
- ✅ Yeni student info oluşturma
- ✅ Student info silme
- ✅ Student info bilgilerini güncelleme

#### 11. Contact Message (İletişim Mesajları) Yönetimi
- ✅ Tüm contact message'ları görüntüleme
- ✅ Contact message silme

#### 12. Content (İçerik) Yönetimi
- ✅ Course (Kurs) oluşturma, güncelleme, silme
- ✅ Event (Etkinlik) oluşturma, güncelleme, silme
- ✅ Instructor (Eğitmen) oluşturma, güncelleme, silme
- ✅ Slide (Slider) oluşturma, güncelleme, silme

#### 13. User (Kullanıcı) Yönetimi
- ✅ Tüm user'ları görüntüleme
- ✅ User bilgilerini görüntüleme
- ✅ User durumunu aktif/pasif yapma

### Yapamayacakları
- ❌ Hiçbir kısıtlama yok (En üst yetki seviyesi)

---

## 🟠 MANAGER (Müdür)

### Yapabilecekleri (MANAGER ve üzeri)

#### 1. Assistant Manager Yönetimi
- ✅ Tüm assistant manager'ları görüntüleme
- ✅ Yeni assistant manager oluşturma
- ✅ Assistant manager silme
- ✅ Assistant manager bilgilerini güncelleme

#### 2. Contact Message (İletişim Mesajları) Yönetimi
- ✅ Tüm contact message'ları görüntüleme
- ✅ Contact message silme

#### 3. Program (Ders Programı) Yönetimi
- ✅ Tüm program'ları görüntüleme
- ✅ Yeni program oluşturma
- ✅ Program silme
- ✅ Program bilgilerini güncelleme
- ✅ Program'a lesson ekleme/çıkarma
- ✅ Program'a teacher atama/kaldırma
- ✅ Program'a student kaydetme/kayıt silme

#### 4. Lesson (Ders) Yönetimi
- ✅ Tüm lesson'ları görüntüleme
- ✅ Yeni lesson oluşturma
- ✅ Lesson silme
- ✅ Lesson bilgilerini güncelleme

#### 5. Education Term (Eğitim Dönemi) Yönetimi
- ✅ Tüm education term'leri görüntüleme
- ✅ Yeni education term oluşturma
- ✅ Education term silme
- ✅ Education term bilgilerini güncelleme

#### 6. User (Kullanıcı) Yönetimi
- ✅ Tüm user'ları görüntüleme
- ✅ User bilgilerini görüntüleme
- ✅ User durumunu aktif/pasif yapma

### Yapamayacakları (Sadece ADMIN yapabilir)
- ❌ Admin yönetimi (oluşturma, silme, güncelleme)
- ❌ Manager yönetimi (oluşturma, silme, güncelleme)
- ❌ Content (Course, Event, Instructor, Slide) oluşturma/güncelleme/silme

---

## 🟡 ASSISTANT_MANAGER (Yardımcı Müdür)

### Yapabilecekleri (ASSISTANT_MANAGER ve üzeri)

#### 1. Teacher Yönetimi
- ✅ Tüm teacher'ları görüntüleme
- ✅ Yeni teacher oluşturma
- ✅ Teacher silme
- ✅ Teacher bilgilerini güncelleme

#### 2. Student Yönetimi
- ✅ Tüm student'ları görüntüleme
- ✅ Yeni student oluşturma
- ✅ Student silme
- ✅ Student bilgilerini güncelleme

#### 3. Program (Ders Programı) Yönetimi
- ✅ Tüm program'ları görüntüleme
- ✅ Program'a student kaydetme/kayıt silme

#### 4. Contact Message (İletişim Mesajları) Yönetimi
- ✅ Tüm contact message'ları görüntüleme
- ✅ Contact message silme

#### 5. User (Kullanıcı) Yönetimi
- ✅ Tüm user'ları görüntüleme
- ✅ User bilgilerini görüntüleme
- ✅ User durumunu aktif/pasif yapma

### Yapamayacakları (Sadece MANAGER ve üzeri yapabilir)
- ❌ Assistant Manager yönetimi (oluşturma, silme, güncelleme)
- ❌ Program oluşturma, silme, güncelleme
- ❌ Program'a lesson ekleme/çıkarma
- ❌ Program'a teacher atama/kaldırma
- ❌ Lesson yönetimi (oluşturma, silme, güncelleme)
- ❌ Education Term yönetimi (oluşturma, silme, güncelleme)

---

## 🟢 TEACHER (Öğretmen)

### Yapabilecekleri (TEACHER ve üzeri)

#### 1. Meet (Toplantı) Yönetimi
- ✅ Kendi atandığı program'lardaki meet'leri görüntüleme
- ✅ Yeni meet oluşturma
- ✅ Meet bilgilerini güncelleme
- ✅ Meet'e student ekleme/çıkarma

#### 2. Student Info (Öğrenci Bilgileri) Yönetimi
- ✅ Kendi öğrencilerinin student info'larını görüntüleme
- ✅ Yeni student info oluşturma
- ✅ Student info bilgilerini güncelleme

#### 3. Program (Ders Programı) Görüntüleme
- ✅ Kendisine atanan program'ları görüntüleme
- ✅ Program detaylarını görüntüleme
- ✅ Program'daki lesson'ları görüntüleme
- ✅ Program'daki student'ları görüntüleme

#### 4. Advisor Teacher Özellikleri
- ✅ Kendisine danışman olarak atanan student'ları görüntüleme

### Yapamayacakları (Sadece ASSISTANT_MANAGER ve üzeri yapabilir)
- ❌ Teacher yönetimi (oluşturma, silme, güncelleme)
- ❌ Student yönetimi (oluşturma, silme, güncelleme)
- ❌ Program oluşturma, silme, güncelleme
- ❌ Program'a lesson ekleme/çıkarma
- ❌ Program'a teacher atama/kaldırma
- ❌ Program'a student kaydetme/kayıt silme
- ❌ Meet silme (sadece ADMIN yapabilir)
- ❌ Student Info silme (sadece ADMIN yapabilir)
- ❌ Contact Message yönetimi
- ❌ Lesson yönetimi
- ❌ Education Term yönetimi

---

## 🔵 STUDENT (Öğrenci)

### Yapabilecekleri (STUDENT ve üzeri)

#### 1. Program (Ders Programı) Görüntüleme ve Kayıt
- ✅ Tüm program'ları görüntüleme
- ✅ Program detaylarını görüntüleme
- ✅ Program'a kayıt olma (enroll)
- ✅ Kendi kayıtlı olduğu program'ları görüntüleme

#### 2. Meet (Toplantı) Görüntüleme
- ✅ Kendi kayıtlı olduğu program'lardaki meet'leri görüntüleme
- ✅ Meet detaylarını görüntüleme
- ✅ Meet'teki diğer student'ları görüntüleme

#### 3. Student Info (Öğrenci Bilgileri) Görüntüleme
- ✅ Kendi student info'sunu görüntüleme

#### 4. Grades & Meets Görüntüleme
- ✅ Kendi notlarını ve meet'lerini görüntüleme

### Yapamayacakları (Sadece TEACHER ve üzeri yapabilir)
- ❌ Meet oluşturma, güncelleme, silme
- ❌ Student Info oluşturma, güncelleme, silme
- ❌ Program oluşturma, silme, güncelleme
- ❌ Program'a lesson ekleme/çıkarma
- ❌ Program'a teacher atama/kaldırma
- ❌ Program'dan kayıt silme (sadece ADMIN/MANAGER/ASSISTANT_MANAGER yapabilir)
- ❌ Teacher yönetimi
- ❌ Student yönetimi
- ❌ Contact Message yönetimi
- ❌ Lesson yönetimi
- ❌ Education Term yönetimi

---

## Özet Tablo

| Görev | ADMIN | MANAGER | ASSISTANT_MANAGER | TEACHER | STUDENT |
|-------|-------|---------|-------------------|---------|---------|
| **Admin Yönetimi** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Manager Yönetimi** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Assistant Manager Yönetimi** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Teacher Yönetimi** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Student Yönetimi** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Lesson Yönetimi** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Education Term Yönetimi** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Program Oluşturma/Silme/Güncelleme** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Program'a Student Kaydetme** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Program'a Kayıt Olma** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Program Görüntüleme** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Meet Oluşturma/Güncelleme** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Meet Silme** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Meet Görüntüleme** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Student Info Oluşturma/Güncelleme** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Student Info Silme** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Student Info Görüntüleme** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Contact Message Yönetimi** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Content Yönetimi** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **User Durum Yönetimi** | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## Notlar

1. **Görüntüleme (Read) İşlemleri:** Genellikle tüm roller kendi yetki alanlarındaki verileri görüntüleyebilir.

2. **Oluşturma/Güncelleme/Silme (Write) İşlemleri:** Daha kısıtlıdır ve yukarıdaki tabloya göre belirlenir.

3. **Kendi Verileri:** Her rol, kendi oluşturduğu veya kendisine atanan verileri görüntüleyebilir (örneğin, teacher kendi program'larını, student kendi kayıtlarını).

4. **Hiyerarşi Kuralı:** Üst seviyedeki bir rol, alt seviyedeki rollerin tüm yetkilerine sahiptir.

---

**Son Güncelleme:** 2024
**Versiyon:** 1.0

