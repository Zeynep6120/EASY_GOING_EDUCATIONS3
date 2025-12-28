-- School Management System Database Schema
-- Total: 17 tables

-- Roles lookup table (normalized)
CREATE TABLE IF NOT EXISTS roles (
  role_id SERIAL PRIMARY KEY,
  role_name VARCHAR(30) UNIQUE NOT NULL
);

-- Seed default roles
INSERT INTO roles (role_name) VALUES
('ADMIN'),
('MANAGER'),
('ASSISTANT_MANAGER'),
('INSTRUCTOR'),
('STUDENT')
ON CONFLICT (role_name) DO NOTHING;

-- Users table (with roles)
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  surname VARCHAR(100) NOT NULL,
  gender VARCHAR(10),
  birth_date DATE,
  birth_place VARCHAR(100),
  phone_number VARCHAR(20),
  ssn VARCHAR(20) UNIQUE,
  email VARCHAR(100) UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  role VARCHAR(30) NOT NULL REFERENCES roles(role_name)
);

-- Admins specialization
CREATE TABLE IF NOT EXISTS admins (
  admin_id INTEGER PRIMARY KEY REFERENCES users(user_id),
  username VARCHAR(50),
  name VARCHAR(100),
  surname VARCHAR(100),
  email VARCHAR(100),
  gender VARCHAR(10),
  birth_date DATE,
  birth_place VARCHAR(100),
  phone_number VARCHAR(20),
  ssn VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_ssn ON admins(ssn);

-- Managers specialization
CREATE TABLE IF NOT EXISTS managers (
  manager_id INTEGER PRIMARY KEY REFERENCES users(user_id),
  username VARCHAR(50),
  name VARCHAR(100),
  surname VARCHAR(100),
  email VARCHAR(100),
  gender VARCHAR(10),
  birth_date DATE,
  birth_place VARCHAR(100),
  phone_number VARCHAR(20),
  ssn VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_managers_username ON managers(username);
CREATE INDEX IF NOT EXISTS idx_managers_email ON managers(email);
CREATE INDEX IF NOT EXISTS idx_managers_ssn ON managers(ssn);

-- Assistant Managers specialization
CREATE TABLE IF NOT EXISTS assistant_managers (
  assistant_manager_id INTEGER PRIMARY KEY REFERENCES users(user_id),
  username VARCHAR(50),
  name VARCHAR(100),
  surname VARCHAR(100),
  email VARCHAR(100),
  gender VARCHAR(10),
  birth_date DATE,
  birth_place VARCHAR(100),
  phone_number VARCHAR(20),
  ssn VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assistant_managers_username ON assistant_managers(username);
CREATE INDEX IF NOT EXISTS idx_assistant_managers_email ON assistant_managers(email);
CREATE INDEX IF NOT EXISTS idx_assistant_managers_ssn ON assistant_managers(ssn);

-- Students specialization
CREATE TABLE IF NOT EXISTS students (
  student_id INTEGER PRIMARY KEY REFERENCES users(user_id),
  username VARCHAR(50),
  name VARCHAR(100),
  surname VARCHAR(100),
  email VARCHAR(100),
  gender VARCHAR(10),
  birth_date DATE,
  birth_place VARCHAR(100),
  phone_number VARCHAR(20),
  ssn VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  father_name VARCHAR(100),
  mother_name VARCHAR(100),
  advisor_instructor_id INTEGER REFERENCES users(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_username ON students(username);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_ssn ON students(ssn);

-- Education terms
CREATE TABLE IF NOT EXISTS education_terms (
  term_id SERIAL PRIMARY KEY,
  term_name VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL
);

-- Course Programs
CREATE TABLE IF NOT EXISTS course_programs (
  course_program_id SERIAL PRIMARY KEY,
  day_of_week VARCHAR(10) NOT NULL,
  start_time TIME NOT NULL,
  stop_time TIME NOT NULL,
  education_term_id INTEGER NOT NULL REFERENCES education_terms(term_id),
  course_id INTEGER,
  course_name VARCHAR(255),
  program_id INTEGER,
  day VARCHAR(10),
  time VARCHAR(50),
  term VARCHAR(100)
);

-- Student-Program (M:N)
CREATE TABLE IF NOT EXISTS student_programs (
  student_id INTEGER REFERENCES students(student_id),
  course_program_id INTEGER REFERENCES course_programs(course_program_id),
  PRIMARY KEY (student_id, course_program_id)
);

-- Instructor-Program (M:N)
CREATE TABLE IF NOT EXISTS instructor_programs (
  instructor_id INTEGER NOT NULL REFERENCES users(user_id),
  course_program_id INTEGER NOT NULL REFERENCES course_programs(course_program_id),
  instructor_name VARCHAR(100),
  instructor_surname VARCHAR(100),
  instructor_email VARCHAR(100),
  instructor_username VARCHAR(50),
  program_id INTEGER,
  day VARCHAR(10),
  time VARCHAR(50),
  term VARCHAR(100),
  course_id INTEGER,
  course_name VARCHAR(255),
  PRIMARY KEY (instructor_id, course_program_id)
);

-- MEET (Instructor-Student Meetings)
CREATE TABLE IF NOT EXISTS meets (
  meet_id SERIAL PRIMARY KEY,
  instructor_id INTEGER REFERENCES users(user_id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  stop_time TIME NOT NULL,
  description TEXT
);

-- MEET_STUDENT (M:N relationship between MEET and STUDENT)
CREATE TABLE IF NOT EXISTS meet_students (
  meet_id INTEGER REFERENCES meets(meet_id),
  student_id INTEGER REFERENCES students(student_id),
  PRIMARY KEY (meet_id, student_id)
);

-- CONTACT_MESSAGE (Contact form messages)
CREATE TABLE IF NOT EXISTS contact_messages (
  msg_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  subject VARCHAR(200),
  message TEXT NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- COURSE (Public web content - Courses)
CREATE TABLE IF NOT EXISTS courses (
  course_id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  duration VARCHAR(50),
  price DECIMAL(10,2),
  level VARCHAR(50),
  image VARCHAR(255),
  is_featured BOOLEAN DEFAULT FALSE
);

-- INSTRUCTOR (Public web content - Instructors)
CREATE TABLE IF NOT EXISTS instructors (
  instructor_id INTEGER PRIMARY KEY REFERENCES users(user_id),
  name VARCHAR(100) NOT NULL,
  surname VARCHAR(100),
  username VARCHAR(50),
  email VARCHAR(100),
  title VARCHAR(100),
  bio TEXT,
  image VARCHAR(255),
  social_links JSONB,
  password VARCHAR(255)
);

-- EVENT (Public web content - Events)
CREATE TABLE IF NOT EXISTS events (
  event_id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  time TIMESTAMP,
  location VARCHAR(200),
  image VARCHAR(255)
);

-- SLIDE (Public web content - Slides)
CREATE TABLE IF NOT EXISTS slides (
  slide_id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image VARCHAR(255)
);

-- ============================================
-- DEFAULT ADMIN USER (Created via SQL/script only)
-- ============================================
-- Admin user credentials:
-- Username: admin
-- Password: 12345
-- Note: Admin users cannot be registered through the web form
-- To create admin user, run: npm run db:admin
