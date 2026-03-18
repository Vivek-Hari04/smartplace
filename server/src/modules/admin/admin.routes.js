const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const adminController = require("./admin.controller");

// All admin routes require admin role
router.use(authMiddleware);
router.use(roleMiddleware("admin"));

/* USER MANAGEMENT */
router.get("/users", adminController.getAllUsers);
router.get("/users/pending", adminController.getPendingUsers);
router.patch("/users/:id/verify", adminController.verifyUser);
router.post("/users/:id/reject", adminController.rejectUser);
router.get("/students", adminController.getFilteredStudents);
router.get("/departments", adminController.getDepartments);
// router.get("/students", getFilteredStudents);
router.get("/students/pending", adminController.getPendingStudents);
router.patch("/students/:id/verify", adminController.verifyStudent);
router.post("/students/assign-advisor", adminController.assignAdvisor);

/* PLACED STUDENTS */
router.get("/placed-students", adminController.getPlacedStudents);
router.get("/placed-students/export/pdf", adminController.exportPlacedStudentsPDF);
router.get("/placed-students/export/csv", adminController.exportPlacedStudentsCSV);

/* SYSTEM OVERSIGHT */
router.get("/stats", adminController.getStats);
router.get("/courses", adminController.getAllCourses);
router.get("/faculty", adminController.getFacultyList);

/* PLACEMENT DRIVE APPROVALS */
router.get("/drives/pending", adminController.getPendingDrives);
router.get("/drives", adminController.getAllDrives);
router.get("/drives/:driveId/registrants", adminController.getDriveRegistrants);
router.patch("/drives/:id/status", adminController.updateDriveStatus);

module.exports = router;
