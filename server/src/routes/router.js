// routes/router.js

const express = require("express");
const router = express.Router();

const facultyRoutes = require("../modules/faculty/faculty.routes");
const advisorRoutes = require("../modules/faculty/advisor.routes");
const studentRoutes = require("../modules/student/student.routes");
const adminRoutes = require("../modules/admin/admin.routes");

router.use("/faculty", facultyRoutes);
router.use("/advisor", advisorRoutes);
router.use("/student",studentRoutes);
router.use("/admin", adminRoutes);

module.exports = router;