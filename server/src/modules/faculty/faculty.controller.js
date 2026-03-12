// modules/faculty/faculty.controller.js

const facultyService = require("./faculty.service");

/*COURSE MANAGEMENT*/

exports.createCourse = async (req, res, next) => {
  try {
    const course = await facultyService.createCourse(req.user.id, req.body);
    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
};

exports.getMyCourses = async (req, res, next) => {
  try {
    const courses = await facultyService.getMyCourses(req.user.id);
    res.json(courses);
  } catch (err) {
    next(err);
  }
};

exports.getCourseById = async (req, res, next) => {
  try {
    const course = await facultyService.getCourseById(
      req.user.id,
      req.params.id
    );
    res.json(course);
  } catch (err) {
    next(err);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const updated = await facultyService.updateCourse(
      req.user.id,
      req.params.id,
      req.body
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.toggleAvailability = async (req, res, next) => {
  try {
    const updated = await facultyService.toggleAvailability(
      req.user.id,
      req.params.id
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    await facultyService.deleteCourse(req.user.id, req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    next(err);
  }
};

/*ENROLLMENTS*/

exports.getEnrolledStudents = async (req, res, next) => {
  try {
    const students = await facultyService.getEnrolledStudents(
      req.user.id,
      req.params.id
    );
    res.json(students);
  } catch (err) {
    next(err);
  }
};


/*MATERIALS*/

exports.uploadMaterial = async (req, res, next) => {
  try {
    const material = await facultyService.uploadMaterial(
      req.user.id,
      req.params.id,
      req.body   // <-- pass whole body
    );
    res.status(201).json(material);
  } catch (err) {
    next(err);
  }
};

exports.getMaterials = async (req, res, next) => {
  try {
    const materials = await facultyService.getMaterials(
      req.user.id,
      req.params.id
    );
    res.json(materials);
  } catch (err) {
    next(err);
  }
};

exports.updateMaterial = async (req, res, next) => {
  try {
    const updated = await facultyService.updateMaterial(
      req.user.id,
      req.params.id,
      req.body
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.deleteMaterial = async (req, res, next) => {
  try {
    await facultyService.deleteMaterial(req.user.id, req.params.id);
    res.json({ message: "Material deleted successfully" });
  } catch (err) {
    next(err);
  }
};

/*DOUBTS*/

exports.getDoubts = async (req, res, next) => {
  try {
    const doubts = await facultyService.getDoubts(req.user.id);
    res.json(doubts);
  } catch (err) {
    next(err);
  }
};

exports.getDoubtById = async (req, res, next) => {
  try {
    const doubt = await facultyService.getDoubtById(
      req.user.id,
      req.params.id
    );
    res.json(doubt);
  } catch (err) {
    next(err);
  }
};

exports.respondToDoubt = async (req, res, next) => {
  try {
    const result = await facultyService.respondToDoubt(
      req.user.id,
      req.params.id,
      req.body.response
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.reopenDoubt = async (req, res, next) => {
  try {
    const result = await facultyService.reopenDoubt(
      req.user.id,
      req.params.id
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/*ASSESSMENTS*/

exports.createAssessment = async (req, res, next) => {
  try {
    const assessment = await facultyService.createAssessment(
      req.user.id,
      req.params.id,
      req.body
    );
    res.status(201).json(assessment);
  } catch (err) {
    next(err);
  }
};

exports.getAssessments = async (req, res, next) => {
  try {
    const assessments = await facultyService.getAssessments(
      req.user.id,
      req.params.id
    );
    res.json(assessments);
  } catch (err) {
    next(err);
  }
};

exports.getSubmissions = async (req, res, next) => {
  try {
    const submissions = await facultyService.getSubmissions(
      req.user.id,
      req.params.id
    );
    res.json(submissions);
  } catch (err) {
    next(err);
  }
};

exports.evaluateSubmission = async (req, res, next) => {
  try {
    const result = await facultyService.evaluateSubmission(
      req.user.id,
      req.params.id,
      req.body.score,
      req.body.feedback
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.generateReport = async (req, res, next) => {
  try {
    const report = await facultyService.generateReport(
      req.user.id,
      req.params.id
    );
    res.json(report);
  } catch (err) {
    next(err);
  }
};

exports.deleteAssessment = async (req, res, next) => {
  try {
    const facultyId = req.user.user_id || req.user.id;
    const { id: assessmentId } = req.params;

    await facultyService.deleteAssessment(facultyId, assessmentId);

    res.json({ message: "Assessment deleted" });
  } catch (err) {
    next(err);
  }
};