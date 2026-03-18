const express = require("express");
const router = express.Router();
const alumniController = require("./alumni.controller");

// Discussion Forum Routes
router.get("/discussions", alumniController.getAllDiscussions);
router.post("/discussions", alumniController.createDiscussion);
router.get("/discussions/:id", alumniController.getDiscussionDetails);
router.delete("/discussions/:id", alumniController.deleteDiscussion);

// Reply Routes
router.post("/discussions/:id/replies", alumniController.createReply);

// Profile Routes
router.get("/profile", alumniController.getProfile);
router.put("/profile", alumniController.updateProfile);
router.get("/directory", alumniController.getAlumniDirectory);

module.exports = router;
