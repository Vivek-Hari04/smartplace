const express = require("express");
const router = express.Router();

const studentController = require("./student.controller.js");
const authMiddleware = require("../../middleware/auth.middleware");
//const requireStudent = require("../middleware/role.middleware");

router.use(authMiddleware);
//router.use(requireMiddleware("student"));

/* =========================
   STUDENT PROFILE
========================= */

router.get(
  "/profile",
  authMiddleware,
  studentController.getStudentProfile
);

router.get(
  "/advisors",
  authMiddleware,
  studentController.getStaffAdvisors
);

router.put(
  "/profile",
  authMiddleware,
  studentController.updateStudentProfile
);

/* =========================
   COURSES
========================= */

router.get(
  "/courses/enrolled",
  authMiddleware,
  studentController.getEnrolledCourses
);

router.get(
  "/courses/available",
  authMiddleware,
  studentController.getAvailableCourses
);

router.post(
  "/courses/enroll/:courseId",
  authMiddleware,
  studentController.enrollInCourse
);

router.get(
  "/courses/:courseId/materials",
  authMiddleware,
  studentController.getCourseMaterials
);

router.get(
  "/courses/:courseId",
  authMiddleware,
  studentController.getCourseDetails
);

router.get(
  "/courses/:courseId/faculty",
  authMiddleware,
  studentController.getFacultyContacts
);

/* =========================
   ASSESSMENTS
========================= */

router.get(
  "/assessments/upcoming",
  authMiddleware,
  studentController.getUpcomingAssessments
);

router.get(
  "/assessments/results",
  authMiddleware,
  studentController.getAssessmentResults
);

router.get(
  "/assessments/history",
  authMiddleware,
  studentController.getAssessmentHistory
);

router.get(
  "/assessments/:assessmentId",
  authMiddleware,
  studentController.getAssessmentDetails
);

router.get(
  "/assessments/:assessmentId/start",
  authMiddleware,
  studentController.startAssessment
);

router.post(
  "/assessments/submit",
  authMiddleware,
  studentController.submitAssessment
);

/* =========================
   PLACEMENT SLOTS
========================= */

router.get(
  "/slots/available",
  authMiddleware,
  studentController.getAvailableSlots
);

router.post(
  "/slots/book",
  authMiddleware,
  studentController.bookSlot
);

router.delete(
  "/slots/:driveId",
  authMiddleware,
  studentController.cancelSlot
);

router.get(
  "/slots/my",
  authMiddleware,
  studentController.getMyBookedSlots
);

/* =========================
   OFFERS
========================= */

router.get(
  "/offers/eligible",
  authMiddleware,
  studentController.getEligibleOffers
);

router.post(
  "/offers/apply",
  authMiddleware,
  studentController.applyForOffer
);

router.get(
  "/offers/applications",
  authMiddleware,
  studentController.getMyApplications
);

router.get(
  "/offers/status/:applicationId",
  authMiddleware,
  studentController.getOfferStatus
);

router.put(
  "/offers/withdraw/:applicationId",
  authMiddleware,
  studentController.withdrawApplication
);

router.get(
  "/offers/history",
  authMiddleware,
  studentController.getOfferHistory
);

module.exports = router;
