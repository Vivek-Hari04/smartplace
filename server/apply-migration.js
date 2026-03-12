const pool = require('./src/config/db');
async function migrate() {
  await pool.query('ALTER TABLE assessment_submissions DROP CONSTRAINT IF EXISTS assessment_submissions_assessment_id_fkey;');
  await pool.query('ALTER TABLE assessment_submissions ADD CONSTRAINT assessment_submissions_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id) ON DELETE CASCADE;');
  console.log('Migration completed successfully');
  process.exit(0);
}
migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
