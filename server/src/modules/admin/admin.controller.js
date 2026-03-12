const adminService = require("./admin.service");

/* USERS */

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await adminService.getAllUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.getPendingStudents = async (req, res, next) => {
  try {
    const students = await adminService.getPendingStudents();
    res.json(students);
  } catch (err) {
    next(err);
  }
};

exports.getFilteredStudents = async (req, res, next) => {
  try {
    const students = await adminService.getFilteredStudents(req.query);
    res.json({ students });
  } catch (err) {
    next(err);
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const departments = await adminService.getDepartments();
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch departments" });
  }
};

exports.verifyStudent = async (req, res, next) => {
  try {
    const student = await adminService.verifyStudent(req.params.id);
    res.json({ message: "Student verified successfully", student });
  } catch (err) {
    next(err);
  }
};

exports.assignAdvisor = async (req, res, next) => {
  try {
    const { studentId, advisorId } = req.body;
    const student = await adminService.assignAdvisor(studentId, advisorId);
    res.json({ message: "Advisor assigned successfully", student });
  } catch (err) {
    next(err);
  }
};

/* SYSTEM STATS */

exports.getStats = async (req, res, next) => {
  try {
    const stats = await adminService.getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

/* SYSTEM DATA */

exports.getAllCourses = async (req, res, next) => {
  try {
    const courses = await adminService.getAllCourses();
    res.json(courses);
  } catch (err) {
    next(err);
  }
};

exports.getFacultyList = async (req, res, next) => {
  try {
    const faculty = await adminService.getFacultyList();
    res.json(faculty);
  } catch (err) {
    next(err);
  }
};

/* PLACEMENT DRIVES */

exports.getPendingDrives = async (req, res, next) => {
  try {
    const drives = await adminService.getPendingDrives();
    res.json(drives);
  } catch (err) {
    next(err);
  }
};

exports.updateDriveStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const drive = await adminService.updateDriveStatus(req.params.id, status);
    res.json({ message: `Drive ${status.toLowerCase()} successfully`, drive });
  } catch (err) {
    next(err);
  }
};

exports.getAllDrives = async (req, res, next) => {
  try {
    const drives = await adminService.getAllDrives();
    res.json(drives);
  } catch (err) {
    next(err);
  }
};

exports.getDriveRegistrants = async (req, res, next) => {
  try {
    const registrants = await adminService.getDriveRegistrants(req.params.driveId);
    res.json(registrants);
  } catch (err) {
    next(err);
  }
};
