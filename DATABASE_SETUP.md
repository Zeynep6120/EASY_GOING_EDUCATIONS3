# Veritabanı Kurulum Rehberi

## ✅ Veritabanı Bağlantısı Durumu

Proje **PostgreSQL** veritabanı ile bağlantılıdır. Tüm bağlantı ayarları hazır.

## 📋 Gereksinimler

1. **PostgreSQL** yüklü olmalı (pgAdmin4 ile birlikte gelir)
2. **.env** dosyası oluşturulmalı
3. Veritabanı oluşturulmalı

## 🔧 Kurulum Adımları

### 1. PostgreSQL'de Veritabanı Oluşturma

pgAdmin4'te veya terminal'de:

```sql
-- PostgreSQL'de veritabanı oluştur
CREATE DATABASE student_db;
```

### 2. .env Dosyası Oluşturma

Proje kök dizininde `.env` dosyası oluşturun:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=student_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Secret (Production'da değiştirin!)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Server Port
PORT=3000
```

**Önemli:** 
- `DB_PASSWORD` - PostgreSQL şifrenizi yazın
- `JWT_SECRET` - Güvenli bir random string kullanın (production için)

### 3. Veritabanı Tablolarını Oluşturma

Server başlatıldığında otomatik olarak tablolar oluşturulur. Veya manuel olarak:

```bash
npm run db:init
```

### 4. Admin Kullanıcısı Oluşturma

```bash
npm run db:admin
```

Veya server başlatıldığında otomatik oluşturulur.

## 📊 Veritabanı Yapısı

Proje şu tabloları içerir:

- `roles` - Kullanıcı rolleri
- `users` - Tüm kullanıcılar
- `teachers` - Öğretmen bilgileri
- `students` - Öğrenci bilgileri
- `education_terms` - Eğitim dönemleri
- `lessons` - Dersler
- `lesson_programs` - Ders programları
- `program_lessons` - Program-Ders ilişkisi
- `teacher_programs` - Öğretmen-Program ilişkisi
- `student_programs` - Öğrenci-Program ilişkisi
- `student_info` - Öğrenci not bilgileri
- `meets` - Toplantılar
- `meet_students` - Toplantı-Öğrenci ilişkisi
- `contact_messages` - İletişim mesajları
- `courses` - Public kurslar
- `instructors` - Eğitmenler
- `events` - Etkinlikler
- `slides` - Slider resimleri

## 🔍 Bağlantı Testi

### Server Başlatma

```bash
npm run dev
```

Server başladığında şu mesajları görmelisiniz:

```
Initializing database tables...
✓ Database initialized: X tables created, Y already exist
Database tables checked/created
Server running on port 3000
```

### API Health Check

```bash
curl http://localhost:3000/api/health
```

Veya tarayıcıda: `http://localhost:3000/api/health`

## 🐛 Sorun Giderme

### Bağlantı Hatası

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Çözüm:**
- PostgreSQL servisinin çalıştığından emin olun
- `.env` dosyasındaki bilgilerin doğru olduğunu kontrol edin
- pgAdmin4'te bağlantıyı test edin

### Veritabanı Bulunamadı

```
Error: database "student_db" does not exist
```

**Çözüm:**
- pgAdmin4'te veritabanını oluşturun
- `.env` dosyasındaki `DB_NAME` değerini kontrol edin

### Şifre Hatası

```
Error: password authentication failed
```

**Çözüm:**
- `.env` dosyasındaki `DB_PASSWORD` değerini kontrol edin
- PostgreSQL kullanıcı şifresini doğrulayın

## 📝 Örnek .env Dosyası

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=student_db
DB_USER=postgres
DB_PASSWORD=postgres123

# JWT Secret
JWT_SECRET=my_super_secret_key_12345

# Server Port
PORT=3000
```

## ✅ Bağlantı Kontrolü

Proje başarıyla bağlandıysa:

1. ✅ Server başlar
2. ✅ Tablolar otomatik oluşturulur
3. ✅ Admin kullanıcısı oluşturulur
4. ✅ API endpoint'leri çalışır
5. ✅ Login/Register çalışır

## 🔐 Güvenlik Notları

- `.env` dosyasını **asla** git'e commit etmeyin
- Production'da güçlü bir `JWT_SECRET` kullanın
- Veritabanı şifresini güvenli tutun
- `.gitignore` dosyasında `.env` olmalı

