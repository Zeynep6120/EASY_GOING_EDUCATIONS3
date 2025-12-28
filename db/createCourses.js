const pool = require("./connection");
require("dotenv").config();

// Sample course data for public website
const courses = [
  {
    title: "Web Development Fundamentals",
    description: "Learn the basics of HTML, CSS, and JavaScript to build modern websites. Perfect for beginners who want to start their journey in web development.",
    duration: "8 weeks",
    price: 0,
    level: "Beginner",
    image: "course-01.jpg",
    is_featured: true,
  },
  {
    title: "Advanced JavaScript & React",
    description: "Master modern JavaScript and React framework. Build dynamic, interactive web applications with state management and routing.",
    duration: "12 weeks",
    price: 0,
    level: "Advanced",
    image: "course-02.jpg",
    is_featured: true,
  },
  {
    title: "Full Stack Development",
    description: "Complete course covering frontend and backend development. Learn Node.js, Express, databases, and deployment strategies.",
    duration: "16 weeks",
    price: 0,
    level: "Intermediate",
    image: "course-03.jpg",
    is_featured: true,
  },
  {
    title: "Python Programming",
    description: "From basics to advanced Python programming. Learn data structures, algorithms, and popular frameworks like Django and Flask.",
    duration: "10 weeks",
    price: 0,
    level: "Beginner",
    image: "course-04.jpg",
    is_featured: false,
  },
  {
    title: "Data Science & Machine Learning",
    description: "Explore data analysis, visualization, and machine learning algorithms. Work with real-world datasets and build predictive models.",
    duration: "14 weeks",
    price: 0,
    level: "Advanced",
    image: "course-05.jpg",
    is_featured: false,
  },
  {
    title: "Mobile App Development",
    description: "Build native and cross-platform mobile applications. Learn React Native, Flutter, and mobile UI/UX design principles.",
    duration: "12 weeks",
    price: 0,
    level: "Intermediate",
    image: "course-06.jpg",
    is_featured: false,
  },
  {
    title: "Cloud Computing & AWS",
    description: "Master cloud infrastructure, deployment, and scaling. Learn AWS services, Docker, Kubernetes, and DevOps practices.",
    duration: "10 weeks",
    price: 0,
    level: "Advanced",
    image: "course-07.jpg",
    is_featured: false,
  },
  {
    title: "UI/UX Design Principles",
    description: "Learn design thinking, user research, wireframing, and prototyping. Create beautiful and user-friendly interfaces.",
    duration: "8 weeks",
    price: 0,
    level: "Beginner",
    image: "course-08.jpg",
    is_featured: false,
  },
  {
    title: "Cybersecurity Fundamentals",
    description: "Understand security threats, encryption, network security, and ethical hacking. Protect systems and data from attacks.",
    duration: "12 weeks",
    price: 0,
    level: "Intermediate",
    image: "course-09.jpg",
    is_featured: false,
  },
  {
    title: "DevOps & CI/CD",
    description: "Learn continuous integration, continuous deployment, and infrastructure as code. Master Git, Jenkins, Docker, and automation tools.",
    duration: "10 weeks",
    price: 0,
    level: "Intermediate",
    image: "course-10.jpg",
    is_featured: false,
  },
  {
    title: "Database Design & SQL",
    description: "Master database design principles, normalization, and SQL queries. Learn PostgreSQL, MySQL, and database optimization techniques.",
    duration: "8 weeks",
    price: 0,
    level: "Beginner",
    image: "course-11.jpg",
    is_featured: false,
  },
  {
    title: "Blockchain Development",
    description: "Build decentralized applications using blockchain technology. Learn Solidity, smart contracts, Ethereum, and Web3 development.",
    duration: "14 weeks",
    price: 0,
    level: "Advanced",
    image: "course-12.jpg",
    is_featured: false,
  },
  {
    title: "Game Development",
    description: "Create engaging games using Unity, Unreal Engine, and game design principles. Learn 2D/3D graphics, physics, and game mechanics.",
    duration: "16 weeks",
    price: 0,
    level: "Intermediate",
    image: "course-13.jpg",
    is_featured: false,
  },
  {
    title: "AI & Deep Learning",
    description: "Dive deep into artificial intelligence, neural networks, and deep learning frameworks. Build AI models with TensorFlow and PyTorch.",
    duration: "14 weeks",
    price: 0,
    level: "Advanced",
    image: "course-14.jpg",
    is_featured: false,
  },
  {
    title: "System Administration & Linux",
    description: "Master Linux system administration, shell scripting, server management, and network configuration. Learn to manage production systems.",
    duration: "12 weeks",
    price: 0,
    level: "Intermediate",
    image: "course-15.jpg",
    is_featured: false,
  },
];

async function createCourses() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    console.log(`Creating ${courses.length} courses...`);

    for (const courseData of courses) {
      try {
        // Check if course already exists
        const existingCourse = await client.query(
          "SELECT course_id FROM courses WHERE title = $1",
          [courseData.title]
        );

        if (existingCourse.rows.length > 0) {
          console.log(`⚠️  Course "${courseData.title}" already exists, skipping...`);
          continue;
        }

        // Insert course
        const result = await client.query(
          `INSERT INTO courses (title, description, duration, price, level, image, is_featured)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING course_id, title, duration, price, level, is_featured`,
          [
            courseData.title,
            courseData.description,
            courseData.duration,
            courseData.price,
            courseData.level,
            courseData.image,
            courseData.is_featured,
          ]
        );

        const course = result.rows[0];
        const featuredStatus = course.is_featured ? "⭐ Featured" : "";
        console.log(`✅ Created course: ${course.title} (${course.duration}, $${course.price}, ${course.level}) ${featuredStatus}`);
      } catch (error) {
        console.error(`❌ Error creating course "${courseData.title}":`, error.message);
        // Continue with next course
      }
    }

    await client.query("COMMIT");
    console.log(`\n✅ Successfully created courses!`);
    
    // Show summary
    const featuredCount = courses.filter(c => c.is_featured).length;
    console.log(`\n📊 Summary:`);
    console.log(`   - Total courses: ${courses.length}`);
    console.log(`   - Featured courses: ${featuredCount}`);
    console.log(`   - Regular courses: ${courses.length - featuredCount}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error creating courses:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  createCourses()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

module.exports = createCourses;

