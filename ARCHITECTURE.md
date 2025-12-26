# Proje Mimarisi

Bu proje, Next.js projesindeki yapıya benzer bir mimari kullanmaktadır.

## 📁 Klasör Yapısı

```
project-root/
├── src/                          # Kaynak dosyalar
│   ├── actions/                  # İş mantığı ve form işlemleri
│   ├── components/              # UI Bileşenleri
│   │   ├── common/              # Ortak bileşenler
│   │   │   ├── header/          # Header bileşenleri
│   │   │   └── footer/          # Footer bileşenleri
│   │   ├── dashboard/           # Dashboard bileşenleri
│   │   ├── home/                # Ana sayfa bileşenleri
│   │   ├── about/               # About sayfası bileşenleri
│   │   ├── courses/             # Courses sayfası bileşenleri
│   │   ├── events/              # Events sayfası bileşenleri
│   │   └── contact/             # Contact sayfası bileşenleri
│   ├── helpers/                 # Yardımcı fonksiyonlar
│   │   ├── config.js           # Yapılandırma
│   │   ├── api-routes.js       # API route tanımları
│   │   └── utils.js             # Utility fonksiyonlar
│   ├── services/                # API servisleri
│   │   ├── api.js              # Ana API servisi
│   │   ├── home.js             # Home sayfası servisleri
│   │   ├── about.js            # About sayfası servisleri
│   │   ├── courses.js          # Courses sayfası servisleri
│   │   ├── events.js           # Events sayfası servisleri
│   │   ├── contact.js          # Contact sayfası servisleri
│   │   └── dashboard.js        # Dashboard servisleri
│   ├── styles/                  # SCSS dosyaları
│   │   ├── variables.scss      # Değişkenler
│   │   ├── mixins.scss         # Mixin'ler
│   │   ├── base.scss           # Temel stiller
│   │   ├── header.scss         # Header stilleri
│   │   ├── footer.scss         # Footer stilleri
│   │   ├── home.scss           # Home sayfası stilleri
│   │   ├── dashboard.scss      # Dashboard stilleri
│   │   └── index.scss          # Ana SCSS dosyası (tüm stilleri import eder)
│   ├── middleware/             # Client-side middleware
│   │   └── auth.js             # Authentication middleware
│   └── config/                  # Yapılandırma dosyaları
├── public/                      # Public dosyalar (HTML ve statik dosyalar)
│   ├── *.html                  # HTML sayfaları
│   ├── css/                    # Derlenmiş CSS dosyaları
│   ├── js/                     # Derlenmiş/bundle edilmiş JS dosyaları
│   └── img/                    # Görseller
├── db/                          # Veritabanı dosyaları
├── models/                      # Veritabanı modelleri
├── routes/                      # API route'ları
├── middleware/                  # Server-side middleware
└── server.js                    # Express server

```

## 🔄 Dosya Organizasyonu

### src/actions/
Form işlemleri ve iş mantığı (şu an için kullanılmıyor, gelecekte eklenebilir)

### src/components/
UI bileşenleri - Her bileşen kendi klasöründe

### src/helpers/
- `config.js`: Proje yapılandırması
- `api-routes.js`: API endpoint tanımları
- `utils.js`: Yardımcı fonksiyonlar (auth, format, vb.)

### src/services/
- `api.js`: Merkezi API servisi
- Sayfa-specific servisler (home.js, about.js, vb.)

### src/styles/
SCSS dosyaları - Modüler stil yapısı

### src/middleware/
Client-side middleware (auth kontrolü, route protection)

## 📦 Build Sistemi

SCSS dosyalarını CSS'e derlemek ve JavaScript dosyalarını bundle etmek için:

```bash
# SCSS compile (örnek)
sass src/styles/index.scss public/css/style.css

# JavaScript bundle (örnek - esbuild veya webpack kullanılabilir)
```

## 🔗 Import Yapısı

JavaScript dosyalarında ES6 module syntax kullanılır:

```javascript
import { config } from "../helpers/config.js";
import { api } from "../services/api.js";
import { isLoggedIn } from "../helpers/utils.js";
```

## 📝 HTML Dosyalarında Kullanım

HTML dosyalarında type="module" kullanılır:

```html
<script type="module" src="/js/main.js"></script>
```

## 🎯 Avantajlar

1. **Modüler Yapı**: Her bileşen kendi klasöründe
2. **Yeniden Kullanılabilirlik**: Ortak bileşenler ve helper'lar
3. **Bakım Kolaylığı**: Organize ve temiz kod yapısı
4. **Ölçeklenebilirlik**: Yeni özellikler kolayca eklenebilir
5. **Next.js Benzeri**: Next.js projesinden geçiş kolay

