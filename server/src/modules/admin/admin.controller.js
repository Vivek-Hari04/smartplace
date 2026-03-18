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

exports.getPendingUsers = async (req, res, next) => {
  try {
    const users = await adminService.getPendingUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.verifyUser = async (req, res, next) => {
  try {
    const user = await adminService.verifyUser(req.params.id);
    res.json({ message: "User verified successfully", user });
  } catch (err) {
    next(err);
  }
};

exports.rejectUser = async (req, res, next) => {
  try {
    const { reason, description } = req.body;
    const user = await adminService.rejectUser(req.params.id, reason, description);
    res.json({ message: "User rejected successfully", user });
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

/* PLACED STUDENTS FEATURE */

exports.getPlacedStudents = async (req, res, next) => {
  try {
    const filters = {
      department: req.query.department,
      company_name: req.query.company_name,
      min_lpa: req.query.min_lpa,
      max_lpa: req.query.max_lpa,
      include_unplaced: req.query.include_unplaced
    };
    
    // Parse include_unplaced
    const includeUnplaced = filters.include_unplaced === 'true';

    const students = await adminService.getPlacedStudents(filters, includeUnplaced);
    res.json(students);
  } catch (err) {
    next(err);
  }
};

exports.exportPlacedStudentsPDF = async (req, res, next) => {
  try {
    const filters = {
      department: req.query.department,
      company_name: req.query.company_name,
      min_lpa: req.query.min_lpa,
      max_lpa: req.query.max_lpa,
      include_unplaced: req.query.include_unplaced
    };
    const includeUnplaced = filters.include_unplaced === 'true';
    
    const students = await adminService.getPlacedStudents(filters, includeUnplaced);
    
    const PDFDocument = require('pdfkit');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="placed_students.pdf"');
    
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    doc.pipe(res);
    
    doc.fontSize(18).text("Placed Students Report", { align: 'center' });
    doc.moveDown(2);
    
    const startX = 30;
    let startY = doc.y;
    const rowHeight = 20;

    // Define column widths
    const cols = {
      name: 100,
      email: 140,
      dept: 60,
      company: 100,
      lpa: 40,
      status: 80
    };
    
    const totalWidth = Object.values(cols).reduce((a, b) => a + b, 0);

    // Header
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text("Name", startX, startY, { width: cols.name });
    doc.text("Email", startX + cols.name, startY, { width: cols.email });
    doc.text("Department", startX + cols.name + cols.email, startY, { width: cols.dept });
    doc.text("Company", startX + cols.name + cols.email + cols.dept, startY, { width: cols.company });
    doc.text("LPA", startX + cols.name + cols.email + cols.dept + cols.company, startY, { width: cols.lpa });
    doc.text("Status", startX + cols.name + cols.email + cols.dept + cols.company + cols.lpa, startY, { width: cols.status });
    
    startY += rowHeight;
    doc.moveTo(startX, startY).lineTo(startX + totalWidth, startY).stroke();
    startY += 5;

    doc.font('Helvetica');
    students.forEach((student, i) => {
      // Check for page break
      if (startY > doc.page.height - 50) {
        doc.addPage();
        startY = 50;
      }
      
      const name = `${student.fname} ${student.lname}`;
      const email = student.email;
      const dept = student.department;
      const company = student.company_name || "-";
      const lpa = student.package_lpa ? Number(student.package_lpa).toFixed(2) : "-";
      const status = student.offer_status === 'accepted' ? 'Placed' : 'Not Placed';

      doc.text(name, startX, startY, { width: cols.name, truncate: true });
      doc.text(email, startX + cols.name, startY, { width: cols.email, truncate: true });
      doc.text(dept, startX + cols.name + cols.email, startY, { width: cols.dept, truncate: true });
      doc.text(company, startX + cols.name + cols.email + cols.dept, startY, { width: cols.company, truncate: true });
      doc.text(lpa, startX + cols.name + cols.email + cols.dept + cols.company, startY, { width: cols.lpa, truncate: true });
      doc.text(status, startX + cols.name + cols.email + cols.dept + cols.company + cols.lpa, startY, { width: cols.status, truncate: true });
      
      startY += rowHeight;
    });

    doc.end();
  } catch (err) {
    next(err);
  }
};

exports.exportPlacedStudentsCSV = async (req, res, next) => {
  try {
    const filters = {
      department: req.query.department,
      company_name: req.query.company_name,
      min_lpa: req.query.min_lpa,
      max_lpa: req.query.max_lpa,
      include_unplaced: req.query.include_unplaced
    };
    const includeUnplaced = filters.include_unplaced === 'true';
    
    const students = await adminService.getPlacedStudents(filters, includeUnplaced);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="placed_students.csv"');
    
    let csvData = "Name,Email,Department,Company,LPA,Status\n";
    
    students.forEach(student => {
      const name = `"${student.fname} ${student.lname}"`;
      const email = `"${student.email}"`;
      const department = `"${student.department}"`;
      const company = student.company_name ? `"${student.company_name}"` : '""';
      const lpa = student.package_lpa !== null ? student.package_lpa : '';
      const status = student.offer_status === 'accepted' ? 'Placed' : 'Not Placed';
      
      csvData += `${name},${email},${department},${company},${lpa},${status}\n`;
    });
    
    res.send(csvData);
  } catch (err) {
    next(err);
  }
};
