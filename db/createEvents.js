const pool = require("./connection");
require("dotenv").config();

// Sample event data for public website
const events = [
  {
    title: "Tech Innovation Summit 2026",
    time: "2026-01-15T10:00:00",
    location: "Convention Center, New York",
    image: "events-01.jpg",
  },
  {
    title: "Web Development Workshop",
    time: "2026-02-20T14:00:00",
    location: "Main Campus, Building A",
    image: "events-02.jpg",
  },
  {
    title: "Career Fair 2026",
    time: "2026-03-10T09:00:00",
    location: "Student Center, Hall 1",
    image: "events-03.jpg",
  },
  {
    title: "Python Programming Bootcamp",
    time: "2026-04-05T13:00:00",
    location: "Computer Lab, Building B",
    image: "events-04.jpg",
  },
  {
    title: "Data Science Conference",
    time: "2026-05-12T10:00:00",
    location: "Conference Hall, Downtown",
    image: "events-05.jpg",
  },
  {
    title: "Mobile App Development Seminar",
    time: "2026-06-18T15:00:00",
    location: "Tech Hub, Building C",
    image: "events-06.jpg",
  },
  {
    title: "Cybersecurity Awareness Day",
    time: "2026-07-25T11:00:00",
    location: "Auditorium, Main Building",
    image: "events-07.jpg",
  },
  {
    title: "AI & Machine Learning Expo",
    time: "2026-08-30T10:00:00",
    location: "Exhibition Center",
    image: "events-08.jpg",
  },
  {
    title: "Graduation Ceremony 2026",
    time: "2026-09-15T14:00:00",
    location: "Stadium, Main Campus",
    image: "events-09.jpg",
  },
  {
    title: "Hackathon 2026",
    time: "2026-10-20T09:00:00",
    location: "Innovation Lab, Building D",
    image: "events-10.jpg",
  },
  {
    title: "Cloud Computing Workshop",
    time: "2026-11-14T13:00:00",
    location: "Tech Center, Room 201",
    image: "events-11.jpg",
  },
  {
    title: "Startup Pitch Competition",
    time: "2026-12-22T16:00:00",
    location: "Business Center, Hall 2",
    image: "events-12.jpg",
  },
  {
    title: "Open House Day",
    time: "2027-01-10T10:00:00",
    location: "Main Campus, All Buildings",
    image: "events-13.jpg",
  },
  {
    title: "Tech Career Networking",
    time: "2027-02-18T17:00:00",
    location: "Student Lounge, Building A",
    image: "events-14.jpg",
  },
  {
    title: "Summer Coding Camp",
    time: "2027-03-25T09:00:00",
    location: "Computer Labs, All Buildings",
    image: "events-15.jpg",
  },
  {
    title: "Industry Leaders Forum",
    time: "2027-04-30T14:00:00",
    location: "Grand Hall, Convention Center",
    image: "events-16.jpg",
  },
  {
    title: "Digital Transformation Summit",
    time: "2027-05-15T10:00:00",
    location: "Tech Park, Conference Room",
    image: "events-17.jpg",
  },
  {
    title: "Student Project Showcase",
    time: "2027-06-20T13:00:00",
    location: "Exhibition Hall, Building E",
    image: "events-18.jpg",
  },
  {
    title: "Tech Innovation Awards",
    time: "2027-07-28T18:00:00",
    location: "Ballroom, Hotel Downtown",
    image: "events-19.jpg",
  },
  {
    title: "Year-End Celebration",
    time: "2027-08-20T19:00:00",
    location: "Main Auditorium",
    image: "events-20.jpg",
  },
];

async function createEvents() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    console.log(`Creating ${events.length} events...`);

    for (const eventData of events) {
      try {
        // Check if event already exists
        const existingEvent = await client.query(
          "SELECT event_id FROM events WHERE title = $1",
          [eventData.title]
        );

        if (existingEvent.rows.length > 0) {
          console.log(`⚠️  Event "${eventData.title}" already exists, skipping...`);
          continue;
        }

        // Insert event
        const result = await client.query(
          `INSERT INTO events (title, time, location, image)
           VALUES ($1, $2, $3, $4)
           RETURNING event_id, title, time, location`,
          [
            eventData.title,
            eventData.time,
            eventData.location,
            eventData.image,
          ]
        );

        const event = result.rows[0];
        const eventDate = new Date(event.time).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        console.log(`✅ Created event: ${event.title} (${eventDate} at ${event.location})`);
      } catch (error) {
        console.error(`❌ Error creating event "${eventData.title}":`, error.message);
        // Continue with next event
      }
    }

    await client.query("COMMIT");
    console.log(`\n✅ Successfully created events!`);
    
    // Show summary
    const upcomingEvents = events.filter(e => {
      const eventDate = new Date(e.time);
      return eventDate >= new Date();
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   - Total events: ${events.length}`);
    console.log(`   - Upcoming events: ${upcomingEvents.length}`);
    console.log(`   - Past events: ${events.length - upcomingEvents.length}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error creating events:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  createEvents()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

module.exports = createEvents;

