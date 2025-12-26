const pool = require("./connection");
require("dotenv").config();

async function addIsRespondedColumn() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    console.log("Adding is_responded column to contact_messages table...\n");

    // Check if column already exists
    const columnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contact_messages' AND column_name = 'is_responded'
      )
    `);

    if (columnExists.rows[0].exists) {
      console.log("  ℹ️  Column is_responded already exists in contact_messages, skipping creation.");
    } else {
      // Add is_responded column
      await client.query(`
        ALTER TABLE contact_messages 
        ADD COLUMN is_responded BOOLEAN DEFAULT FALSE
      `);
      console.log("  ✅ Added is_responded column to contact_messages table.");

      // Create index for filtering responded messages
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_contact_messages_responded 
        ON contact_messages(is_responded)
      `);
      console.log("  ✅ Created index on is_responded column.");

      // Update existing messages to have is_responded = false
      await client.query(`
        UPDATE contact_messages 
        SET is_responded = FALSE 
        WHERE is_responded IS NULL
      `);
      console.log("  ✅ Updated existing messages to have is_responded = false.");
    }

    await client.query("COMMIT");
    console.log("\n✅ Migration completed successfully!");
    
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error during migration:", error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  addIsRespondedColumn()
    .then(() => {
      console.log("\nDone!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

module.exports = addIsRespondedColumn;

