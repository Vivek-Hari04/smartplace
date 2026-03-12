const express = require("express");
const router = express.Router();
const companyController = require("./company.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");

// Profile
router.get("/profile", authMiddleware, roleMiddleware("company"), companyController.getProfile);
router.put("/profile", authMiddleware, roleMiddleware("company"), companyController.updateProfile);

// Drives
router.post("/drives/request", authMiddleware, roleMiddleware("company"), companyController.requestDrive);
router.get("/drives/my", authMiddleware, roleMiddleware("company"), companyController.getMyDrives);

// Offers
router.post("/offers", authMiddleware, roleMiddleware("company"), companyController.createOffer);
router.get("/offers/my", authMiddleware, roleMiddleware("company"), companyController.getMyOffers);

// Applicants
router.get("/drives/:driveId/applicants", authMiddleware, roleMiddleware("company"), companyController.getDriveApplicants);
router.put("/applicants/:registrationId/status", authMiddleware, roleMiddleware("company"), companyController.updateApplicantStatus);

module.exports = router;
