# EasyGoing Education - Project Structure

## Proje Yapısı

Bu proje, Next.js projesini vanilla JavaScript, HTML ve SCSS kullanarak yeniden oluşturulmuştur.

### Teknoloji Stack
- **Frontend**: HTML, JavaScript (Vanilla), SCSS/CSS
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (pgAdmin4)
- **Authentication**: JWT (JSON Web Tokens)

### Klasör Yapısı

```
public/
├── css/
│   ├── style.css          # Ana stil dosyası
│   ├── dashboard.css      # Dashboard stilleri
│   ├── variables.scss     # SCSS değişkenleri
│   ├── mixins.scss        # SCSS mixin'leri
│   ├── base.scss          # Temel stiller
│   ├── header.scss        # Header stilleri
│   ├── footer.scss        # Footer stilleri
│   └── home.scss          # Ana sayfa stilleri
├── js/
│   ├── api.js             # API çağrıları
│   ├── utils.js           # Yardımcı fonksiyonlar
│   ├── header.js          # Header işlevselliği
│   ├── home.js            # Ana sayfa işlevselliği
│   ├── about.js           # About sayfası işlevselliği
│   ├── courses.js         # Courses sayfası işlevselliği
│   ├── events.js          # Events sayfası işlevselliği
│   ├── contact.js         # Contact sayfası işlevselliği
│   ├── dashboard.js       # Dashboard işlevselliği
│   ├── app.js             # Login/Register işlevselliği
│   ├── students.js        # Students listesi
│   └── details.js         # Detay sayfası
├── index.html             # Login/Register sayfası
├── home.html              # Ana sayfa
├── about.html              # Hakkımızda sayfası
├── courses.html            # Kurslar sayfası
├── events.html             # Etkinlikler sayfası
├── contact.html            # İletişim sayfası
├── dashboard.html          # Dashboard ana sayfası
├── students.html           # Öğrenciler listesi
├── student-details.html    # Öğrenci detay sayfası
└── unauthorized.html       # Yetkisiz erişim sayfası

routes/
├── auth.js                 # Authentication routes
├── users.js                # User management routes
├── contact.js              # Contact message routes
├── content.js              # Public content routes (courses, events, etc.)
├── terms.js                # Education term routes
├── lessons.js              # Lesson routes
├── lesson-programs.js      # Lesson program routes
├── student-info.js         # Student info routes
└── meets.js                # Meet routes

models/
├── User.js                 # User model
├── Student.js              # Student model
├── Teacher.js              # Teacher model
├── ContactMessage.js       # Contact message model
├── Course.js               # Course model
├── Event.js                # Event model
├── Instructor.js           # Instructor model
└── ...                     # Diğer modeller

middleware/
├── auth.js                 # JWT authentication middleware
└── rbac.js                 # Role-based access control

db/
├── connection.js           # Database connection
├── createTables.js         # Table creation script
├── createAdmin.js          # Admin user creation
└── init.js                 # Database initialization
```

## Özellikler

### Public Sayfalar
1. **Home** (`/home.html`)
   - Slider (carousel)
   - Welcome section
   - Featured courses
   - Upcoming events
   - Mobile app section

2. **About** (`/about.html`)
   - Welcome section
   - Instructors listesi

3. **Courses** (`/courses.html`)
   - Tüm kursların listesi

4. **Events** (`/events.html`)
   - Tüm etkinliklerin listesi

5. **Contact** (`/contact.html`)
   - İletişim formu
   - Google Maps entegrasyonu

### Authentication
- **Login** (`/index.html`)
- **Register** (`/index.html` - tab içinde)
- JWT token tabanlı authentication
- Role-based access control

### Dashboard
- **Dashboard** (`/dashboard.html`)
  - Role-based navigation
  - Her rol için farklı menü seçenekleri

### Roller ve Yetkiler

1. **ADMIN**
   - Tüm modüllere erişim
   - Admin, Manager, Assistant Manager, Teacher, Student yönetimi
   - Lesson, Term, Program yönetimi
   - Contact messages

2. **MANAGER**
   - Assistant Manager yönetimi
   - Contact messages

3. **ASSISTANT_MANAGER**
   - Teacher yönetimi
   - Student yönetimi
   - Lesson yönetimi
   - Education Term yönetimi
   - Program yönetimi

4. **TEACHER**
   - Student Info yönetimi
   - Meet yönetimi

5. **STUDENT**
   - Ders seçimi
   - Notlar ve toplantılar

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/students` - Get all students
- `GET /api/auth/teachers` - Get all teachers

### Content (Public)
- `GET /api/content/courses` - Get all courses
- `GET /api/content/courses/featured` - Get featured courses
- `GET /api/content/courses/:id` - Get course by ID
- `GET /api/content/instructors` - Get all instructors
- `GET /api/content/events` - Get all events
- `GET /api/content/slides` - Get all slides

### Contact
- `POST /api/contact` - Send contact message

## Kullanım

### Kurulum
```bash
npm install
```

### Database Setup
```bash
# Create tables
npm run db:init

# Create admin user
npm run db:admin
```

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## Notlar

- SCSS dosyaları CSS'e derlenmeli (production için)
- Tüm görseller `/public/img/` klasöründe olmalı
- Environment variables için `.env` dosyası kullanılmalı
- JWT_SECRET environment variable'ı ayarlanmalı

