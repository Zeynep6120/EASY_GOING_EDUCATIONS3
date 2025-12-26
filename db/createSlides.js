const pool = require("./connection");
require("dotenv").config();

// Sample slide data for home page slider
const slides = [
  {
    title: "Modern IT Education",
    description: "Experience cutting-edge technology education in our state-of-the-art computer labs. Learn from industry experts and build real-world projects.",
    image: "slider-01.jpg",
  },
  {
    title: "Transform Your Career with IT Skills",
    description: "Master Python, JavaScript, React, Node.js, Cloud Computing and more. Join thousands of successful graduates working at top tech companies.",
    image: "slider-02.jpg",
  },
];

async function createSlides() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    console.log(`Creating ${slides.length} slides...`);

    for (const slideData of slides) {
      try {
        // Check if slide already exists
        const existingSlide = await client.query(
          "SELECT slide_id FROM slides WHERE title = $1",
          [slideData.title]
        );

        if (existingSlide.rows.length > 0) {
          console.log(`⚠️  Slide "${slideData.title}" already exists, skipping...`);
          continue;
        }

        // Insert slide
        const result = await client.query(
          `INSERT INTO slides (title, description, image)
           VALUES ($1, $2, $3)
           RETURNING slide_id, title, image`,
          [
            slideData.title,
            slideData.description,
            slideData.image,
          ]
        );

        const slide = result.rows[0];
        console.log(`✅ Created slide: ${slide.title} (${slide.image})`);
      } catch (error) {
        console.error(`❌ Error creating slide "${slideData.title}":`, error.message);
        // Continue with next slide
      }
    }

    await client.query("COMMIT");
    console.log(`\n✅ Successfully created slides!`);
    
    // Show summary
    console.log(`\n📊 Summary:`);
    console.log(`   - Total slides: ${slides.length}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error creating slides:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  createSlides()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

module.exports = createSlides;

