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

async function getStaffAdvisors(req, res) {
  try {
    const data = await studentService.getStaffAdvisors();
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
    const { courseId } = req.params;
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

async function getCourseMaterials(req, res) {
  try {
    const { courseId } = req.params;
    const data = await studentService.getCourseMaterials(courseId);
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
    const studentId = req.user.id;

    const data = await studentService.getUpcomingAssessments(studentId);

    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function submitDoubt(req, res) {
  try {
    const studentId = req.user.id;
    const { course_id, doubt_text } = req.body;

    if (!course_id || !doubt_text) {
      return res.status(400).json({ error: "course_id and doubt_text are required" });
    }

    const doubt = await studentService.submitDoubt(studentId, course_id, doubt_text);
    res.status(201).json(doubt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getAssessmentDetails(req, res) {
  try {
    const studentId = req.user.id;
    const { assessmentId } = req.params;

    const data = await studentService.getAssessmentDetails(studentId, assessmentId);

    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function startAssessment(req, res) {
  try {
    const studentId = req.user.user_id || req.user.id;
    const { assessmentId } = req.params;
    const data = await studentService.startAssessment(
      studentId,
      assessmentId
    );
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}



async function submitAssessment(req, res) {
  try {
    const studentId = req.user.user_id || req.user.id;
    const { assessmentId } = req.params;
    const { submission_link } = req.body;

    if (!submission_link) {
      return res.status(400).json({ error: "submission_link is required" });
    }

    const data = await studentService.submitAssessment(
      studentId,
      assessmentId,
      submission_link
    );
    res.status(200).json(data);
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
    const studentId = req.user.user_id || req.user.id;
    const data = await studentService.getAssessmentHistory(studentId);
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

    // Check eligibility first
    const eligibility = await studentService.checkStudentDriveEligibility(req.user.id, driveId);
    if (!eligibility.eligible) {
      return res.status(403).json({ error: eligibility.reason });
    }

    const data = await studentService.bookSlot(
      req.user.id,
      driveId
    );
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getEligibleDrives(req, res) {
  try {
    const data = await studentService.getEligibleDrives(req.user.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getDriveEligibility(req, res) {
  try {
    const data = await studentService.getDriveEligibility(req.user.id);
    res.status(200).json(data);
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

async function getDriveStatus(req, res) {
  try {
    const data = await studentService.getDriveStatus(req.user.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/* =========================
   OFFERS
========================= */

async function respondToOffer(req, res) {
  try {
    const { offerId, decision } = req.body;
    const data = await studentService.respondToOffer(req.user.id, offerId, decision);
    res.status(200).json(data);
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
async function getStudentDoubts(req, res) {
  try {
    const data = await studentService.getStudentDoubts(req.user.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
async function getDoubtMessages(req, res) {
  try {
    const studentId = req.user.id; //  IMPORTANT
    const { doubtId } = req.params;

    //  mark messages as read
    await studentService.markMessagesAsRead(studentId, doubtId);

    // fetch messages
    const data = await studentService.getDoubtMessages(doubtId);

    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function sendDoubtMessage(req, res) {
  try {
    const { doubtId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const data = await studentService.sendDoubtMessage(
      doubtId,
      req.user.id,
      "student",
      message
    );

    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function updateDoubtStatus(req, res) {
  try {
    const { doubtId } = req.params;
    const { status } = req.body;

    const data = await studentService.updateDoubtStatus(doubtId, status);

    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function deleteDoubt(req, res) {
  try {
    const studentId = req.user.id;
    const { doubtId } = req.params;

    await studentService.deleteDoubt(studentId, doubtId);

    res.status(200).json({ message: "Doubt deleted successfully" });
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
}




module.exports = {
  getStudentProfile,
  getStaffAdvisors,
  updateStudentProfile,
  getEnrolledCourses,
  getAvailableCourses,
  enrollInCourse,
  getCourseDetails,
  getFacultyContacts,
  getCourseMaterials,
  getUpcomingAssessments,
  getAssessmentDetails,
  startAssessment,
  submitAssessment,
  getAssessmentResults,
  getAssessmentHistory,
  getEligibleDrives,
  getDriveEligibility,
  getAvailableSlots,
  bookSlot,
  cancelSlot,
  getMyBookedSlots,
  getDriveStatus,
  respondToOffer,
  getMyApplications,
  getOfferStatus,
  withdrawApplication,
  getOfferHistory,
  submitDoubt,
  getStudentDoubts,
  getDoubtMessages,
  sendDoubtMessage,
  updateDoubtStatus,
  deleteDoubt
};
