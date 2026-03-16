const express = require("express");
const router = express.Router();
const companyController = require("./company.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");

// Profile
router.get("/profile", authMiddleware, roleMiddleware("company"), companyController.getProfile);
router.put("/profile", authMiddleware, roleMiddleware("company"), companyController.updateProfile);

// Drives
router.get("/drives/form-options", authMiddleware, roleMiddleware("company"), companyController.getFormOptions);
router.post("/drives/request", authMiddleware, roleMiddleware("company"), companyController.requestDrive);
router.get("/drives/my", authMiddleware, roleMiddleware("company"), companyController.getMyDrives);
router.delete("/drives/:driveId", authMiddleware, roleMiddleware("company"), companyController.deleteDrive);

// Offers
router.post("/offers", authMiddleware, roleMiddleware("company"), companyController.createOffer);
router.get("/offers/my", authMiddleware, roleMiddleware("company"), companyController.getMyOffers);
router.delete("/offers/:offerId", authMiddleware, roleMiddleware("company"), companyController.deleteOffer);
router.get("/offers/:offerId/applicants", authMiddleware, roleMiddleware("company"), companyController.getOfferApplicants);
router.post("/offers/hire", authMiddleware, roleMiddleware("company"), companyController.hireApplicant);

// Applicants
router.get("/drives/:driveId/applicants", authMiddleware, roleMiddleware("company"), companyController.getDriveApplicants);
router.put("/applicants/:registrationId/status", authMiddleware, roleMiddleware("company"), companyController.updateApplicantStatus);

module.exports = router;
