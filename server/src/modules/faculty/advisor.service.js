// modules/faculty/advisor.service.jslet accessToken;

const pool = require("../../config/db");

exports.getMyStudents = async (advisorId) => {
  const result = await pool.query(
    `SELECT 
        s.user_id,
        s.department,
        s.graduation_year,
        s.cgpa,
        s.placement_eligible,
        s.is_verified,
        s.advisor_id,
        u.fname,
        u.lname,
        u.email
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.advisor_id = $1`,[advisorId]
  );

  return result.rows;
};

exports.getStudentDocuments = async (advisorId, studentId) => {
  const result = await pool.query(
    `SELECT d.*
     FROM student_documents d
     JOIN students s ON s.user_id = d.student_id
     WHERE s.advisor_id = $1 AND s.user_id = $2`,
    [advisorId, studentId]
  );

  return result.rows;
};

exports.verifyDocument = async (advisorId, documentId) => {
  const result = await pool.query(
    `UPDATE student_documents d
     SET status = 'VERIFIED',
         reviewed_by = $1,
         reviewed_at = NOW()
     FROM students s
     WHERE d.document_id = $2
     AND d.student_id = s.user_id
     AND s.advisor_id = $1
     RETURNING d.*`,
    [advisorId, documentId]
  );

  if (!result.rowCount) throw new Error("Unauthorized");

  return result.rows[0];
};

exports.rejectDocument = async (advisorId, documentId) => {
  const result = await pool.query(
    `UPDATE student_documents d
     SET status = 'REJECTED',
         reviewed_by = $1,
         reviewed_at = NOW()
     FROM students s
     WHERE d.document_id = $2
     AND d.student_id = s.user_id
     AND s.advisor_id = $1
     RETURNING d.*`,
    [advisorId, documentId]
  );

  if (!result.rowCount) throw new Error("Unauthorized");

  return result.rows[0];
};