-- Update instructor profiles with course-specific titles, bios, and social links
-- Version: v5

BEGIN;

-- Web Development Fundamentals
UPDATE instructors 
SET 
  title = 'Senior Web Development Instructor',
  bio = 'Experienced web developer with 10+ years of expertise in modern web technologies including HTML5, CSS3, JavaScript, and popular frameworks. Specialized in building responsive, scalable web applications.',
  social_links = '{"linkedin": "https://linkedin.com/in/john-webdev", "github": "https://github.com/john-webdev", "twitter": "https://twitter.com/john_webdev"}'::jsonb
WHERE instructor_id = 88;

-- Advanced JavaScript & React
UPDATE instructors 
SET 
  title = 'JavaScript & React Expert',
  bio = 'Full-stack JavaScript developer specializing in React, Node.js, and modern ES6+ features. Passionate about teaching advanced JavaScript concepts and building interactive user interfaces.',
  social_links = '{"linkedin": "https://linkedin.com/in/sarah-javascript", "github": "https://github.com/sarah-js", "twitter": "https://twitter.com/sarah_js", "website": "https://sarahjs.dev"}'::jsonb
WHERE instructor_id = 89;

-- Full Stack Development
UPDATE instructors 
SET 
  title = 'Full Stack Development Specialist',
  bio = 'Expert in end-to-end web development with proficiency in both frontend and backend technologies. Experienced in MERN stack, RESTful APIs, and microservices architecture.',
  social_links = '{"linkedin": "https://linkedin.com/in/michael-fullstack", "github": "https://github.com/michael-fullstack", "medium": "https://medium.com/@michael-fullstack"}'::jsonb
WHERE instructor_id = 90;

-- Python Programming
UPDATE instructors 
SET 
  title = 'Python Programming Instructor',
  bio = 'Python enthusiast and software engineer with extensive experience in Python development, data analysis, and automation. Expert in Django, Flask, and Python best practices.',
  social_links = '{"linkedin": "https://linkedin.com/in/emily-python", "github": "https://github.com/emily-python", "twitter": "https://twitter.com/emily_python"}'::jsonb
WHERE instructor_id = 91;

-- Data Science & Machine Learning
UPDATE instructors 
SET 
  title = 'Data Science & ML Expert',
  bio = 'Data scientist and machine learning engineer with PhD in Statistics. Specialized in predictive modeling, deep learning, and big data analytics using Python, R, and TensorFlow.',
  social_links = '{"linkedin": "https://linkedin.com/in/david-datascience", "github": "https://github.com/david-datascience", "kaggle": "https://kaggle.com/david-datascience"}'::jsonb
WHERE instructor_id = 92;

-- Mobile App Development
UPDATE instructors 
SET 
  title = 'Mobile Development Specialist',
  bio = 'Mobile app developer with expertise in React Native, Flutter, iOS, and Android development. Created multiple successful apps with millions of downloads.',
  social_links = '{"linkedin": "https://linkedin.com/in/lisa-mobile", "github": "https://github.com/lisa-mobile", "twitter": "https://twitter.com/lisa_mobile"}'::jsonb
WHERE instructor_id = 93;

-- Cloud Computing & AWS
UPDATE instructors 
SET 
  title = 'Cloud Architecture Expert',
  bio = 'AWS Certified Solutions Architect with 8+ years of experience in cloud infrastructure, DevOps, and scalable system design. Expert in AWS, Azure, and Google Cloud Platform.',
  social_links = '{"linkedin": "https://linkedin.com/in/robert-cloud", "github": "https://github.com/robert-cloud", "twitter": "https://twitter.com/robert_cloud"}'::jsonb
WHERE instructor_id = 94;

-- UI/UX Design Principles
UPDATE instructors 
SET 
  title = 'Senior UI/UX Designer',
  bio = 'Award-winning UI/UX designer with 12+ years of experience creating intuitive and beautiful user experiences. Expert in design systems, user research, and prototyping tools.',
  social_links = '{"linkedin": "https://linkedin.com/in/jennifer-uiux", "dribbble": "https://dribbble.com/jennifer-uiux", "behance": "https://behance.net/jennifer-uiux"}'::jsonb
WHERE instructor_id = 95;

-- Cybersecurity Fundamentals
UPDATE instructors 
SET 
  title = 'Cybersecurity Expert',
  bio = 'Certified Ethical Hacker and security consultant with extensive experience in penetration testing, network security, and security architecture. CISSP and CEH certified.',
  social_links = '{"linkedin": "https://linkedin.com/in/james-cyber", "github": "https://github.com/james-cyber", "twitter": "https://twitter.com/james_cyber"}'::jsonb
WHERE instructor_id = 96;

-- DevOps & CI/CD
UPDATE instructors 
SET 
  title = 'DevOps Engineering Specialist',
  bio = 'DevOps engineer and automation expert specializing in CI/CD pipelines, containerization (Docker, Kubernetes), infrastructure as code, and monitoring solutions.',
  social_links = '{"linkedin": "https://linkedin.com/in/patricia-devops", "github": "https://github.com/patricia-devops", "twitter": "https://twitter.com/patricia_devops"}'::jsonb
WHERE instructor_id = 97;

-- Database Design & SQL
UPDATE instructors 
SET 
  title = 'Database Architecture Expert',
  bio = 'Database administrator and architect with expertise in PostgreSQL, MySQL, MongoDB, and database optimization. Specialized in data modeling, query optimization, and database security.',
  social_links = '{"linkedin": "https://linkedin.com/in/william-database", "github": "https://github.com/william-database", "stackoverflow": "https://stackoverflow.com/users/william-database"}'::jsonb
WHERE instructor_id = 98;

-- Blockchain Development
UPDATE instructors 
SET 
  title = 'Blockchain Technology Expert',
  bio = 'Blockchain developer and cryptocurrency expert with deep knowledge of Ethereum, Solidity, smart contracts, and DeFi protocols. Active contributor to blockchain open-source projects.',
  social_links = '{"linkedin": "https://linkedin.com/in/amanda-blockchain", "github": "https://github.com/amanda-blockchain", "twitter": "https://twitter.com/amanda_blockchain"}'::jsonb
WHERE instructor_id = 99;

-- Game Development
UPDATE instructors 
SET 
  title = 'Game Development Specialist',
  bio = 'Professional game developer with experience in Unity, Unreal Engine, and game design principles. Created multiple indie games and worked on AAA game projects.',
  social_links = '{"linkedin": "https://linkedin.com/in/christopher-gamedev", "github": "https://github.com/christopher-gamedev", "twitter": "https://twitter.com/chris_gamedev"}'::jsonb
WHERE instructor_id = 100;

-- AI & Deep Learning
UPDATE instructors 
SET 
  title = 'AI & Deep Learning Researcher',
  bio = 'AI researcher and deep learning expert with PhD in Computer Science. Specialized in neural networks, computer vision, and natural language processing. Published multiple research papers.',
  social_links = '{"linkedin": "https://linkedin.com/in/nancy-ai", "github": "https://github.com/nancy-ai", "twitter": "https://twitter.com/nancy_ai", "google_scholar": "https://scholar.google.com/citations?user=nancy-ai"}'::jsonb
WHERE instructor_id = 101;

-- System Administration & Linux
UPDATE instructors 
SET 
  title = 'Linux System Administrator',
  bio = 'Senior Linux system administrator and infrastructure engineer with 15+ years of experience in server management, automation, shell scripting, and system security. RHCE and LPIC certified.',
  social_links = '{"linkedin": "https://linkedin.com/in/thomas-linux", "github": "https://github.com/thomas-linux", "twitter": "https://twitter.com/thomas_linux"}'::jsonb
WHERE instructor_id = 102;

COMMIT;

