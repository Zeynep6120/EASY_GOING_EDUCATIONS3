const pool = require("./connection");
require("dotenv").config();

// Sample instructor data for public website
const instructors = [
  {
    name: "Dr. Sarah Mitchell",
    title: "Senior Web Development Instructor",
    bio: "With over 15 years of experience in web development, Dr. Mitchell specializes in modern JavaScript frameworks and full-stack development. She has worked with leading tech companies and published numerous research papers.",
    image: "instructor-01.jpg",
    social_links: {
      linkedin: "https://linkedin.com/in/sarahmitchell",
      twitter: "https://twitter.com/sarahmitchell",
      github: "https://github.com/sarahmitchell"
    },
  },
  {
    name: "Prof. Michael Chen",
    title: "Data Science & Machine Learning Expert",
    bio: "Professor Chen is a renowned data scientist with expertise in machine learning, deep learning, and AI. He holds a Ph.D. in Computer Science and has led multiple research projects in artificial intelligence.",
    image: "instructor-02.jpg",
    social_links: {
      linkedin: "https://linkedin.com/in/michaelchen",
      twitter: "https://twitter.com/michaelchen",
      website: "https://michaelchen.com"
    },
  },
  {
    name: "Emily Rodriguez",
    title: "UI/UX Design Specialist",
    bio: "Emily is a creative designer with a passion for user experience. She has designed interfaces for Fortune 500 companies and won multiple design awards. Her approach combines aesthetics with functionality.",
    image: "instructor-03.jpg",
    social_links: {
      linkedin: "https://linkedin.com/in/emilyrodriguez",
      behance: "https://behance.net/emilyrodriguez",
      dribbble: "https://dribbble.com/emilyrodriguez"
    },
  },
  {
    name: "Dr. James Anderson",
    title: "Cybersecurity & Network Security Professor",
    bio: "Dr. Anderson is a cybersecurity expert with extensive experience in network security, ethical hacking, and information security. He has helped organizations protect their digital assets and prevent cyber attacks.",
    image: "instructor-04.jpg",
    social_links: {
      linkedin: "https://linkedin.com/in/jamesanderson",
      twitter: "https://twitter.com/jamesanderson"
    },
  },
  {
    name: "Lisa Thompson",
    title: "Mobile App Development Instructor",
    bio: "Lisa specializes in mobile app development for iOS and Android platforms. She has developed over 50 mobile applications and teaches modern mobile development frameworks including React Native and Flutter.",
    image: "instructor-05.jpg",
    social_links: {
      linkedin: "https://linkedin.com/in/lisathompson",
      github: "https://github.com/lisathompson",
      twitter: "https://twitter.com/lisathompson"
    },
  },
  {
    name: "Dr. Robert Williams",
    title: "Cloud Computing & DevOps Expert",
    bio: "Dr. Williams is an expert in cloud infrastructure, DevOps practices, and containerization technologies. He has architected scalable cloud solutions for enterprises and is certified in AWS, Azure, and GCP.",
    image: "instructor-06.jpg",
    social_links: {
      linkedin: "https://linkedin.com/in/robertwilliams",
      twitter: "https://twitter.com/robertwilliams",
      website: "https://robertwilliams.dev"
    },
  },
  {
    name: "Prof. David Martinez",
    title: "Python & Backend Development Specialist",
    bio: "Professor Martinez is a Python expert with deep knowledge in Django, Flask, and backend architecture. He has over 12 years of experience teaching programming and has developed numerous enterprise applications.",
    image: "instructor-01.jpg",
    social_links: {
      linkedin: "https://linkedin.com/in/davidmartinez",
      github: "https://github.com/davidmartinez",
      twitter: "https://twitter.com/davidmartinez"
    },
  },
  {
    name: "Alexandra Kim",
    title: "Full Stack Development Expert",
    bio: "Alexandra is a full-stack developer specializing in Node.js, Express, React, and database design. She has built scalable applications for startups and Fortune 500 companies, and is passionate about teaching modern development practices.",
    image: "instructor-03.jpg",
    social_links: {
      linkedin: "https://linkedin.com/in/alexandrakim",
      github: "https://github.com/alexandrakim",
      website: "https://alexandrakim.dev"
    },
  },
  {
    name: "Dr. Patricia Brown",
    title: "Advanced Web Technologies Instructor",
    bio: "Dr. Brown specializes in advanced JavaScript, React, and modern frontend frameworks. With a Ph.D. in Computer Science, she brings both academic rigor and industry experience to her teaching.",
    image: "instructor-02.jpg",
    social_links: {
      linkedin: "https://linkedin.com/in/patriciabrown",
      github: "https://github.com/patriciabrown",
      twitter: "https://twitter.com/patriciabrown"
    },
  },
  {
    name: "Mark Johnson",
    title: "Cybersecurity & Ethical Hacking Instructor",
    bio: "Mark is a certified ethical hacker and cybersecurity consultant with extensive experience in penetration testing and security auditing. He has helped secure systems for government agencies and private corporations.",
    image: "instructor-04.jpg",
    social_links: {
      linkedin: "https://linkedin.com/in/markjohnson",
      twitter: "https://twitter.com/markjohnson",
      website: "https://markjohnson.security"
    },
  },
];

async function createInstructors() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    console.log(`Creating ${instructors.length} instructors...`);

    for (const instructorData of instructors) {
      try {
        // Check if instructor already exists
        const existingInstructor = await client.query(
          "SELECT instructor_id FROM instructors WHERE name = $1",
          [instructorData.name]
        );

        if (existingInstructor.rows.length > 0) {
          console.log(`⚠️  Instructor "${instructorData.name}" already exists, skipping...`);
          continue;
        }

        // Insert instructor
        const result = await client.query(
          `INSERT INTO instructors (name, title, bio, image, social_links)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING instructor_id, name, title`,
          [
            instructorData.name,
            instructorData.title,
            instructorData.bio,
            instructorData.image,
            instructorData.social_links ? JSON.stringify(instructorData.social_links) : null,
          ]
        );

        const instructor = result.rows[0];
        console.log(`✅ Created instructor: ${instructor.name} - ${instructor.title}`);
      } catch (error) {
        console.error(`❌ Error creating instructor "${instructorData.name}":`, error.message);
        // Continue with next instructor
      }
    }

    await client.query("COMMIT");
    console.log(`\n✅ Successfully created instructors!`);
    
    // Show summary
    console.log(`\n📊 Summary:`);
    console.log(`   - Total instructors: ${instructors.length}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error creating instructors:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  createInstructors()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

module.exports = createInstructors;

