-- Add 6 new IT courses to the database
-- Run this script in your PostgreSQL database

INSERT INTO courses (title, description, duration, price, level, image, is_featured)
VALUES 
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
ON CONFLICT DO NOTHING;

-- Verify the courses were added
SELECT course_id, title, level, duration FROM courses ORDER BY course_id DESC LIMIT 6;

