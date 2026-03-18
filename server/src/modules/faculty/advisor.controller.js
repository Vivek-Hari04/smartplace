// modules/faculty/advisor.controller.js

const advisorService = require("./advisor.service");

exports.getMyStudents = async (req, res, next) => {
  try {
    const students = await advisorService.getMyStudents(req.user.id);
    res.json(students);
  } catch (err) {
    next(err);
  }
};

exports.getStudentDocuments = async (req, res, next) => {
  try {
    const docs = await advisorService.getStudentDocuments(
      req.user.id,
      req.params.id
    );
    res.json(docs);
  } catch (err) {
    next(err);
  }
};

exports.verifyDocument = async (req, res, next) => {
  try {
    const result = await advisorService.verifyDocument(
      req.user.id,
      req.params.id
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.rejectDocument = async (req, res, next) => {
  try {
    const result = await advisorService.rejectDocument(
      req.user.id,
      req.params.id
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getPendingDocuments = async (req, res, next) => {
  try {
    const docs = await advisorService.getPendingDocuments();
    res.json(docs);
  } catch (err) {
    next(err);
  }
};

exports.viewDocument = async (req, res, next) => {
  try {
    const url = await advisorService.viewDocument(req.params.id);
    res.json({ url });
  } catch (err) {
    next(err);
  }
};

exports.updateDocumentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const result = await advisorService.updateDocumentStatus(req.user.id, req.params.id, status);
    res.json(result);
  } catch (err) {
    next(err);
  }
};