const pool = require("../../config/db");

/*COURSE MANAGEMENT*/

exports.createCourse = async (facultyId, { name, description }) => {
  const result = await pool.query(
    `INSERT INTO courses (name, description, faculty_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, description, facultyId]
  );
  return result.rows[0];
};

exports.getMyCourses = async (facultyId) => {
  const result = await pool.query(
    `SELECT * FROM courses WHERE faculty_id = $1`,
    [facultyId]
  );
  return result.rows;
};

exports.getCourseById = async (facultyId, courseId) => {
  const result = await pool.query(
    `SELECT * FROM courses 
     WHERE course_id = $1 AND faculty_id = $2`,
    [courseId, facultyId]
  );

  if (!result.rowCount) {
    const err = new Error("Course not found");
    err.statusCode = 404;
    throw err;
  }

  return result.rows[0];
};

exports.updateCourse = async (facultyId, courseId, data) => {
  const result = await pool.query(
    `UPDATE courses 
     SET name = $1, description = $2
     WHERE course_id = $3 AND faculty_id = $4
     RETURNING *`,
    [data.name, data.description, courseId, facultyId]
  );

  if (!result.rowCount) {
    const err = new Error("Unauthorized or not found");
    err.statusCode = 403;
    throw err;
  }

  return result.rows[0];
};

exports.toggleAvailability = async (facultyId, courseId) => {
  const result = await pool.query(
    `UPDATE courses
     SET availability = NOT availability
     WHERE course_id = $1 AND faculty_id = $2
     RETURNING *`,
    [courseId, facultyId]
  );

  if (!result.rowCount) {
    const err = new Error("Course not found or unauthorized");
    err.statusCode = 404;
    throw err;
  }

  return result.rows[0];
};

exports.deleteCourse = async (facultyId, courseId) => {
  const result = await pool.query(
    `DELETE FROM courses 
     WHERE course_id = $1 AND faculty_id = $2`,
    [courseId, facultyId]
  );

  if (!result.rowCount) {
    const err = new Error("Course not found or unauthorized");
    err.statusCode = 404;
    throw err;
  }
};

/*ENROLLMENTS*/
exports.getEnrolledStudents = async (facultyId, courseId) => {
  const result = await pool.query(
    `SELECT 
        s.user_id,
        u.fname,
        u.lname,
        u.email,
        e.attendance
     FROM enrollments e
     JOIN students s ON s.user_id = e.student_id
     JOIN users u ON u.user_id = s.user_id
     JOIN courses c ON c.course_id = e.course_id
     WHERE c.course_id = $1 AND c.faculty_id = $2`,
    [courseId, facultyId]
  );

  return result.rows;
};

/*MATERIALS (Drive Link Based)*/

exports.uploadMaterial = async (facultyId, courseId, data) => {
  const { title, description, file_url } = data;

  if (!title || !file_url) {
    const err = new Error("Title and file_url are required");
    err.statusCode = 400;
    throw err;
  }

  const courseCheck = await pool.query(
    `SELECT 1 FROM courses WHERE course_id = $1 AND faculty_id = $2`,
    [courseId, facultyId]
  );

  if (!courseCheck.rowCount) {
    const err = new Error("Unauthorized");
    err.statusCode = 403;
    throw err;
  }

  const result = await pool.query(
    `INSERT INTO course_materials 
     (course_id, title, description, file_url, uploaded_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [courseId, title, description, file_url, facultyId]
  );

  return result.rows[0];
};

exports.getMaterials = async (facultyId, courseId) => {
  const courseCheck = await pool.query(
    `SELECT 1 FROM courses WHERE course_id = $1 AND faculty_id = $2`,
    [courseId, facultyId]
  );

  if (!courseCheck.rowCount) {
    const err = new Error("Course not found or unauthorized");
    err.statusCode = 403;
    throw err;
  }

  const result = await pool.query(
    `SELECT *
     FROM course_materials
     WHERE course_id = $1
     ORDER BY created_at`,
    [courseId]
  );

  return result.rows;
};

exports.updateMaterial = async (facultyId, materialId, data) => {
  const result = await pool.query(
    `UPDATE course_materials m
     SET title = COALESCE($1, m.title),
         description = COALESCE($2, m.description),
         file_url = COALESCE($3, m.file_url)
     FROM courses c
     WHERE m.course_id = c.course_id
     AND c.faculty_id = $4
     AND m.material_id = $5
     RETURNING m.*`,
    [data.title, data.description, data.file_url, facultyId, materialId]
  );

  if (!result.rowCount) {
    const err = new Error("Unauthorized or material not found");
    err.statusCode = 403;
    throw err;
  }

  return result.rows[0];
};

exports.deleteMaterial = async (facultyId, materialId) => {
  const result = await pool.query(
    `DELETE FROM course_materials m
     USING courses c
     WHERE m.course_id = c.course_id
     AND c.faculty_id = $1
     AND m.material_id = $2`,
    [facultyId, materialId]
  );

  if (!result.rowCount) {
    const err = new Error("Unauthorized or material not found");
    err.statusCode = 403;
    throw err;
  }
};

//DOUBT CHAT SYSTEM

// Get all doubts (threads) for faculty courses
exports.getFacultyDoubts = async (facultyId) => {
  const result = await pool.query(
    `
    SELECT 
      d.doubt_id,
      d.status,
      d.created_at,
      c.name AS course_name,

      -- last message
      dr.message AS last_message,
      dr.created_at AS last_message_time,

      -- unread count (student messages not seen by faculty)
      COUNT(CASE 
        WHEN dr.sender_role = 'student' AND dr.is_read = false THEN 1 
      END) AS unread_count

    FROM doubts d
    JOIN courses c ON c.course_id = d.course_id

    LEFT JOIN LATERAL (
      SELECT *
      FROM doubt_responses dr2
      WHERE dr2.doubt_id = d.doubt_id
      ORDER BY dr2.created_at DESC
      LIMIT 1
    ) dr ON true

    LEFT JOIN doubt_responses dr_all 
      ON dr_all.doubt_id = d.doubt_id

    WHERE c.faculty_id = $1

    GROUP BY d.doubt_id, c.name, dr.message, dr.created_at
    ORDER BY dr.created_at DESC NULLS LAST
    `,
    [facultyId]
  );

  return result.rows;
};


// Get chat messages for a doubt (ONLY if faculty owns the course)
exports.getDoubtMessages = async (facultyId, doubtId) => {

  // 🔒 Authorization check
  const check = await pool.query(
    `SELECT 1
     FROM doubts d
     JOIN courses c ON c.course_id = d.course_id
     WHERE d.doubt_id = $1 AND c.faculty_id = $2`,
    [doubtId, facultyId]
  );

  if (!check.rowCount) {
    throw new Error("Unauthorized");
  }

  const result = await pool.query(
    `SELECT dr.*, u.fname, u.lname
     FROM doubt_responses dr
     JOIN users u ON dr.sender_id = u.user_id
     WHERE dr.doubt_id = $1
     ORDER BY dr.created_at ASC`,
    [doubtId]
  );
  await pool.query(
  `UPDATE doubt_responses
   SET is_read = true
   WHERE doubt_id = $1 AND sender_role = 'student'`,
  [doubtId]
);

  return result.rows;
};


// Send message (faculty reply)
exports.sendDoubtMessage = async (doubtId, facultyId, senderRole, message) => {

  // 🔒 Authorization check
  const check = await pool.query(
    `SELECT 1
     FROM doubts d
     JOIN courses c ON c.course_id = d.course_id
     WHERE d.doubt_id = $1 AND c.faculty_id = $2`,
    [doubtId, facultyId]
  );

  if (!check.rowCount) {
    throw new Error("Unauthorized: Cannot reply to this doubt");
  }

  const result = await pool.query(
    `INSERT INTO doubt_responses (doubt_id, sender_id, sender_role, message)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [doubtId, facultyId, senderRole, message]
  );

  return result.rows[0];
};


// Update doubt status
exports.updateDoubtStatus = async (facultyId, doubtId, status) => {

  // 🔒 Authorization check
  const check = await pool.query(
    `SELECT 1
     FROM doubts d
     JOIN courses c ON c.course_id = d.course_id
     WHERE d.doubt_id = $1 AND c.faculty_id = $2`,
    [doubtId, facultyId]
  );

  if (!check.rowCount) {
    throw new Error("Unauthorized");
  }

  const result = await pool.query(
    `UPDATE doubts
     SET status = $1,
         resolved_at = CASE WHEN $1 = 'RESOLVED' THEN NOW() ELSE NULL END
     WHERE doubt_id = $2
     RETURNING *`,
    [status, doubtId]
  );

  return result.rows[0];
};

/*ASSESSMENTS*/

exports.createAssessment = async (facultyId, courseId, data) => {
  const check = await pool.query(
    `SELECT 1 FROM courses WHERE course_id = $1 AND faculty_id = $2`,
    [courseId, facultyId]
  );

  if (!check.rowCount) {
    const err = new Error("Unauthorized");
    err.statusCode = 403;
    throw err;
  }

  const result = await pool.query(
    `INSERT INTO assessments (course_id, title, description, deadline)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [courseId, data.title, data.description, data.deadline]
  );

  return result.rows[0];
};

exports.evaluateSubmission = async (facultyId, submissionId, score, feedback) => {
  const result = await pool.query(
    `UPDATE assessment_submissions s
     SET score = $1, feedback = $2
     FROM assessments a
     JOIN courses c ON c.course_id = a.course_id
     WHERE s.submission_id = $3
     AND s.assessment_id = a.assessment_id
     AND c.faculty_id = $4
     RETURNING s.*`,
    [score, feedback, submissionId, facultyId]
  );

  if (!result.rowCount) {
    const err = new Error("Unauthorized");
    err.statusCode = 403;
    throw err;
  }

  return result.rows[0];
};

exports.getDoubtById = async (facultyId, doubtId) => {
  const result = await pool.query(
    `SELECT d.doubt_id, d.course_id, d.student_id, d.material_id, d.question, d.status, d.created_at
     FROM doubts d
     JOIN courses c ON c.course_id = d.course_id
     WHERE d.doubt_id = $1 AND c.faculty_id = $2`,
    [doubtId, facultyId]
  );

  if (!result.rowCount) {
    const err = new Error("Doubt not found");
    err.statusCode = 404;
    throw err;
  }

  return result.rows[0];
};

exports.reopenDoubt = async (facultyId, doubtId) => {
  const result = await pool.query(
    `UPDATE doubts d
     SET status = 'UNRESOLVED'
     FROM courses c
     WHERE d.course_id = c.course_id AND c.faculty_id = $1 AND d.doubt_id = $2
     RETURNING d.doubt_id, d.course_id, d.student_id, d.material_id, d.question, d.status, d.created_at`,
    [facultyId, doubtId]
  );

  if (!result.rowCount) {
    const err = new Error("Doubt not found");
    err.statusCode = 404;
    throw err;
  }

  return result.rows[0];
};

exports.getAssessments = async (facultyId, courseId) => {
  const courseCheck = await pool.query(
    `SELECT 1 FROM courses WHERE course_id = $1 AND faculty_id = $2`,
    [courseId, facultyId]
  );

  if (!courseCheck.rowCount) {
    const err = new Error("Course not found or unauthorized");
    err.statusCode = 403;
    throw err;
  }

  const result = await pool.query(
    `SELECT a.assessment_id, a.course_id, a.title, a.description, a.deadline, a.created_at
     FROM assessments a
     JOIN courses c ON c.course_id = a.course_id
     WHERE a.course_id = $1 AND c.faculty_id = $2
     ORDER BY a.created_at DESC`,
    [courseId, facultyId]
  );

  return result.rows;
};

exports.getSubmissions = async (facultyId, assessmentId) => {
  const ownership = await pool.query(
    `SELECT 1 FROM assessments a
     JOIN courses c ON c.course_id = a.course_id
     WHERE a.assessment_id = $1 AND c.faculty_id = $2`,
    [assessmentId, facultyId]
  );

  if (!ownership.rowCount) {
    const err = new Error("Assessment not found or unauthorized");
    err.statusCode = 403;
    throw err;
  }

  const result = await pool.query(
      `SELECT 
      s.submission_id,
      s.student_id,
      s.score,
      s.submitted_at,
      s.feedback,
      s.submission_url,

      u.fname,
      u.lname,
      CASE 
        WHEN s.submitted_at IS NOT NULL AND s.submitted_at > a.deadline THEN true
        ELSE false
      END AS is_late

    FROM assessment_submissions s
    JOIN assessments a ON a.assessment_id = s.assessment_id
    JOIN courses c ON c.course_id = a.course_id
    JOIN users u ON s.student_id = u.user_id

    WHERE a.assessment_id = $1 AND c.faculty_id = $2
    ORDER BY s.submitted_at`,
        [assessmentId, facultyId]
      );

  return result.rows;
};

exports.generateReport = async (facultyId, assessmentId) => {
  const ownership = await pool.query(
    `SELECT 1 FROM assessments a
     JOIN courses c ON c.course_id = a.course_id
     WHERE a.assessment_id = $1 AND c.faculty_id = $2`,
    [assessmentId, facultyId]
  );

  if (!ownership.rowCount) {
    const err = new Error("Assessment not found or unauthorized");
    err.statusCode = 403;
    throw err;
  }

  const result = await pool.query(
    `SELECT
       $1::integer AS assessment_id,
       COUNT(*)::int AS total_submissions,
       COUNT(s.score)::int AS evaluated_count,
       (COUNT(*) - COUNT(s.score))::int AS pending_count,
       AVG(s.score)::numeric AS average_marks
     FROM assessment_submissions s
     WHERE s.assessment_id = $2`,
    [assessmentId, assessmentId]
  );

  const row = result.rows[0];
  return {
    assessment_id: Number(row.assessment_id),
    total_submissions: Number(row.total_submissions) || 0,
    evaluated_count: Number(row.evaluated_count) || 0,
    pending_count: Number(row.pending_count) || 0,
    average_marks: row.average_marks != null ? Number(row.average_marks) : null,
  };
};

exports.deleteAssessment = async (facultyId, assessmentId) => {
  const verifyQuery = `
    SELECT a.assessment_id 
    FROM assessments a
    JOIN courses c ON a.course_id = c.course_id
    WHERE a.assessment_id = $1 
      AND c.faculty_id = $2
  `;

  const verify = await pool.query(verifyQuery, [assessmentId, facultyId]);

  if (!verify.rowCount) {
    const err = new Error("Unauthorized");
    err.statusCode = 403;
    throw err;
  }

  await pool.query(
    `DELETE FROM assessments WHERE assessment_id = $1`,
    [assessmentId]
  );
};