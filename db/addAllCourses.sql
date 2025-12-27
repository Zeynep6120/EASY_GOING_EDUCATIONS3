-- Add all 15 courses (9 original + 6 new) to the database
-- This will insert courses that don't already exist

-- First, delete existing courses to start fresh (optional - comment out if you want to keep existing)
-- DELETE FROM courses;

-- Insert all 15 courses
INSERT INTO courses (title, description, duration, price, level, image, is_featured)
VALUES 
  -- Original 9 courses
  (
    'Web Development Fundamentals',
    'Learn the basics of HTML, CSS, and JavaScript to build modern websites. Perfect for beginners who want to start their journey in web development.',
    '8 weeks',
    0,
    'Beginner',
    'course-01.jpg',
    true
  ),
  (
    'Advanced JavaScript & React',
    'Master modern JavaScript and React framework. Build dynamic, interactive web applications with state management and routing.',
    '12 weeks',
    0,
    'Advanced',
    'course-02.jpg',
    true
  ),
  (
    'Full Stack Development',
    'Complete course covering frontend and backend development. Learn Node.js, Express, databases, and deployment strategies.',
    '16 weeks',
    0,
    'Intermediate',
    'course-03.jpg',
    true
  ),
  (
    'Python Programming',
    'From basics to advanced Python programming. Learn data structures, algorithms, and popular frameworks like Django and Flask.',
    '10 weeks',
    0,
    'Beginner',
    'course-04.jpg',
    false
  ),
  (
    'Data Science & Machine Learning',
    'Explore data analysis, visualization, and machine learning algorithms. Work with real-world datasets and build predictive models.',
    '14 weeks',
    0,
    'Advanced',
    'course-05.jpg',
    false
  ),
  (
    'Mobile App Development',
    'Build native and cross-platform mobile applications. Learn React Native, Flutter, and mobile UI/UX design principles.',
    '12 weeks',
    0,
    'Intermediate',
    'course-06.jpg',
    false
  ),
  (
    'Cloud Computing & AWS',
    'Master cloud infrastructure, deployment, and scaling. Learn AWS services, Docker, Kubernetes, and DevOps practices.',
    '10 weeks',
    0,
    'Advanced',
    'course-07.jpg',
    false
  ),
  (
    'UI/UX Design Principles',
    'Learn design thinking, user research, wireframing, and prototyping. Create beautiful and user-friendly interfaces.',
    '8 weeks',
    0,
    'Beginner',
    'course-08.jpg',
    false
  ),
  (
    'Cybersecurity Fundamentals',
    'Understand security threats, encryption, network security, and ethical hacking. Protect systems and data from attacks.',
    '12 weeks',
    0,
    'Intermediate',
    'course-09.jpg',
    false
  ),
  -- New 6 courses
  (
    'DevOps & CI/CD',
    'Learn continuous integration, continuous deployment, and infrastructure as code. Master Git, Jenkins, Docker, and automation tools.',
    '10 weeks',
    0,
    'Intermediate',
    'course-10.jpg',
    false
  ),
  (
    'Database Design & SQL',
    'Master database design principles, normalization, and SQL queries. Learn PostgreSQL, MySQL, and database optimization techniques.',
    '8 weeks',
    0,
    'Beginner',
    'course-11.jpg',
    false
  ),
  (
    'Blockchain Development',
    'Build decentralized applications using blockchain technology. Learn Solidity, smart contracts, Ethereum, and Web3 development.',
    '14 weeks',
    0,
    'Advanced',
    'course-12.jpg',
    false
  ),
  (
    'Game Development',
    'Create engaging games using Unity, Unreal Engine, and game design principles. Learn 2D/3D graphics, physics, and game mechanics.',
    '16 weeks',
    0,
    'Intermediate',
    'course-13.jpg',
    false
  ),
  (
    'AI & Deep Learning',
    'Dive deep into artificial intelligence, neural networks, and deep learning frameworks. Build AI models with TensorFlow and PyTorch.',
    '14 weeks',
    0,
    'Advanced',
    'course-14.jpg',
    false
  ),
  (
    'System Administration & Linux',
    'Master Linux system administration, shell scripting, server management, and network configuration. Learn to manage production systems.',
    '12 weeks',
    0,
    'Intermediate',
    'course-15.jpg',
    false
  )
ON CONFLICT (title) DO NOTHING;

-- Verify all courses
SELECT COUNT(*) as total_courses FROM courses;
SELECT course_id, title, level FROM courses ORDER BY course_id;

