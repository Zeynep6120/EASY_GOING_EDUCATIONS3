# Resim Kurulum Talimatları

## Resim Klasör Yapısı

Projede kullanılan tüm resimlerin `/public/img/` klasörü altında olması gerekiyor.

### Gerekli Klasör Yapısı

```
public/
└── img/
    ├── about/
    │   └── welcome.jpg
    ├── courses/
    │   ├── course-01.jpg
    │   ├── course-02.jpg
    │   ├── course-03.jpg
    │   ├── course-04.jpg
    │   ├── course-05.jpg
    │   ├── course-06.jpg
    │   ├── course-07.jpg
    │   ├── course-08.jpg
    │   └── course-09.jpg
    ├── events/
    │   ├── events-01.jpg
    │   ├── events-02.jpg
    │   ├── events-03.jpg
    │   ├── events-04.jpg
    │   ├── events-05.jpg
    │   ├── events-06.jpg
    │   ├── events-07.jpg
    │   ├── events-08.jpg
    │   ├── events-09.jpg
    │   ├── events-10.jpg
    │   ├── events-11.jpg
    │   ├── events-12.jpg
    │   ├── events-13.jpg
    │   ├── events-14.jpg
    │   ├── events-15.jpg
    │   ├── events-16.jpg
    │   ├── events-17.jpg
    │   ├── events-18.jpg
    │   ├── events-19.jpg
    │   └── events-20.jpg
    ├── instructors/
    │   ├── instructor-01.jpg
    │   ├── instructor-02.jpg
    │   ├── instructor-03.jpg
    │   ├── instructor-04.jpg
    │   ├── instructor-05.jpg
    │   └── instructor-06.jpg
    ├── logos/
    │   ├── favicon.png
    │   ├── logo-192.png
    │   ├── logo-512.png
    │   ├── logo-dark.png
    │   ├── logo-light.png
    │   └── logo-one-line.png
    ├── slider/
    │   ├── slider-01.jpg
    │   └── slider-02.jpg
    └── errors/
        └── error.png
```

## Resimleri Kopyalama

### Yöntem 1: Terminal ile (Önerilen)

```bash
# 1. Klasörleri oluştur
mkdir -p public/img/{about,courses,events,instructors,logos,slider,errors}

# 2. Next.js projesindeki resimleri kopyala
cp -r /Users/zeynepozmen/Downloads/MODUL/easy-going-education/public/img/* public/img/
```

### Yöntem 2: Finder ile (Mac)

1. Next.js projesindeki `public/img/` klasörünü açın
2. Tüm alt klasörleri seçin (about, courses, events, vb.)
3. Yeni projenizin `public/` klasörüne kopyalayın
4. Klasör adını `img` olarak ayarlayın

### Yöntem 3: Manuel Olarak

Her klasörü tek tek oluşturup resimleri kopyalayın.

## Kullanılan Resimler

### Ana Sayfa (home.html)
- **Slider**: `img/slider/slider-01.jpg`, `slider-02.jpg`
- **Welcome**: `img/about/welcome.jpg`
- **Featured Courses**: `img/courses/course-*.jpg`
- **Events**: `img/events/events-*.jpg`

### About Sayfası
- **Welcome**: `img/about/welcome.jpg`
- **Instructors**: `img/instructors/instructor-*.jpg`

### Courses Sayfası
- **Courses**: `img/courses/course-*.jpg`

### Events Sayfası
- **Events**: `img/events/events-*.jpg`

## Notlar

- Tüm resimler JPG veya PNG formatında olmalı
- Resim boyutları optimize edilmiş olmalı (web için)
- Eğer resimler yoksa, placeholder resimler kullanılabilir veya CSS ile görsel efektler eklenebilir
- Logo dosyaları favicon ve site logosu için kullanılır

## Alternatif: Placeholder Resimler

Eğer resimler henüz hazır değilse, placeholder servisleri kullanabilirsiniz:

```html
<!-- Örnek placeholder -->
<img src="https://via.placeholder.com/800x600" alt="Course" />
```

Veya CSS ile gradient/renkli arka planlar kullanabilirsiniz.

