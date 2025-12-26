# RBAC (Role-Based Access Control) Implementation

Bu dokümantasyon, sistemdeki rol bazlı yetkilendirme (RBAC) implementasyonunu detaylı olarak açıklar.

## Rol Hiyerarşisi

```
ADMIN (En Üst Yetki - Sistem Sahibi)
  ↓
MANAGER (Operasyon Yöneticisi - Admin hariç her şeyi yönetir)
  ↓
ASSISTANT_MANAGER (Kısmi Yönetici - Teacher + Student yönetir)
  ↓
TEACHER (Akademik Rol - Öğrencilerle çalışır)
  ↓
STUDENT (En Alt Seviye - Sadece kendisi)
```

## 1. ADMIN Görevleri (Sadece Admin yapar)

### A) Kullanıcı ve Rol Yönetimi

**Endpoint: `/api/users`**
- ✅ Tüm kullanıcıları (Admin dahil) görüntüleme, arama, filtreleme
- ✅ Kullanıcı oluşturma (`POST /api/users`)
- ✅ Kullanıcı güncelleme (`PUT /api/users/:id`)
- ✅ Kullanıcı silme (`DELETE /api/users/:id`)
- ✅ Kullanıcının rolünü değiştirme (`PATCH /api/users/:id/role`)
- ✅ Hesap dondurma / aktif etme (`PATCH /api/users/:id/status`)

**Endpoint: `/api/admin/*`**
- ✅ Admin oluşturma, güncelleme, silme

### B) Sistem Kurulum ve Tanımlamalar (Master Data)

**Endpoint: `/api/terms`**
- ✅ EDUCATION_TERM (dönem) ekleme / güncelleme / silme

**Endpoint: `/api/lessons`**
- ✅ LESSON ekleme / güncelleme / silme

**Endpoint: `/api/content/*`**
- ✅ COURSE / INSTRUCTOR / EVENT / SLIDE gibi web içeriklerini yönetme (sadece ADMIN)

### C) Program ve Akademik Yapı Üst Kontrol

**Endpoint: `/api/lesson-programs`**
- ✅ LESSON_PROGRAM (ders programı slotları) oluşturma / silme / düzenleme
- ✅ Program–lesson eşlemesi (PROGRAM_LESSON) yönetimi
- ✅ Teacher–program atama (TEACHER_PROGRAM) yönetimi
- ✅ Student–program atama (STUDENT_PROGRAM) yönetimi

### D) Performans ve Denetim

**Endpoint: `/api/student-info`**
- ✅ Tüm öğrencilerin STUDENT_INFO kayıtlarını görme/düzenleme/silme

**Endpoint: `/api/meets`**
- ✅ Tüm MEET kayıtlarını görme/silme (denetim)

**Endpoint: `/api/contactMessages`**
- ✅ CONTACT_MESSAGE yönetimi (okuma, silme)

---

## 2. MANAGER Görevleri (Admin hariç her şeyi yönetir)

### A) Kullanıcı Yönetimi (Admin hariç)

**Endpoint: `/api/users`**
- ✅ Öğretmen, öğrenci, asistan manager, manager hesaplarını listeleme
- ❌ Admin hesabını göremez / değiştiremez
- ✅ Admin hariç kullanıcı oluşturma / düzenleme / pasifleştirme (users.js route'u üzerinden değil, spesifik route'lar üzerinden)

**Endpoint: `/api/manager/*`**
- ✅ Manager oluşturma, güncelleme, silme

**Endpoint: `/api/assistant-manager/*`**
- ✅ Assistant Manager oluşturma, güncelleme, silme

**Endpoint: `/api/teacher/*`**
- ✅ Teacher oluşturma, güncelleme, silme

**Endpoint: `/api/student/*`**
- ✅ Student oluşturma, güncelleme, silme

### B) Akademik Yapı Yönetimi

**Endpoint: `/api/terms`**
- ✅ Dönem (TERM) oluşturma / düzenleme / silme

**Endpoint: `/api/lessons`**
- ✅ Ders (LESSON) ekleme / düzenleme / silme

**Endpoint: `/api/lesson-programs`**
- ✅ Lesson program (LESSON_PROGRAM) oluşturma / düzenleme
- ✅ Program–lesson (PROGRAM_LESSON) eşleştirme

### C) Atamalar ve Süreç Yönetimi

**Endpoint: `/api/lesson-programs/:id/teachers`**
- ✅ Teacher–program ataması (TEACHER_PROGRAM)

**Endpoint: `/api/lesson-programs/:id/students`**
- ✅ Student–program ataması (STUDENT_PROGRAM)

**Endpoint: `/api/student/update`**
- ✅ Öğrenciye advisor teacher atama (STUDENT.advisor_teacher_id)

### D) Rapor ve İzleme

**Endpoint: `/api/student-info`**
- ✅ Tüm öğrencilerin not/devamsızlık kayıtlarını görme/düzenleme

**Endpoint: `/api/meets`**
- ✅ Tüm meeting kayıtlarını görme

**Endpoint: `/api/contactMessages`**
- ✅ Contact mesajlarını görme/silme

---

## 3. ASSISTANT_MANAGER Görevleri (Admin + Manager hariç)

### A) Kullanıcı Listesi (Sadece Teacher + Student)

**Endpoint: `/api/users`**
- ✅ Öğretmen ve öğrencileri listeleyebilir
- ❌ Admin ve manager listesinde görünmez

**Endpoint: `/api/teacher/*`**
- ✅ Teacher oluşturma, güncelleme, silme

**Endpoint: `/api/student/*`**
- ✅ Student oluşturma, güncelleme, silme

### B) Program Süreçleri (Operasyon)

**Endpoint: `/api/lesson-programs/:id/students`**
- ✅ Student–program atama / çıkarma (STUDENT_PROGRAM)

**Endpoint: `/api/lesson-programs/:id/teachers`**
- ❌ Teacher–program atama / çıkarma (sadece MANAGER+ yapabilir)

### C) Takip ve Rapor

**Endpoint: `/api/lesson-programs`**
- ✅ Öğrencilerin programlarını görüntüleyebilir

**Endpoint: `/api/student-info`**
- ✅ Öğrencilerin student_info kayıtlarını görüntüleyebilir (sadece görüntüleme, düzenleme yok)

**Endpoint: `/api/meets`**
- ✅ Meeting kayıtlarını görüntüleyebilir (silme yetkisi yok)

**Endpoint: `/api/contactMessages`**
- ✅ Contact mesajlarını görüntüleyebilir/silebilir

---

## 4. TEACHER Görevleri (Sadece kendisi + öğrenciler)

### A) Kendi Hesabı

**Endpoint: `/api/users/:id`** (kendi ID'si)
- ✅ Kendi profilini görüntüleme / güncelleme (telefon, email vb.)
- ✅ Advisor teacher mı değil mi bilgisini görme

### B) Öğrencilerle İlgili İşlemler

**Endpoint: `/api/users`**
- ✅ Tüm öğrencileri listeleme

**Endpoint: `/api/lesson-programs`**
- ✅ Öğrencinin programlarını görüntüleme (kendi atandığı programlar)

**Endpoint: `/api/meets`**
- ✅ Meeting oluşturma (MEET)
- ✅ Meeting'e öğrenci ekleme/çıkarma (MEET_STUDENT)

### C) Not ve Devamsızlık

**Endpoint: `/api/student-info`**
- ✅ STUDENT_INFO ekleme / güncelleme (midterm, final, absentee, note, infoNote)
- ✅ Tüm öğrencilerin notlarını görüntüleme

---

## 5. STUDENT Görevleri (Sadece kendisi)

### A) Kendi Hesabı

**Endpoint: `/api/users/:id`** (kendi ID'si)
- ✅ Kendi profil bilgilerini görüntüleme (isim, email, telefon vb.)
- ✅ Kendi anne/baba/advisor bilgilerini görme

### B) Kendi Programı

**Endpoint: `/api/lesson-programs`**
- ✅ Kendi lesson programlarını görme
- ✅ "Choose Lesson" süreci varsa: sadece kendi seçim ekranı (STUDENT_PROGRAM)

### C) Kendi Başarı Bilgileri

**Endpoint: `/api/student-info`**
- ✅ Sadece kendi student_info kayıtlarını görme (not, devamsızlık, ortalama, remark)

**Endpoint: `/api/meets`**
- ✅ Meeting geçmişini görme (kendi katıldığı meet'ler)

---

## Route Özeti

### Kullanıcı Yönetimi

| İşlem | ADMIN | MANAGER | ASSISTANT_MANAGER | TEACHER | STUDENT |
|-------|-------|---------|-------------------|---------|---------|
| Tüm kullanıcıları görme | ✅ | ✅ (Admin hariç) | ✅ (Teacher+Student) | ✅ (Self+Student) | ✅ (Self) |
| Kullanıcı oluşturma | ✅ | ❌ | ❌ | ❌ | ❌ |
| Kullanıcı güncelleme | ✅ | ❌ | ❌ | ❌ | ❌ |
| Kullanıcı silme | ✅ | ❌ | ❌ | ❌ | ❌ |
| Rol değiştirme | ✅ | ❌ | ❌ | ❌ | ❌ |
| Hesap dondurma | ✅ | ✅ (Admin hariç) | ❌ | ❌ | ❌ |

### Master Data Yönetimi

| İşlem | ADMIN | MANAGER | ASSISTANT_MANAGER | TEACHER | STUDENT |
|-------|-------|---------|-------------------|---------|---------|
| Term yönetimi | ✅ | ✅ | ❌ | ❌ | ❌ |
| Lesson yönetimi | ✅ | ✅ | ❌ | ❌ | ❌ |
| Content yönetimi | ✅ | ❌ | ❌ | ❌ | ❌ |

### Program Yönetimi

| İşlem | ADMIN | MANAGER | ASSISTANT_MANAGER | TEACHER | STUDENT |
|-------|-------|---------|-------------------|---------|---------|
| Program oluşturma/silme | ✅ | ✅ | ❌ | ❌ | ❌ |
| Program görüntüleme | ✅ | ✅ | ✅ | ✅ (Own) | ✅ (Own) |
| Lesson atama | ✅ | ✅ | ❌ | ❌ | ❌ |
| Teacher atama | ✅ | ✅ | ❌ | ❌ | ❌ |
| Student atama | ✅ | ✅ | ✅ | ❌ | ❌ |

### Öğrenci Bilgileri

| İşlem | ADMIN | MANAGER | ASSISTANT_MANAGER | TEACHER | STUDENT |
|-------|-------|---------|-------------------|---------|---------|
| Student Info görüntüleme | ✅ (All) | ✅ (All) | ✅ (All) | ✅ (All) | ✅ (Own) |
| Student Info oluşturma | ✅ | ✅ | ❌ | ✅ | ❌ |
| Student Info güncelleme | ✅ | ✅ | ❌ | ✅ | ❌ |
| Student Info silme | ✅ | ❌ | ❌ | ❌ | ❌ |

### Meeting Yönetimi

| İşlem | ADMIN | MANAGER | ASSISTANT_MANAGER | TEACHER | STUDENT |
|-------|-------|---------|-------------------|---------|---------|
| Meeting görüntüleme | ✅ (All) | ✅ (All) | ✅ (All) | ✅ (Own) | ✅ (Own) |
| Meeting oluşturma | ✅ | ❌ | ❌ | ✅ | ❌ |
| Meeting güncelleme | ✅ | ❌ | ❌ | ✅ | ❌ |
| Meeting silme | ✅ | ❌ | ❌ | ❌ | ❌ |

### Contact Message

| İşlem | ADMIN | MANAGER | ASSISTANT_MANAGER | TEACHER | STUDENT |
|-------|-------|---------|-------------------|---------|---------|
| Mesaj görüntüleme | ✅ | ✅ | ✅ | ❌ | ❌ |
| Mesaj silme | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## Önemli Notlar

1. **Hiyerarşi Kuralı**: Üst seviyedeki bir rol, alt seviyedeki rollerin tüm yetkilerine sahiptir. Ancak bazı özel durumlar vardır:
   - MANAGER, ADMIN'i göremez/yönetemez
   - ASSISTANT_MANAGER, ADMIN ve MANAGER'ı göremez/yönetemez
   - TEACHER, yönetimsel işlemleri yapamaz

2. **Görüntüleme vs. Düzenleme**: Bazı roller verileri görebilir ama düzenleyemez:
   - ASSISTANT_MANAGER: Student Info'yu görebilir ama düzenleyemez
   - MANAGER: Student Info'yu görebilir ve düzenleyebilir ama silemez (sadece ADMIN silebilir)

3. **Silme İşlemleri**: Genellikle sadece ADMIN yapabilir:
   - Student Info silme: Sadece ADMIN
   - Meet silme: Sadece ADMIN
   - User silme: Sadece ADMIN

4. **Content Yönetimi**: Web içerikleri (Course, Event, Instructor, Slide) sadece ADMIN tarafından yönetilebilir.

---

**Son Güncelleme**: 2024
**Versiyon**: 2.0

