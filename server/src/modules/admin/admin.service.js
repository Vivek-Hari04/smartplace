const pool = require("../../config/db");

/* USER & STUDENT MANAGEMENT */

exports.getAllUsers = async () => {
  const result = await pool.query(
    "SELECT user_id, fname, lname, email, role, created_at FROM users ORDER BY created_at DESC"
  );
  return result.rows;
};

exports.getPendingStudents = async () => {
  const result = await pool.query(
    `SELECT u.user_id, u.fname, u.lname, u.email, s.department, s.graduation_year, s.cgpa
     FROM users u
     JOIN students s ON u.user_id = s.user_id
     WHERE s.is_verified = false`
  );
  return result.rows;
};

exports.verifyStudent = async (studentId) => {
  const result = await pool.query(
    "UPDATE students SET is_verified = true WHERE user_id = $1 RETURNING *",
    [studentId]
  );
  if (!result.rowCount) throw new Error("Student not found");
  return result.rows[0];
};

exports.assignAdvisor = async (studentId, advisorId) => {
  // Verify advisor exists and is faculty
  const facultyCheck = await pool.query("SELECT 1 FROM faculty WHERE user_id = $1", [advisorId]);
  if (!facultyCheck.rowCount) throw new Error("Selected advisor is not a valid faculty member");

  const result = await pool.query(
    "UPDATE students SET advisor_id = $1 WHERE user_id = $2 RETURNING *",
    [advisorId, studentId]
  );
  if (!result.rowCount) throw new Error("Student not found");
  return result.rows[0];
};

/* SYSTEM OVERSIGHT */

exports.getPendingDrives = async () => {
  const result = await pool.query(
    `SELECT pd.*, COALESCE(c.company_name, u.fname || ' ' || u.lname) as company_name 
     FROM placement_drives pd
     LEFT JOIN companies c ON pd.company_id = c.user_id
     LEFT JOIN users u ON pd.company_id = u.user_id
     WHERE pd.status = 'PENDING'
     ORDER BY pd.drive_date ASC`
  );
  return result.rows;
};

exports.updateDriveStatus = async (driveId, status) => {
  const result = await pool.query(
    "UPDATE placement_drives SET status = $1 WHERE drive_id = $2 RETURNING *",
    [status, driveId]
  );
  if (!result.rowCount) throw new Error("Drive not found");
  return result.rows[0];
};

exports.getAllDrives = async () => {
  const result = await pool.query(
    `SELECT pd.*, COALESCE(c.company_name, u.fname || ' ' || u.lname) as company_name 
     FROM placement_drives pd
     LEFT JOIN companies c ON pd.company_id = c.user_id
     LEFT JOIN users u ON pd.company_id = u.user_id
     ORDER BY pd.drive_date DESC`
  );
  return result.rows;
};

exports.getDriveRegistrants = async (driveId) => {
  const result = await pool.query(
    `SELECT dr.*, u.fname, u.lname, u.email, s.department, s.cgpa
     FROM drive_registrations dr
     JOIN users u ON dr.student_id = u.user_id
     JOIN students s ON u.user_id = s.user_id
     WHERE dr.drive_id = $1`,
    [driveId]
  );
  return result.rows;
};

exports.getStats = async () => {
  const queries = {
    totalStudents: "SELECT COUNT(*) FROM students",
    verifiedStudents: "SELECT COUNT(*) FROM students WHERE is_verified = true",
    totalFaculty: "SELECT COUNT(*) FROM faculty",
    totalCourses: "SELECT COUNT(*) FROM courses",
    pendingDocuments: "SELECT COUNT(*) FROM student_documents WHERE status = 'PENDING'"
  };

  const stats = {};
  for (const [key, query] of Object.entries(queries)) {
    const res = await pool.query(query);
    stats[key] = parseInt(res.rows[0].count);
  }
  return stats;
};

exports.getAllCourses = async () => {
  const result = await pool.query(
    `SELECT c.*, u.fname as faculty_fname, u.lname as faculty_lname 
     FROM courses c
     LEFT JOIN users u ON c.faculty_id = u.user_id
     ORDER BY c.name ASC`
  );
  return result.rows;
};

exports.getFacultyList = async () => {
  const result = await pool.query(
    `SELECT u.user_id, u.fname, u.lname, u.email, f.department, f.is_staff_advisor
     FROM users u
     JOIN faculty f ON u.user_id = f.user_id`
  );
  return result.rows;
};
