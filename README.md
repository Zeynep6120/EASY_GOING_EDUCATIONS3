# EasyGoing Education - Vanilla JS/HTML/SCSS Project

Bu proje, Next.js projesindeki yapıya benzer bir mimari kullanarak vanilla JavaScript, HTML ve SCSS ile geliştirilmiştir.

## 📁 Proje Yapısı (Çok Katmanlı Mimari)

```
project-root/
├── src/                  # Tüm kaynak kodlar
│   ├── controllers/      # Presentation Layer - HTTP isteklerini işler
│   │   ├── auth.js
│   │   ├── admin.js
│   │   ├── student.js
│   │   └── ...
│   ├── services/         # Business Logic Layer - İş mantığı
│   │   └── authService.js
│   ├── repositories/     # Data Access Layer - Veritabanı işlemleri
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Course.js
│   │   └── ...
│   ├── middleware/       # Middleware katmanı
│   │   ├── auth.js
│   │   └── rbac.js
│   ├── config/           # Konfigürasyon dosyaları
│   │   └── database.js
│   ├── utils/            # Yardımcı fonksiyonlar
│   │   ├── validation.js
│   │   ├── password.js
│   │   ├── jwt.js
│   │   └── response.js
│   └── styles/           # SCSS dosyaları
│       ├── index.scss
│       └── ...
├── db/                   # Veritabanı setup ve migration dosyaları
│   ├── connection.js     # (src/config/database.js'e yönlendirir)
│   ├── init.js
│   └── ...
├── scripts/              # Utility scriptler
├── public/               # Frontend dosyalar
│   ├── *.html           # HTML sayfaları
│   ├── css/             # Derlenmiş CSS
│   ├── js/              # Client-side JavaScript
│   └── img/             # Görseller
└── server.js             # Express server
```

## 🚀 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Veritabanını başlat
npm run db:init

# Admin kullanıcısı oluştur
npm run db:admin

# SCSS'yi derle
npm run build:css

# Development server'ı başlat
npm run dev
```

## 🛠️ Geliştirme

### SCSS Derleme

```bash
# Tek seferlik derleme
npm run build:css

# Watch mode (otomatik derleme)
npm run build:css:watch
```

### Server

```bash
# Development (nodemon ile)
npm run dev

# Production
npm start
```

## 📝 Kullanım

1. `.env` dosyasını oluşturun ve veritabanı bilgilerini girin
2. Veritabanını oluşturun: `CREATE DATABASE student_db;`
3. SCSS'yi derleyin: `npm run build:css`
4. Server'ı başlatın: `npm run dev`
5. Tarayıcıda açın: `http://localhost:3000`

## 🔐 Test Kullanıcıları

- **Admin**: `admin / 12345`
- **Student**: `student / 12345`
- **Teacher**: `teacher / 12345`

## 📚 Dokümantasyon

- `ARCHITECTURE.md` - Mimari detayları
- `MIGRATION_GUIDE.md` - Yapılan değişiklikler
- `DATABASE_SETUP.md` - Veritabanı kurulumu
- `MODELS_FIXES.md` - Model düzeltmeleri

## 🎯 Özellikler

- ✅ Role-based authentication
- ✅ PostgreSQL database
- ✅ Modular architecture
- ✅ SCSS styling
- ✅ ES6 modules
- ✅ Responsive design
