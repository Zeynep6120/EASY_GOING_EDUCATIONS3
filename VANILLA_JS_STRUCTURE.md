# Vanilla JavaScript, HTML, SCSS Yapısı

## ✅ Proje Yapısı

Proje **sadece** vanilla JavaScript, HTML ve SCSS kullanıyor. JavaScript ve HTML **tamamen ayrı**.

## 📁 Dosya Organizasyonu

```
project-root/
├── public/                    # Public dosyalar
│   ├── *.html               # HTML sayfaları (JavaScript içermez)
│   ├── js/                  # JavaScript dosyaları (Vanilla JS)
│   │   ├── utils.js         # Utility fonksiyonlar
│   │   ├── header.js        # Header işlevselliği
│   │   ├── app.js           # Login/Register
│   │   ├── home.js          # Home sayfası
│   │   ├── about.js         # About sayfası
│   │   ├── courses.js       # Courses sayfası
│   │   ├── events.js        # Events sayfası
│   │   ├── contact.js       # Contact sayfası
│   │   ├── dashboard.js     # Dashboard
│   │   └── students.js      # Students listesi
│   ├── css/                 # Derlenmiş CSS dosyaları
│   └── img/                 # Görseller
│
├── src/                      # Kaynak dosyalar (SCSS ve geliştirme için)
│   ├── styles/              # SCSS dosyaları
│   │   ├── _variables.scss
│   │   ├── _mixins.scss
│   │   ├── index.scss       # Ana SCSS dosyası
│   │   └── ...
│   ├── helpers/             # Helper dosyalar (geliştirme için)
│   ├── services/            # Service dosyalar (geliştirme için)
│   └── components/          # Component dosyalar (geliştirme için)
│
├── db/                      # Veritabanı dosyaları
├── models/                  # Veritabanı modelleri
├── routes/                  # API route'ları
└── server.js                # Express server
```

## 🎯 Önemli Noktalar

### 1. HTML Dosyaları
- ✅ **Sadece HTML** - JavaScript kodu yok
- ✅ JavaScript dosyaları `<script src="...">` ile yükleniyor
- ✅ ES6 modules (`type="module"`) **kullanılmıyor**
- ✅ Inline JavaScript **yok**

### 2. JavaScript Dosyaları
- ✅ **Vanilla JavaScript** - Import/Export yok
- ✅ Tüm fonksiyonlar global scope'da
- ✅ `public/js/` klasöründe
- ✅ Her sayfa için ayrı dosya

### 3. SCSS Dosyaları
- ✅ `src/styles/` klasöründe
- ✅ `npm run build:css` ile `public/css/style.css`'e derleniyor
- ✅ HTML dosyaları derlenmiş CSS'i kullanıyor

## 📝 Örnek Kullanım

### HTML Dosyası (home.html)
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <!-- HTML içeriği -->
  
  <!-- JavaScript dosyaları -->
  <script src="js/utils.js"></script>
  <script src="js/header.js"></script>
  <script src="js/home.js"></script>
</body>
</html>
```

### JavaScript Dosyası (home.js)
```javascript
// Vanilla JavaScript - Import/Export yok
document.addEventListener("DOMContentLoaded", function() {
  if (typeof initHeader === "function") {
    initHeader();
  }
  loadSlider();
});

async function loadSlider() {
  // API çağrısı
  const res = await fetch("/api/content/slides");
  // ...
}
```

## 🔄 Build Süreci

1. **SCSS Derleme**:
   ```bash
   npm run build:css
   ```
   `src/styles/index.scss` → `public/css/style.css`

2. **JavaScript**: 
   - Derleme gerekmez
   - Doğrudan `public/js/*.js` dosyaları kullanılır

3. **Server Başlatma**:
   ```bash
   npm run dev
   ```

## ✅ Kontrol Listesi

- ✅ HTML dosyalarında inline JavaScript yok
- ✅ HTML dosyalarında `type="module"` yok
- ✅ JavaScript dosyalarında `import/export` yok
- ✅ JavaScript dosyaları `public/js/` klasöründe
- ✅ SCSS dosyaları `src/styles/` klasöründe
- ✅ Derlenmiş CSS `public/css/` klasöründe
- ✅ Tüm fonksiyonlar global scope'da

## 🎯 Sonuç

Proje **tamamen vanilla JavaScript, HTML ve SCSS** kullanıyor. JavaScript ve HTML **tamamen ayrı**. ES6 modules veya build tool'ları kullanılmıyor.

