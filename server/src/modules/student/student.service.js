const pool = require("../../config/db");

/* =========================
   STUDENT PROFILE
========================= */

async function getStudentProfile(userId) {
  const result = await pool.query(
    `SELECT s.*, u.email, u.fname, u.lname,
            adv.fname as advisor_fname, adv.lname as advisor_lname 
     FROM users u
     LEFT JOIN students s ON u.user_id = s.user_id
     LEFT JOIN users adv ON s.advisor_id = adv.user_id
     WHERE u.user_id = $1`,
    [userId]
  );
  return result.rows[0];
}

async function getStaffAdvisors() {
  const result = await pool.query(
    `SELECT u.user_id, u.fname, u.lname, f.department 
     FROM users u
     JOIN faculty f ON u.user_id = f.user_id
     WHERE f.is_staff_advisor = true`
  );
  return result.rows;
}

async function updateStudentProfile(userId, updateData) {
  const { department, graduation_year, cgpa, advisor_id } = updateData;
  
  const result = await pool.query(
    `INSERT INTO students (user_id, department, graduation_year, cgpa, advisor_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET
       department = EXCLUDED.department,
       graduation_year = EXCLUDED.graduation_year,
       cgpa = EXCLUDED.cgpa,
       advisor_id = EXCLUDED.advisor_id
     RETURNING *`,
    [userId, department, graduation_year, cgpa, advisor_id]
  );
  return result.rows[0];
}

/* =========================
   COURSES
========================= */

async function getEnrolledCourses(userId) {
  const result = await pool.query(
    `SELECT e.course_id,
            c.name,
            c.faculty_id,
            u.fname AS faculty_fname,
            u.lname AS faculty_lname
     FROM enrollments e
     JOIN courses c ON e.course_id = c.course_id
     JOIN users u ON c.faculty_id = u.user_id
     WHERE e.student_id = $1`,
    [userId]
  );
  return result.rows;
}

async function getAvailableCourses() {
  const result = await pool.query(
    `SELECT c.course_id, c.name, u.fname AS faculty_fname, u.lname AS faculty_lname
     FROM courses c
     JOIN users u ON u.user_id = c.faculty_id
     WHERE c.availability = true`
  );
  return result.rows;
}

async function enrollInCourse(userId, courseId) {
  const result = await pool.query(
    `INSERT INTO enrollments (student_id, course_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [userId, courseId]
  );
  return result.rows[0];
}

async function getCourseDetails(courseId) {
  const result = await pool.query(
    `SELECT c.course_id,
            c.availability,
            c.faculty_id,
            u.fname,
            u.lname
     FROM courses c
     JOIN users u ON c.faculty_id = u.user_id
     WHERE c.course_id = $1`,
    [courseId]
  );
  return result.rows[0];
}

async function getFacultyContacts(courseId) {
  const result = await pool.query(
    `SELECT u.user_id, u.fname, u.lname, u.email
     FROM courses c
     JOIN users u ON c.faculty_id = u.user_id
     WHERE c.course_id = $1`,
    [courseId]
  );
  return result.rows[0];
}

async function getCourseMaterials(courseId) {
  const result = await pool.query(
    `SELECT material_id, title, file_url
     FROM course_materials
     WHERE course_id = $1`,
    [courseId]
  );
  return result.rows;
}

/* =========================
   ASSESSMENTS
========================= */

async function getUpcomingAssessments() {
  const result = await pool.query(
    `SELECT a.assessment_id,
            a.title,
            a.description,
            a.deadline,
            c.name AS course_name
     FROM assessments a
     JOIN courses c ON a.course_id = c.course_id
     WHERE a.deadline > NOW()
     ORDER BY a.deadline ASC`
  );
  return result.rows;
}

async function getAssessmentDetails(assessmentId) {
  const result = await pool.query(
    `SELECT a.assessment_id,
            a.title,
            a.description,
            a.deadline,
            c.name AS course_name
     FROM assessments a
     JOIN courses c ON a.course_id = c.course_id
     WHERE a.assessment_id = $1`,
    [assessmentId]
  );
  return result.rows[0];
}

async function startAssessment(studentId, assessmentId) {
  const assessmentQuery = `
    SELECT
      a.assessment_id,
      a.title,
      a.description,
      a.deadline
    FROM assessments a
    WHERE a.assessment_id = $1
  `;

  const questionsQuery = `
    SELECT
      q.question_id,
      q.question_text,
      q.options,
      q.marks
    FROM assessment_questions q
    WHERE q.assessment_id = $1
  `;

  const assessment = await pool.query(assessmentQuery, [assessmentId]);

  if (assessment.rows.length === 0) {
    throw new Error("Assessment not available");
  }

  // Allow starting even if deadline passed? The prompt snippet didn't check, 
  // but let's keep the user's focus on returning the correct shape.
  const questions = await pool.query(questionsQuery, [assessmentId]);

  return {
    ...assessment.rows[0],
    questions: questions.rows
  };
}

async function submitAssessment(studentId, assessmentId, submissionUrl) {
  const result = await pool.query(
    `INSERT INTO assessment_submissions
     (assessment_id, student_id, submission_url)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [assessmentId, studentId, submissionUrl]
  );
  return result.rows[0];
}

async function getAssessmentResults(studentId) {
  const result = await pool.query(
    `SELECT s.submission_id,
            s.score,
            s.feedback,
            s.submitted_at,
            a.title
     FROM assessment_submissions s
     JOIN assessments a ON s.assessment_id = a.assessment_id
     WHERE s.student_id = $1
       AND s.score IS NOT NULL
     ORDER BY s.submitted_at DESC`,
    [studentId]
  );
  return result.rows;
}

async function getAssessmentHistory(studentId) {
  const result = await pool.query(
    `SELECT s.submission_id,
            s.submission_url,
            s.score,
            s.feedback,
            s.submitted_at,
            a.title,
            a.deadline
     FROM assessment_submissions s
     JOIN assessments a ON s.assessment_id = a.assessment_id
     WHERE s.student_id = $1
     ORDER BY s.submitted_at DESC`,
    [studentId]
  );
  return result.rows;
}

/* =========================
   PLACEMENT SLOTS
========================= */

async function checkStudentDriveEligibility(studentId, driveId) {
  // 1. Fetch student
  const studentRes = await pool.query(
    `SELECT sm.* FROM students sm WHERE sm.user_id = $1`,
    [studentId]
  );
  if (studentRes.rows.length === 0) {
    return { eligible: false, reason: "Student profile not found" };
  }
  const student = studentRes.rows[0];

  // 2. Fetch drive
  const driveRes = await pool.query(
    `SELECT * FROM placement_drives WHERE drive_id = $1`,
    [driveId]
  );
  if (driveRes.rows.length === 0) {
    return { eligible: false, reason: "Placement drive not found" };
  }
  const drive = driveRes.rows[0];

  // 3. Check already registered
  const regRes = await pool.query(
    `SELECT 1 FROM drive_registrations WHERE student_id = $1 AND drive_id = $2`,
    [studentId, driveId]
  );
  if (regRes.rows.length > 0) {
    return { eligible: false, reason: "Student already registered for this drive" };
  }

  // 4. Check placement eligibility
  if (!student.placement_eligible) {
    return { eligible: false, reason: "Not eligible for placements" };
  }

  // 5. Check CGPA
  if (drive.min_cgpa !== null && Number(student.cgpa) < Number(drive.min_cgpa)) {
    return { eligible: false, reason: "Minimum CGPA requirement not met" };
  }

  // 6. Check Department
  if (drive.eligible_departments && drive.eligible_departments.length > 0) {
    if (!drive.eligible_departments.includes(student.department)) {
      return { eligible: false, reason: "Department not eligible for this drive" };
    }
  }

  // 7. Check Deadline
  if (drive.registration_deadline && new Date(drive.registration_deadline) < new Date()) {
    return { eligible: false, reason: "Registration deadline has passed" };
  }

  return { eligible: true };
}

async function getEligibleDrives(studentId) {
  const result = await pool.query(
    `SELECT pd.*, c.company_name
     FROM placement_drives pd
     LEFT JOIN companies c ON pd.company_id = c.user_id
     WHERE pd.status = 'APPROVED'
       AND pd.drive_date >= CURRENT_DATE
     ORDER BY pd.drive_date ASC`
  );
  
  const eligibleDrives = [];
  for (const drive of result.rows) {
    const el = await checkStudentDriveEligibility(studentId, drive.drive_id);
    if (el.eligible) {
      eligibleDrives.push({
        drive_id: drive.drive_id,
        company_name: drive.company_name,
        drive_date: drive.drive_date,
        role: drive.drive_type,
        package_lpa: "TBD" // Derived typically from offers, marking as TBD when unavailable
      });
    }
  }
  return eligibleDrives;
}

async function getDriveEligibility(studentId) {
  const result = await pool.query(
    `SELECT pd.*, c.company_name
     FROM placement_drives pd
     LEFT JOIN companies c ON pd.company_id = c.user_id
     WHERE pd.status = 'APPROVED'
     ORDER BY pd.drive_date DESC`
  );
  
  const eligibilityList = [];
  for (const drive of result.rows) {
    const el = await checkStudentDriveEligibility(studentId, drive.drive_id);
    eligibilityList.push({
      drive_id: drive.drive_id,
      title: `${drive.company_name} ${drive.drive_type} Drive`,
      eligible: el.eligible,
      reason: el.reason || null
    });
  }
  return eligibilityList;
}

async function getAvailableSlots(studentId) {
  const result = await pool.query(
    `SELECT pd.*, c.company_name
     FROM placement_drives pd
     LEFT JOIN companies c ON pd.company_id = c.user_id
     WHERE pd.drive_date >= CURRENT_DATE
       AND pd.status = 'APPROVED'
       AND pd.drive_id NOT IN (
         SELECT drive_id
         FROM drive_registrations
         WHERE student_id = $1
       )
     ORDER BY pd.drive_date ASC`,
    [studentId]
  );
  return result.rows;
}

async function bookSlot(studentId, driveId) {
  const result = await pool.query(
    `INSERT INTO drive_registrations (drive_id, student_id, status)
     VALUES ($1, $2, 'registered')
     RETURNING *`,
    [driveId, studentId]
  );
  return result.rows[0];
}

async function cancelSlot(studentId, driveId) {
  await pool.query(
    `DELETE FROM drive_registrations
     WHERE drive_id = $1 AND student_id = $2`,
    [driveId, studentId]
  );
  return { message: "Slot cancelled successfully" };
}

async function getMyBookedSlots(studentId) {
  const result = await pool.query(
    `SELECT dr.*, pd.*, c.company_name
     FROM drive_registrations dr
     JOIN placement_drives pd ON dr.drive_id = pd.drive_id
     LEFT JOIN companies c ON pd.company_id = c.user_id
     WHERE dr.student_id = $1
     ORDER BY dr.registered_at DESC`,
    [studentId]
  );
  return result.rows;
}

/* =========================
   OFFERS
========================= */

async function getEligibleOffers(studentId) {
  const result = await pool.query(
    `SELECT po.*, u.fname, u.lname
     FROM placement_offers po
     JOIN users u ON po.company_id = u.user_id
     JOIN drive_registrations dr ON po.drive_id = dr.drive_id
     WHERE po.acceptance_deadline >= CURRENT_DATE
       AND dr.student_id = $1
       AND dr.status = 'selected'`,
    [studentId]
  );
  return result.rows;
}

async function applyForOffer(studentId, offerId) {
  // 1. Fetch the offer to get its drive_id
  const offerRes = await pool.query(
    `SELECT drive_id FROM placement_offers WHERE offer_id = $1`,
    [offerId]
  );

  if (offerRes.rows.length === 0) {
    throw new Error("Offer not found");
  }

  const driveId = offerRes.rows[0].drive_id;

  // 2. Check student's registry status
  const regRes = await pool.query(
    `SELECT status FROM drive_registrations WHERE student_id = $1 AND drive_id = $2`,
    [studentId, driveId]
  );

  if (regRes.rows.length === 0 || regRes.rows[0].status !== 'selected') {
    throw new Error("You are not selected for this drive");
  }

  const result = await pool.query(
    `INSERT INTO offer_applications (offer_id, student_id)
     VALUES ($1, $2)
     RETURNING *`,
    [offerId, studentId]
  );
  return result.rows[0];
}

async function getMyApplications(studentId) {
  const result = await pool.query(
    `SELECT oa.*, po.title, po.package_lpa
     FROM offer_applications oa
     JOIN placement_offers po ON oa.offer_id = po.offer_id
     WHERE oa.student_id = $1
     ORDER BY oa.applied_at DESC`,
    [studentId]
  );
  return result.rows;
}

async function getOfferStatus(studentId, applicationId) {
  const result = await pool.query(
    `SELECT *
     FROM offer_applications
     WHERE application_id = $1
       AND student_id = $2`,
    [applicationId, studentId]
  );
  return result.rows[0];
}

async function withdrawApplication(studentId, applicationId) {
  const result = await pool.query(
    `UPDATE offer_applications
     SET status = 'withdrawn',
         updated_at = NOW()
     WHERE application_id = $1
       AND student_id = $2
     RETURNING *`,
    [applicationId, studentId]
  );
  return result.rows[0];
}

async function getOfferHistory(studentId) {
  const result = await pool.query(
    `SELECT oa.*, po.title, po.package_lpa
     FROM offer_applications oa
     JOIN placement_offers po ON oa.offer_id = po.offer_id
     WHERE oa.student_id = $1
     ORDER BY oa.applied_at DESC`,
    [studentId]
  );
  return result.rows;
}

async function getDriveStatus(studentId) {
  const result = await pool.query(
    `SELECT
       d.drive_id,
       d.drive_date,
       d.drive_type,
       c.company_name,
       r.status
     FROM drive_registrations r
     JOIN placement_drives d ON d.drive_id = r.drive_id
     JOIN companies c ON c.user_id = d.company_id
     WHERE r.student_id = $1
     ORDER BY d.drive_date DESC`,
    [studentId]
  );
  return result.rows;
}

module.exports = {
  getStudentProfile,
  getStaffAdvisors,
  updateStudentProfile,
  getEnrolledCourses,
  getAvailableCourses,
  enrollInCourse,
  getCourseDetails,
  getFacultyContacts,
  getCourseMaterials,
  getUpcomingAssessments,
  getAssessmentDetails,
  startAssessment,
  submitAssessment,
  getAssessmentResults,
  getAssessmentHistory,
  checkStudentDriveEligibility,
  getEligibleDrives,
  getDriveEligibility,
  getAvailableSlots,
  bookSlot,
  cancelSlot,
  getMyBookedSlots,
  getDriveStatus,
  getEligibleOffers,
  applyForOffer,
  getMyApplications,
  getOfferStatus,
  withdrawApplication,
  getOfferHistory
};