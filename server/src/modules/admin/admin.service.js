const pool = require("../../config/db");

/* USER & STUDENT MANAGEMENT */

exports.getAllUsers = async () => {
  const result = await pool.query(
    `SELECT u.user_id, u.fname, u.lname, u.email, u.role, u.is_verified, u.created_at, ur.reason as rejection_reason
     FROM users u
     LEFT JOIN user_rejections ur ON u.user_id = ur.user_id
     ORDER BY u.created_at DESC`
  );
  return result.rows;
};

exports.getPendingUsers = async () => {
  const result = await pool.query(
    `SELECT u.user_id, u.fname, u.lname, u.email, u.role, u.created_at 
     FROM users u
     LEFT JOIN user_rejections ur ON u.user_id = ur.user_id
     WHERE u.is_verified = false 
     AND u.role != 'admin' 
     AND ur.user_id IS NULL
     ORDER BY u.created_at ASC`
  );
  return result.rows;
};

exports.verifyUser = async (userId) => {
  // Clear any existing rejection first
  await pool.query("DELETE FROM user_rejections WHERE user_id = $1", [userId]);
  
  const result = await pool.query(
    "UPDATE users SET is_verified = true WHERE user_id = $1 RETURNING *",
    [userId]
  );
  if (!result.rowCount) throw new Error("User not found");
  return result.rows[0];
};

exports.rejectUser = async (userId, reason, description) => {
  const result = await pool.query(
    `INSERT INTO user_rejections (user_id, reason, description) 
     VALUES ($1, $2, $3) 
     ON CONFLICT (user_id) DO UPDATE 
     SET reason = EXCLUDED.reason, description = EXCLUDED.description, rejected_at = NOW()
     RETURNING *`,
    [userId, reason, description]
  );
  return result.rows[0];
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

exports.getFilteredStudents = async (filters) => {
  const { departments, min_cgpa, max_cgpa, placement_eligible } = filters;
  let queryArgs = [];
  let paramIndex = 1;

  let query = `
    SELECT u.fname, u.lname, u.email, s.department, s.cgpa, s.placement_eligible 
    FROM students s 
    JOIN users u ON s.user_id = u.user_id 
    WHERE u.role = 'student'
  `;

  if (departments) {
      const deptArray = departments.split(',').map(d => d.toLowerCase());
      const placeholders = deptArray.map(() => `$${paramIndex++}`).join(',');
      query += ` AND LOWER(s.department) IN (${placeholders})`;
      queryArgs.push(...deptArray);
}

  if (min_cgpa) {
    query += ` AND s.cgpa >= $${paramIndex++}`;
    queryArgs.push(min_cgpa);
  }

  if (max_cgpa) {
    query += ` AND s.cgpa <= $${paramIndex++}`;
    queryArgs.push(max_cgpa);
  }

  if (placement_eligible && placement_eligible !== 'All') {
    query += ` AND s.placement_eligible = $${paramIndex++}`;
    queryArgs.push(placement_eligible === 'true');
  }

  const result = await pool.query(query, queryArgs);
  return result.rows;
};

exports.getDepartments = async () => {
  const result = await pool.query(`
    SELECT DISTINCT department
    FROM students
    ORDER BY department
  `);
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

/* PLACED STUDENTS FEATURE */

exports.getPlacedStudents = async (filters, includeUnplaced = false) => {
  const { department, company_name, min_lpa, max_lpa } = filters;
  
  let queryArgs = [];
  let paramIndex = 1;

  let query = `
    SELECT 
      s.user_id as student_id, 
      u.fname, 
      u.lname, 
      u.email, 
      s.department, 
      c.company_name, 
      po.package_lpa, 
      oa.status as offer_status,
      oa.accepted_at
    FROM students s
    JOIN users u ON s.user_id = u.user_id
  `;

  if (includeUnplaced) {
    query += `
      LEFT JOIN offer_applications oa ON s.user_id = oa.student_id AND oa.status = 'accepted'
      LEFT JOIN placement_offers po ON oa.offer_id = po.offer_id
      LEFT JOIN companies c ON po.company_id = c.user_id
      WHERE u.role = 'student'
    `;
  } else {
    query += `
      JOIN offer_applications oa ON s.user_id = oa.student_id AND oa.status = 'accepted'
      JOIN placement_offers po ON oa.offer_id = po.offer_id
      JOIN companies c ON po.company_id = c.user_id
      WHERE u.role = 'student'
    `;
  }

  if (department && department.trim() !== "") {
    query += ` AND s.department = $${paramIndex++}`;
    queryArgs.push(department);
  }

  if (company_name && company_name.trim() !== "") {
    if (includeUnplaced) {
      query += ` AND (c.company_name ILIKE $${paramIndex} OR c.company_name IS NULL)`;
    } else {
      query += ` AND c.company_name ILIKE $${paramIndex}`;
    }
    queryArgs.push(`%${company_name}%`);
    paramIndex++;
  }

  if (min_lpa && min_lpa.trim() !== "") {
    if (includeUnplaced) {
      query += ` AND (po.package_lpa >= $${paramIndex} OR po.package_lpa IS NULL)`;
    } else {
      query += ` AND po.package_lpa >= $${paramIndex}`;
    }
    queryArgs.push(Number(min_lpa));
    paramIndex++;
  }

  if (max_lpa && max_lpa.trim() !== "") {
    if (includeUnplaced) {
      query += ` AND (po.package_lpa <= $${paramIndex} OR po.package_lpa IS NULL)`;
    } else {
      query += ` AND po.package_lpa <= $${paramIndex}`;
    }
    queryArgs.push(Number(max_lpa));
    paramIndex++;
  }

  query += ` ORDER BY u.fname ASC, u.lname ASC`;

  const result = await pool.query(query, queryArgs);
  return result.rows;
};
