const pool = require("../../config/db");

/* =========================
   COMPANY PROFILE
========================= */

async function getCompanyProfile(userId) {
  const result = await pool.query(
    `SELECT c.*, u.email, u.fname, u.lname 
     FROM users u
     LEFT JOIN companies c ON u.user_id = c.user_id
     WHERE u.user_id = $1`,
    [userId]
  );
  return result.rows[0];
}

async function updateCompanyProfile(userId, updateData) {
  const { company_name, website, industry, description, contact_person } = updateData;
  
  const result = await pool.query(
    `INSERT INTO companies (user_id, company_name, website, industry, description, contact_person)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id) DO UPDATE SET
       company_name = EXCLUDED.company_name,
       website = EXCLUDED.website,
       industry = EXCLUDED.industry,
       description = EXCLUDED.description,
       contact_person = EXCLUDED.contact_person
     RETURNING *`,
    [userId, company_name, website, industry, description, contact_person]
  );
  return result.rows[0];
}

/* =========================
   PLACEMENT DRIVES
========================= */

async function requestPlacementDrive(userId, driveData) {
  const { drive_date, start_time, end_time, mode, drive_type, location, meeting_link, min_cgpa, eligible_departments, registration_deadline, graduation_year } = driveData;
  
  if (min_cgpa !== undefined && (min_cgpa < 0 || min_cgpa > 10)) {
    throw new Error("Invalid CGPA requirement");
  }

  if (registration_deadline && new Date(registration_deadline) >= new Date(drive_date)) {
    throw new Error("Registration deadline must be before the drive date");
  }

  if (eligible_departments && eligible_departments.length > 0) {
    const validDeptRes = await pool.query(`SELECT DISTINCT department FROM students WHERE department IS NOT NULL`);
    const validDepts = validDeptRes.rows.map(r => r.department);
    for (const dept of eligible_departments) {
      if (!validDepts.includes(dept)) {
        throw new Error(`Invalid department: ${dept}`);
      }
    }
  }

  if (graduation_year) {
    const validYearRes = await pool.query(`SELECT DISTINCT graduation_year FROM students WHERE graduation_year IS NOT NULL`);
    const validYears = validYearRes.rows.map(r => r.graduation_year.toString());
    if (!validYears.includes(graduation_year.toString())) {
      throw new Error(`Invalid graduation year: ${graduation_year}`);
    }
  }

  const result = await pool.query(
    `INSERT INTO placement_drives 
     (company_id, drive_date, start_time, end_time, mode, drive_type, location, meeting_link, status, min_cgpa, eligible_departments, registration_deadline)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', $9, $10, $11)
     RETURNING *`,
    [userId, drive_date, start_time, end_time, mode, drive_type, location, meeting_link, min_cgpa !== undefined ? min_cgpa : null, eligible_departments || null, registration_deadline || null]
  );
  return result.rows[0];
}

async function getFormOptions() {
  const deptsRes = await pool.query(`SELECT DISTINCT department FROM students WHERE department IS NOT NULL`);
  const yearsRes = await pool.query(`SELECT DISTINCT graduation_year FROM students WHERE graduation_year IS NOT NULL ORDER BY graduation_year DESC`);
  return {
    departments: deptsRes.rows.map(r => r.department),
    graduation_years: yearsRes.rows.map(r => r.graduation_year)
  };
}

async function getMyDrives(userId) {
  const result = await pool.query(
    `SELECT * FROM placement_drives WHERE company_id = $1 ORDER BY drive_date DESC`,
    [userId]
  );
  return result.rows;
}

/* =========================
   PLACEMENT OFFERS
========================= */

async function createOffer(userId, offerData) {
  const { drive_id, title, description, package_lpa, location, acceptance_deadline } = offerData;
  
  // Verify drive belongs to company and is approved
  const driveCheck = await pool.query(
    `SELECT 1 FROM placement_drives WHERE drive_id = $1 AND company_id = $2 AND status = 'APPROVED'`,
    [drive_id, userId]
  );

  if (driveCheck.rows.length === 0) {
    throw new Error("Invalid drive ID or drive not yet approved by admin.");
  }

  const result = await pool.query(
    `INSERT INTO placement_offers 
     (drive_id, company_id, title, description, package_lpa, location, acceptance_deadline)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [drive_id, userId, title, description, package_lpa, location, acceptance_deadline]
  );
  return result.rows[0];
}

async function getMyOffers(userId) {
  const result = await pool.query(
    `SELECT po.*, pd.drive_date 
     FROM placement_offers po
     JOIN placement_drives pd ON po.drive_id = pd.drive_id
     WHERE po.company_id = $1`,
    [userId]
  );
  return result.rows;
}

/* =========================
   APPLICANTS
========================= */

async function getDriveApplicants(userId, driveId) {
  const result = await pool.query(
    `SELECT dr.*, u.fname, u.lname, u.email, s.cgpa, s.department
     FROM drive_registrations dr
     JOIN placement_drives pd ON dr.drive_id = pd.drive_id
     JOIN users u ON dr.student_id = u.user_id
     JOIN students s ON u.user_id = s.user_id
     WHERE pd.drive_id = $1 AND pd.company_id = $2`,
    [driveId, userId]
  );
  return result.rows;
}

async function updateApplicantStatus(userId, registrationId, status) {
  // Ensure the registration belongs to a drive owned by this company
  const result = await pool.query(
    `UPDATE drive_registrations dr
     SET status = $1
     FROM placement_drives pd
     WHERE dr.drive_id = pd.drive_id 
       AND pd.company_id = $2
       AND dr.registration_id = $3
     RETURNING dr.*`,
    [status, userId, registrationId]
  );
  
  if (result.rows.length === 0) {
    throw new Error("Applicant record not found or unauthorized");
  }
  return result.rows[0];
}

async function getOfferApplicants(companyId, offerId) {
  const offerRes = await pool.query(
    `SELECT * FROM placement_offers WHERE offer_id = $1 AND company_id = $2`,
    [offerId, companyId]
  );
  if (offerRes.rows.length === 0) {
    throw new Error("Offer not found or unauthorized");
  }

  const result = await pool.query(
    `SELECT
       oa.application_id,
       s.user_id AS student_id,
       u.fname,
       u.lname,
       s.department,
       s.cgpa,
       oa.status
     FROM offer_applications oa
     JOIN students s ON s.user_id = oa.student_id
     JOIN users u ON u.user_id = s.user_id
     WHERE oa.offer_id = $1`,
    [offerId]
  );
  return result.rows;
}

async function hireApplicant(companyId, applicationId) {
  const appRes = await pool.query(
    `SELECT oa.* FROM offer_applications oa
     JOIN placement_offers po ON oa.offer_id = po.offer_id
     WHERE oa.application_id = $1 AND po.company_id = $2`,
    [applicationId, companyId]
  );
  if (appRes.rows.length === 0) {
    throw new Error("Application not found or unauthorized");
  }
  
  const studentId = appRes.rows[0].student_id;

  const result = await pool.query(
    `UPDATE offer_applications
     SET status = 'accepted', updated_at = NOW()
     WHERE application_id = $1
     RETURNING *`,
    [applicationId]
  );

  await pool.query(
    `UPDATE students SET placement_eligible = false WHERE user_id = $1`,
    [studentId]
  );

  return result.rows[0];
}

module.exports = {
  getCompanyProfile,
  updateCompanyProfile,
  requestPlacementDrive,
  getFormOptions,
  getMyDrives,
  createOffer,
  getMyOffers,
  getDriveApplicants,
  updateApplicantStatus,
  getOfferApplicants,
  hireApplicant
};
