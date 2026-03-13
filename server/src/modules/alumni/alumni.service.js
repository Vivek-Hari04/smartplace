const pool = require("../../config/db");

/* =========================
   ALUMNI PROFILE
   ========================= */

async function getAlumniProfile(userId) {
  const result = await pool.query(
    `SELECT u.user_id, u.email, u.fname, u.lname, a.company, a.graduation_year 
     FROM users u
     LEFT JOIN alumni a ON u.user_id = a.user_id
     WHERE u.user_id = $1`,
    [userId]
  );
  return result.rows[0];
}

async function updateAlumniProfile(userId, profileData) {
  const { company, graduation_year } = profileData;
  const result = await pool.query(
    `INSERT INTO alumni (user_id, company, graduation_year)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) 
     DO UPDATE SET 
        company = EXCLUDED.company,
        graduation_year = EXCLUDED.graduation_year
     RETURNING *`,
    [userId, company, graduation_year]
  );
  return result.rows[0];
}

/* =========================
   PLACEMENT DISCUSSIONS
   ========================= */

async function getAllDiscussions() {
  const result = await pool.query(
    `SELECT d.*, u.fname, u.lname, u.role
     FROM placement_discussions d
     JOIN users u ON d.user_id = u.user_id
     ORDER BY d.created_at DESC`
  );
  return result.rows;
}

async function createDiscussion(userId, discussionData) {
  const { title, content, company_tag } = discussionData;
  const result = await pool.query(
    `INSERT INTO placement_discussions (user_id, title, content, company_tag)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, title, content, company_tag]
  );
  return result.rows[0];
}

async function getDiscussionById(discussionId) {
  const result = await pool.query(
    `SELECT d.*, u.fname, u.lname, u.role
     FROM placement_discussions d
     JOIN users u ON d.user_id = u.user_id
     WHERE d.id = $1`,
    [discussionId]
  );
  return result.rows[0];
}

async function deleteDiscussion(discussionId, userId) {
    const result = await pool.query(
        `DELETE FROM placement_discussions 
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [discussionId, userId]
    );
    return result.rows[0];
}

/* =========================
   DISCUSSION REPLIES
   ========================= */

async function getRepliesByDiscussionId(discussionId) {
  const result = await pool.query(
    `SELECT r.*, u.fname, u.lname, u.role, 
            a.company as current_company, a.graduation_year as batch
     FROM discussion_replies r
     JOIN users u ON r.user_id = u.user_id
     LEFT JOIN alumni a ON r.user_id = a.user_id
     WHERE r.discussion_id = $1
     ORDER BY r.created_at ASC`,
    [discussionId]
  );
  return result.rows;
}

async function createReply(userId, discussionId, content) {
    const result = await pool.query(
        `INSERT INTO discussion_replies (user_id, discussion_id, content)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId, discussionId, content]
    );
    return result.rows[0];
}

module.exports = {
  getAllDiscussions,
  createDiscussion,
  getDiscussionById,
  deleteDiscussion,
  getRepliesByDiscussionId,
  createReply,
  getAlumniProfile,
  updateAlumniProfile
};
