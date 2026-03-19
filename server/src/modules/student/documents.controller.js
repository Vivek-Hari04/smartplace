const documentsService = require('./documents.service');

exports.uploadDocument = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { document_type } = req.body;
    const file = req.file;

    if (!file || !document_type) {
      return res.status(400).json({ error: 'File and document_type are required' });
    }

    const doc = await documentsService.uploadDocument(studentId, document_type, file);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

exports.getMyDocuments = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const docs = await documentsService.getMyDocuments(studentId);
    res.json(docs);
  } catch (err) {
    next(err);
  }
};

exports.viewDocument = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { id } = req.params;
    const url = await documentsService.viewDocument(studentId, id);
    res.json({ url });
  } catch (err) {
    next(err);
  }
};
