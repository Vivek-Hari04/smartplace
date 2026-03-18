const pool = require('../../config/db');
const supabase = require('../../config/supabaseAdmin');

exports.uploadDocument = async (studentId, documentType, file) => {
  const filePath = `${studentId}/${Date.now()}_${file.originalname}`;

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    throw new Error('Supabase upload failed: ' + error.message);
  }

  const result = await pool.query(
    `INSERT INTO student_documents
     (student_id, document_type, file_url, file_name, status)
     VALUES ($1, $2, $3, $4, 'PENDING')
     RETURNING *`,
    [studentId, documentType, filePath, file.originalname]
  );

  return result.rows[0];
};

exports.getMyDocuments = async (studentId) => {
  const result = await pool.query(
    `SELECT document_id, document_type, file_name, status, created_at 
     FROM student_documents 
     WHERE student_id = $1 
     ORDER BY created_at DESC`,
    [studentId]
  );
  return result.rows;
};

exports.viewDocument = async (studentId, documentId) => {
  const result = await pool.query(
    `SELECT file_url FROM student_documents WHERE document_id = $1 AND student_id = $2`,
    [documentId, studentId]
  );

  if (!result.rows.length) {
    throw new Error('Document not found');
  }

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(result.rows[0].file_url, 300);

  if (error) {
    throw new Error('Failed to generate signed URL: ' + error.message);
  }

  return data.signedUrl;
};
