// routes/router.js

const express = require("express");
const router = express.Router();

const facultyRoutes = require("../modules/faculty/faculty.routes");
const advisorRoutes = require("../modules/faculty/advisor.routes");
const studentRoutes = require("../modules/student/student.routes");
const adminRoutes = require("../modules/admin/admin.routes");
const companyRoutes = require("../modules/company/company.routes");

router.use("/faculty", facultyRoutes);
router.use("/advisor", advisorRoutes);
router.use("/student",studentRoutes);
router.use("/admin", adminRoutes);
router.use("/company", companyRoutes);

module.exports = router;