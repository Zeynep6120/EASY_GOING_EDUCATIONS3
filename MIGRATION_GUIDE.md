# Mimari Düzenleme Rehberi

## ✅ Yapılan Değişiklikler

Proje, Next.js projesindeki yapıya benzer bir mimariye göre yeniden düzenlendi.

## 📁 Yeni Klasör Yapısı

```
project-root/
├── src/                          # Kaynak dosyalar
│   ├── actions/                  # İş mantığı (gelecekte kullanılabilir)
│   ├── components/               # UI Bileşenleri
│   │   └── common/
│   │       └── header/
│   │           └── header.js    # Header bileşeni
│   ├── helpers/                  # Yardımcı fonksiyonlar
│   │   ├── config.js            # Yapılandırma
│   │   ├── api-routes.js        # API route tanımları
│   │   └── utils.js             # Utility fonksiyonlar
│   ├── services/                 # API servisleri
│   │   ├── api.js               # Ana API servisi
│   │   ├── home.js              # Home sayfası
│   │   ├── about.js             # About sayfası
│   │   ├── courses.js           # Courses sayfası
│   │   ├── events.js            # Events sayfası
│   │   ├── contact.js           # Contact sayfası
│   │   └── dashboard.js         # Dashboard
│   ├── styles/                   # SCSS dosyaları
│   │   ├── variables.scss
│   │   ├── mixins.scss
│   │   ├── base.scss
│   │   ├── header.scss
│   │   ├── footer.scss
│   │   ├── home.scss
│   │   ├── dashboard.scss
│   │   └── index.scss           # Ana SCSS dosyası
│   ├── middleware/              # Client-side middleware
│   └── config/                  # Yapılandırma dosyaları
├── public/                       # Public dosyalar
│   ├── *.html                   # HTML sayfaları
│   ├── css/                     # Derlenmiş CSS
│   ├── js/                      # (Eski - artık kullanılmıyor)
│   └── img/                     # Görseller
```

## 🔄 Değişiklikler

### JavaScript Dosyaları
- `public/js/*.js` → `src/services/*.js` (sayfa-specific)
- `public/js/api.js` → `src/services/api.js`
- `public/js/utils.js` → `src/helpers/utils.js`
- `public/js/header.js` → `src/components/common/header/header.js`

### SCSS Dosyaları
- `public/css/*.scss` → `src/styles/*.scss`
- Ana SCSS dosyası: `src/styles/index.scss`

### HTML Dosyaları
- Artık ES6 module syntax kullanıyor
- `<script type="module">` ile import ediliyor

## 🛠️ Build Komutları

### SCSS Derleme
```bash
# Tek seferlik derleme
npm run build:css

# Watch mode (otomatik derleme)
npm run build:css:watch
```

### Tüm Build
```bash
npm run build
```

## 📝 Kullanım

### HTML Dosyalarında

**Önceki:**
```html
<script src="js/utils.js"></script>
<script src="js/api.js"></script>
<script src="js/header.js"></script>
<script src="js/home.js"></script>
```

**Yeni:**
```html
<script type="module">
  import { initHeader } from "/src/components/common/header/header.js";
  import { loadSlider, loadFeaturedCourses } from "/src/services/home.js";
  
  initHeader();
  loadSlider();
  loadFeaturedCourses();
</script>
```

### JavaScript Dosyalarında

**Önceki:**
```javascript
const API_BASE = "/api";
```

**Yeni:**
```javascript
import { API_BASE } from "../helpers/api-routes.js";
import { api } from "../services/api.js";
import { isLoggedIn } from "../helpers/utils.js";
```

## ⚠️ Önemli Notlar

1. **SCSS Derleme**: SCSS dosyalarını CSS'e derlemek için `npm run build:css` çalıştırın
2. **ES6 Modules**: Tarayıcılar ES6 module'leri destekliyor, ancak development için local server gerekli
3. **Path'ler**: Import path'leri `/src/` ile başlıyor (absolute path)
4. **Eski Dosyalar**: `public/js/` klasöründeki eski dosyalar artık kullanılmıyor (silinebilir)

## 🚀 Geliştirme

1. SCSS dosyalarını düzenleyin: `src/styles/`
2. JavaScript dosyalarını düzenleyin: `src/services/` veya `src/helpers/`
3. SCSS'yi derleyin: `npm run build:css:watch` (watch mode)
4. Server'ı başlatın: `npm run dev`

## 📦 Production

Production için:
```bash
npm run build  # SCSS derle
npm start      # Server başlat
```

