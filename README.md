# EasyGoing Education - Vanilla JS/HTML/SCSS Project

Bu proje, Next.js projesindeki yapıya benzer bir mimari kullanarak vanilla JavaScript, HTML ve SCSS ile geliştirilmiştir.

## 📁 Proje Yapısı

```
project-root/
├── src/                    # Kaynak dosyalar
│   ├── actions/           # İş mantığı
│   ├── components/        # UI Bileşenleri
│   ├── helpers/          # Yardımcı fonksiyonlar
│   ├── services/         # API servisleri
│   ├── styles/           # SCSS dosyaları
│   ├── middleware/       # Client-side middleware
│   └── models/           # Veritabanı modelleri
├── public/                # Public dosyalar
│   ├── *.html           # HTML sayfaları
│   ├── css/             # Derlenmiş CSS
│   └── img/             # Görseller
├── db/                   # Veritabanı dosyaları
├── routes/               # API route'ları
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
