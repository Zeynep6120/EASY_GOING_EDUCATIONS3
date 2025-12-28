const pool = require("./connection");
require("dotenv").config();

// Sample education terms - Academic calendar for multiple years
const educationTerms = [
  // 2023-2024 Academic Year
  {
    term_name: "2023-2024 Fall Semester",
    start_date: "2023-09-01",
    end_date: "2023-12-31",
  },
  {
    term_name: "2023-2024 Spring Semester",
    start_date: "2024-01-15",
    end_date: "2024-05-31",
  },
  // 2024-2025 Academic Year
  {
    term_name: "2024-2025 Fall Semester",
    start_date: "2024-09-01",
    end_date: "2024-12-31",
  },
  {
    term_name: "2024-2025 Spring Semester",
    start_date: "2025-01-15",
    end_date: "2025-05-31",
  },
  // 2025-2026 Academic Year
  {
    term_name: "2025-2026 Fall Semester",
    start_date: "2025-09-01",
    end_date: "2025-12-31",
  },
  {
    term_name: "2025-2026 Spring Semester",
    start_date: "2026-01-15",
    end_date: "2026-05-31",
  },
  // 2026-2027 Academic Year
  {
    term_name: "2026-2027 Fall Semester",
    start_date: "2026-09-01",
    end_date: "2026-12-31",
  },
  {
    term_name: "2026-2027 Spring Semester",
    start_date: "2027-01-15",
    end_date: "2027-05-31",
  },
  // 2027-2028 Academic Year
  {
    term_name: "2027-2028 Fall Semester",
    start_date: "2027-09-01",
    end_date: "2027-12-31",
  },
  {
    term_name: "2027-2028 Spring Semester",
    start_date: "2028-01-15",
    end_date: "2028-05-31",
  },
  // Summer Terms
  {
    term_name: "2024 Summer Term",
    start_date: "2024-06-01",
    end_date: "2024-08-31",
  },
  {
    term_name: "2025 Summer Term",
    start_date: "2025-06-01",
    end_date: "2025-08-31",
  },
  {
    term_name: "2026 Summer Term",
    start_date: "2026-06-01",
    end_date: "2026-08-31",
  },
  {
    term_name: "2027 Summer Term",
    start_date: "2027-06-01",
    end_date: "2027-08-31",
  },
];

async function createEducationTerms() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    console.log(`Creating ${educationTerms.length} education terms...`);

    for (const termData of educationTerms) {
      try {
        // Check if term already exists
        const existingTerm = await client.query(
          "SELECT term_id FROM education_terms WHERE term_name = $1",
          [termData.term_name]
        );

        if (existingTerm.rows.length > 0) {
          console.log(`⚠️  Term "${termData.term_name}" already exists, skipping...`);
          continue;
        }

        // Validate dates
        const startDate = new Date(termData.start_date);
        const endDate = new Date(termData.end_date);

        if (startDate >= endDate) {
          console.error(`❌ Invalid date range for "${termData.term_name}": start_date must be before end_date`);
          continue;
        }

        // Insert education term
        const result = await client.query(
          `INSERT INTO education_terms (term_name, start_date, end_date)
           VALUES ($1, $2, $3)
           RETURNING term_id, term_name, start_date, end_date`,
          [
            termData.term_name,
            termData.start_date,
            termData.end_date,
          ]
        );

        const term = result.rows[0];
        const startDateStr = new Date(term.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const endDateStr = new Date(term.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        console.log(`✅ Created term: ${term.term_name} (${startDateStr} - ${endDateStr})`);
      } catch (error) {
        console.error(`❌ Error creating term "${termData.term_name}":`, error.message);
        // Continue with next term
      }
    }

    await client.query("COMMIT");
    console.log(`\n✅ Successfully created education terms!`);
    
    // Show summary
    const currentDate = new Date();
    const currentTerms = educationTerms.filter(t => {
      const start = new Date(t.start_date);
      const end = new Date(t.end_date);
      return start <= currentDate && end >= currentDate;
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   - Total terms: ${educationTerms.length}`);
    console.log(`   - Current active terms: ${currentTerms.length}`);
    
    if (currentTerms.length > 0) {
      console.log(`   - Current term(s):`);
      currentTerms.forEach(t => console.log(`     • ${t.term_name}`));
    }
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error creating education terms:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  createEducationTerms()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

module.exports = createEducationTerms;

