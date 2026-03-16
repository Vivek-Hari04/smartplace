const pool = require('./server/src/config/db');
async function check() {
  try {
    const res = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('students', 'offer_applications', 'placement_offers', 'drive_registrations');
    `);
    console.log(res.rows);

    const conRes = await pool.query(`
      SELECT conname, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'offer_applications';
    `);
    console.log("Constraints:", conRes.rows);

  } catch (e) { console.error(e); }
  process.exit();
}
check();
