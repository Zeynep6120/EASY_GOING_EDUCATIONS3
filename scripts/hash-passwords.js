const bcrypt = require("bcryptjs");
const pool = require("../db/connection");

async function hashPlainTextPasswords() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Plain text password'ları bul (bcrypt hash'leri $2 ile başlar)
    const result = await client.query(
      "SELECT user_id, username, password FROM users WHERE password IS NOT NULL AND password NOT LIKE '$2%'"
    );

    console.log(`Found ${result.rows.length} users with plain text passwords`);

    for (const user of result.rows) {
      const plainPassword = user.password;
      console.log(`Hashing password for user: ${user.username} (ID: ${user.user_id})`);

      // Password'u hash'le
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // Database'de güncelle
      await client.query(
        "UPDATE users SET password = $1 WHERE user_id = $2",
        [hashedPassword, user.user_id]
      );

      console.log(`✓ Password hashed for ${user.username}`);
    }

    await client.query("COMMIT");
    console.log("\n✓ All plain text passwords have been hashed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error hashing passwords:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Script'i çalıştır
hashPlainTextPasswords()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });

