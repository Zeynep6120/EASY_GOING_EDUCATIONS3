const pool = require("./connection");
require("dotenv").config();

// Update slide data for IT-themed images
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

async function updateSlides() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    console.log(`Updating ${slides.length} slides...`);

    for (let i = 0; i < slides.length; i++) {
      const slideData = slides[i];
      const slideId = i + 1; // Assuming slide_id starts from 1
      
      try {
        // Update slide
        const result = await client.query(
          `UPDATE slides 
           SET title = $1, description = $2, image = $3
           WHERE slide_id = $4
           RETURNING slide_id, title, image`,
          [
            slideData.title,
            slideData.description,
            slideData.image,
            slideId,
          ]
        );

        if (result.rows.length > 0) {
          const slide = result.rows[0];
          console.log(`✅ Updated slide ${slideId}: ${slide.title} (${slide.image})`);
        } else {
          console.log(`⚠️  Slide with ID ${slideId} not found, creating new...`);
          // Create if doesn't exist
          const insertResult = await client.query(
            `INSERT INTO slides (title, description, image)
             VALUES ($1, $2, $3)
             RETURNING slide_id, title, image`,
            [
              slideData.title,
              slideData.description,
              slideData.image,
            ]
          );
          console.log(`✅ Created slide: ${insertResult.rows[0].title} (${insertResult.rows[0].image})`);
        }
      } catch (error) {
        console.error(`❌ Error updating slide ${slideId} "${slideData.title}":`, error.message);
        // Continue with next slide
      }
    }

    await client.query("COMMIT");
    console.log(`\n✅ Successfully updated slides!`);
    
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error updating slides:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  updateSlides()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

module.exports = updateSlides;

