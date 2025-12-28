const pool = require("./connection");
require("dotenv").config();

// Update event dates to more current dates (starting from January 2026)
const eventUpdates = [
  { title: "Tech Innovation Summit 2026", newTime: "2026-01-08T10:00:00" },
  { title: "Web Development Workshop", newTime: "2026-01-15T14:00:00" },
  { title: "Career Fair 2026", newTime: "2026-01-22T09:00:00" },
  { title: "Python Programming Bootcamp", newTime: "2026-01-29T13:00:00" },
  { title: "Data Science Conference", newTime: "2026-02-05T10:00:00" },
  { title: "Mobile App Development Seminar", newTime: "2026-02-12T15:00:00" },
  { title: "Cybersecurity Awareness Day", newTime: "2026-02-19T11:00:00" },
  { title: "AI & Machine Learning Expo", newTime: "2026-02-26T10:00:00" },
  { title: "Graduation Ceremony 2026", newTime: "2026-03-05T14:00:00" },
  { title: "Hackathon 2026", newTime: "2026-03-12T09:00:00" },
  { title: "Cloud Computing Workshop", newTime: "2026-03-19T13:00:00" },
  { title: "Startup Pitch Competition", newTime: "2026-03-26T16:00:00" },
  { title: "Open House Day", newTime: "2026-04-02T10:00:00" },
  { title: "Tech Career Networking", newTime: "2026-04-09T17:00:00" },
  { title: "Summer Coding Camp", newTime: "2026-04-16T09:00:00" },
  { title: "Industry Leaders Forum", newTime: "2026-04-23T14:00:00" },
  { title: "Digital Transformation Summit", newTime: "2026-04-30T10:00:00" },
  { title: "Student Project Showcase", newTime: "2026-05-07T13:00:00" },
  { title: "Tech Innovation Awards", newTime: "2026-05-14T18:00:00" },
  { title: "Year-End Celebration", newTime: "2026-05-21T19:00:00" },
];

async function updateEventsDates() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    console.log(`Updating ${eventUpdates.length} events...`);

    for (const update of eventUpdates) {
      try {
        // Update event
        const result = await client.query(
          `UPDATE events 
           SET time = $1${update.newTitle ? ', title = $3' : ''}
           WHERE title = $2
           RETURNING event_id, title, time`,
          update.newTitle 
            ? [update.newTime, update.title, update.newTitle]
            : [update.newTime, update.title]
        );

        if (result.rows.length > 0) {
          const event = result.rows[0];
          console.log(`✅ Updated event: ${event.title} (${event.time})`);
        } else {
          console.log(`⚠️  Event "${update.title}" not found`);
        }
      } catch (error) {
        console.error(`❌ Error updating event "${update.title}":`, error.message);
        // Continue with next event
      }
    }

    await client.query("COMMIT");
    console.log(`\n✅ Successfully updated events!`);
    
    // Show summary
    const upcomingResult = await client.query(
      "SELECT COUNT(*) as count FROM events WHERE time >= CURRENT_TIMESTAMP"
    );
    const upcomingCount = upcomingResult.rows[0].count;
    console.log(`\n📊 Summary:`);
    console.log(`   - Upcoming events: ${upcomingCount}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error updating events:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  updateEventsDates()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

module.exports = updateEventsDates;

