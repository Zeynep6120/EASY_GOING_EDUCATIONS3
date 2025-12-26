# Admin Kullanıcısı Bilgileri

## Admin Nerede?

Admin kullanıcısı **veritabanında** (`users` tablosunda) saklanır ve aşağıdaki yollarla oluşturulur:

### 1. Otomatik Oluşturma (Önerilen)

Admin kullanıcısı **sunucu başlangıcında otomatik olarak** oluşturulur:

```bash
npm start
```

Sunucu başladığında:
- `db/init.js` dosyası çalışır
- Tablolar oluşturulur
- Admin kullanıcısı kontrol edilir
- Yoksa otomatik oluşturulur

### 2. Manuel Oluşturma

Admin kullanıcısını manuel olarak oluşturmak için:

```bash
npm run db:admin
```

### 3. Dosya Konumları

Admin ile ilgili dosyalar:

- **`db/createAdmin.js`** - Admin oluşturma scripti
- **`db/init.js`** - Sunucu başlangıcında admin kontrolü yapar
- **`routes/auth.js`** - Admin kaydını engeller (register endpoint'inde)

### 4. Admin Bilgileri

- **Username:** `admin`
- **Password:** `12345`
- **Email:** `admin@school.com`
- **Role:** `ADMIN`
- **Name:** `System`
- **Surname:** `Administrator`

### 5. Admin Durumunu Kontrol Etme

**Frontend'den:**
1. Login sayfasında "Admin Status" butonuna tıklayın
2. Admin varsa bilgileri gösterilir

**API'den:**
```bash
GET http://localhost:3000/api/auth/admin-status
```

**Veritabanından:**
```sql
SELECT * FROM users WHERE role = 'ADMIN' OR username = 'admin';
```

### 6. Önemli Notlar

- ✅ Admin kullanıcısı **kayıt formundan oluşturulamaz**
- ✅ Admin sadece **SQL script veya `npm run db:admin`** ile oluşturulur
- ✅ Admin otomatik oluşturulur (sunucu başlangıcında)
- ✅ Admin bilgileri değiştirilebilir (veritabanından)

### 7. Admin Oluşturma Script'i

`db/createAdmin.js` dosyası:
- Admin kullanıcısının var olup olmadığını kontrol eder
- Yoksa oluşturur
- Varsa bilgilerini gösterir
- Password'ü bcrypt ile hash'ler

### 8. Sorun Giderme

**Admin bulunamıyorsa:**
1. Sunucuyu yeniden başlatın: `npm start`
2. Manuel oluşturun: `npm run db:admin`
3. Veritabanını kontrol edin
4. Console loglarını kontrol edin

**Admin zaten varsa:**
- Script admin'i tekrar oluşturmaz
- Mevcut admin bilgilerini gösterir
- Güvenli bir şekilde çalışır

