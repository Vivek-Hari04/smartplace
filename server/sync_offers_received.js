const pool = require('../server/src/config/db');

async function syncOffers() {
  try {
    console.log("Starting data consistency sync for offers_received...");

    // 1. Update offers_received count
    await pool.query(`
      UPDATE students s
      SET offers_received = (
        SELECT COUNT(*)
        FROM offer_applications oa
        WHERE oa.student_id = s.user_id
        -- count all offered/accepted regardless of status, since an offer is an offer
      )
    `);

    // 2. Automatically update placement_eligible to false if offers_received >= 2
    await pool.query(`
      UPDATE students
      SET placement_eligible = false
      WHERE offers_received >= 2
    `);

    console.log("Successfully synced offers_received and placement_eligible flags.");
  } catch (err) {
    console.error("Error during sync:", err);
  } finally {
    pool.end();
  }
}

syncOffers();
