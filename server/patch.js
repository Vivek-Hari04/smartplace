require('dotenv').config({ path: __dirname + '/server/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    console.log("Adding placement_status to students...");
    await pool.query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS placement_status TEXT DEFAULT 'NOT_PLACED' CHECK (placement_status IN ('NOT_PLACED','PLACED'))`);

    console.log("Adding accepted_at to offer_applications...");
    await pool.query(`ALTER TABLE offer_applications ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP NULL`);

    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
