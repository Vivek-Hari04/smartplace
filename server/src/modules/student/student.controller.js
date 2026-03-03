const studentService = require("./student.service");

/* =========================
   STUDENT PROFILE
========================= */

async function getStudentProfile(req, res) {
  try {
    const data = await studentService.getStudentProfile(req.user.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function updateStudentProfile(req, res) {
  try {
    const data = await studentService.updateStudentProfile(
      req.user.id,
      req.body
    );
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/* =========================
   COURSES
========================= */

async function getEnrolledCourses(req, res) {
  try {
    const data = await studentService.getEnrolledCourses(req.user.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getAvailableCourses(req, res) {
  try {
    const data = await studentService.getAvailableCourses();
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function enrollInCourse(req, res) {
  try {
    const { courseId } = req.body;
    const data = await studentService.enrollInCourse(
      req.user.id,
      courseId
    );
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getCourseDetails(req, res) {
  try {
    const { courseId } = req.params;
    const data = await studentService.getCourseDetails(courseId);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getFacultyContacts(req, res) {
  try {
    const { courseId } = req.params;
    const data = await studentService.getFacultyContacts(courseId);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/* =========================
   ASSESSMENTS
========================= */

async function getUpcomingAssessments(req, res) {
  try {
    const data = await studentService.getUpcomingAssessments();
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getAssessmentDetails(req, res) {
  try {
    const { assessmentId } = req.params;
    const data = await studentService.getAssessmentDetails(assessmentId);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function startAssessment(req, res) {
  try {
    const { assessmentId } = req.params;
    const data = await studentService.startAssessment(
      req.user.id,
      assessmentId
    );
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function submitAssessment(req, res) {
  try {
    const { assessmentId, submissionUrl } = req.body;
    const data = await studentService.submitAssessment(
      req.user.id,
      assessmentId,
      submissionUrl
    );
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getAssessmentResults(req, res) {
  try {
    const data = await studentService.getAssessmentResults(req.user.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getAssessmentHistory(req, res) {
  try {
    const data = await studentService.getAssessmentHistory(req.user.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/* =========================
   PLACEMENT SLOTS
========================= */

async function getAvailableSlots(req, res) {
  try {
    const data = await studentService.getAvailableSlots(req.user.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function bookSlot(req, res) {
  try {
    const { driveId } = req.body;
    const data = await studentService.bookSlot(
      req.user.id,
      driveId
    );
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function cancelSlot(req, res) {
  try {
    const { driveId } = req.params;
    const data = await studentService.cancelSlot(
      req.user.id,
      driveId
    );
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getMyBookedSlots(req, res) {
  try {
    const data = await studentService.getMyBookedSlots(req.user.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/* =========================
   OFFERS
========================= */

async function getEligibleOffers(req, res) {
  try {
    const data = await studentService.getEligibleOffers(req.user.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function applyForOffer(req, res) {
  try {
    const { offerId } = req.body;
    const data = await studentService.applyForOffer(
      req.user.id,
      offerId
    );
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getMyApplications(req, res) {
  try {
    const data = await studentService.getMyApplications(req.user.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getOfferStatus(req, res) {
  try {
    const { applicationId } = req.params;
    const data = await studentService.getOfferStatus(
      req.user.id,
      applicationId
    );
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function withdrawApplication(req, res) {
  try {
    const { applicationId } = req.params;
    const data = await studentService.withdrawApplication(
      req.user.id,
      applicationId
    );
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getOfferHistory(req, res) {
  try {
    const data = await studentService.getOfferHistory(req.user.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  getStudentProfile,
  updateStudentProfile,
  getEnrolledCourses,
  getAvailableCourses,
  enrollInCourse,
  getCourseDetails,
  getFacultyContacts,
  getUpcomingAssessments,
  getAssessmentDetails,
  startAssessment,
  submitAssessment,
  getAssessmentResults,
  getAssessmentHistory,
  getAvailableSlots,
  bookSlot,
  cancelSlot,
  getMyBookedSlots,
  getEligibleOffers,
  applyForOffer,
  getMyApplications,
  getOfferStatus,
  withdrawApplication,
  getOfferHistory
};
