// modules/faculty/faculty.routes.js

const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const facultyController = require("./faculty.controller");

// All faculty routes require faculty role
router.use(authMiddleware);
router.use(roleMiddleware("faculty"));

// Course Management
router.post("/courses", facultyController.createCourse);
router.get("/courses", facultyController.getMyCourses);
router.get("/courses/:id", facultyController.getCourseById);
router.put("/courses/:id", facultyController.updateCourse);
router.patch("/courses/:id/toggle", facultyController.toggleAvailability);
router.delete("/courses/:id", facultyController.deleteCourse);

// Enrollment Visibility
router.get("/courses/:id/students", facultyController.getEnrolledStudents);

// Materials
router.post("/courses/:id/materials", facultyController.uploadMaterial);
router.get("/courses/:id/materials", facultyController.getMaterials);
router.put("/materials/:id", facultyController.updateMaterial);
router.delete("/materials/:id", facultyController.deleteMaterial);

// Doubts
router.get("/doubts", facultyController.getDoubts);
router.get("/doubts/:id", facultyController.getDoubtById);
router.post("/doubts/:id/respond", facultyController.respondToDoubt);
router.patch("/doubts/:id/reopen", facultyController.reopenDoubt);

// Assessments
router.post("/courses/:id/assessments", facultyController.createAssessment);
router.get("/courses/:id/assessments", facultyController.getAssessments);
router.get("/assessments/:id/submissions", facultyController.getSubmissions);
router.patch("/submissions/:id/evaluate", facultyController.evaluateSubmission);
router.get("/assessments/:id/report", facultyController.generateReport);
router.delete("/assessments/:id", facultyController.deleteAssessment);

module.exports = router;