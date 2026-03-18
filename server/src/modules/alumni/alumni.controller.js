const alumniService = require("./alumni.service");

/* =========================
   PLACEMENT DISCUSSIONS
   ========================= */

async function getAllDiscussions(req, res) {
  try {
    const discussions = await alumniService.getAllDiscussions();
    res.json(discussions);
  } catch (err) {
    console.error("Error fetching discussions:", err);
    res.status(500).json({ error: "Failed to fetch discussions" });
  }
}

async function createDiscussion(req, res) {
  try {
    const userId = req.user.id;
    const discussion = await alumniService.createDiscussion(userId, req.body);
    res.status(201).json(discussion);
  } catch (err) {
    console.error("Error creating discussion:", err);
    res.status(500).json({ error: "Failed to create discussion" });
  }
}

async function getDiscussionDetails(req, res) {
  try {
    const { id } = req.params;
    const discussion = await alumniService.getDiscussionById(id);
    if (!discussion) {
      return res.status(404).json({ error: "Discussion not found" });
    }
    const replies = await alumniService.getRepliesByDiscussionId(id);
    res.json({ ...discussion, replies });
  } catch (err) {
    console.error("Error fetching discussion details:", err);
    res.status(500).json({ error: "Failed to fetch discussion details" });
  }
}

async function deleteDiscussion(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const deleted = await alumniService.deleteDiscussion(id, userId);
    if (!deleted) {
      return res.status(403).json({ error: "Unauthorized or not found" });
    }
    res.json({ message: "Discussion deleted successfully" });
  } catch (err) {
    console.error("Error deleting discussion:", err);
    res.status(500).json({ error: "Failed to delete discussion" });
  }
}

/* =========================
   DISCUSSION REPLIES
   ========================= */

async function createReply(req, res) {
  try {
    const { id } = req.params; // discussion_id
    const userId = req.user.id;
    const { content } = req.body;
    const reply = await alumniService.createReply(userId, id, content);
    res.status(201).json(reply);
  } catch (err) {
    console.error("Error creating reply:", err);
    res.status(500).json({ error: "Failed to create reply" });
  }
}

async function getProfile(req, res) {
  try {
    const profile = await alumniService.getAlumniProfile(req.user.id);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
}

async function updateProfile(req, res) {
  try {
    const profile = await alumniService.updateAlumniProfile(req.user.id, req.body);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
}

async function getAlumniDirectory(req, res) {
  try {
    const directory = await alumniService.getAlumniDirectory();
    res.json(directory);
  } catch (err) {
    console.error("Error fetching alumni directory:", err);
    res.status(500).json({ error: "Failed to fetch alumni directory" });
  }
}

module.exports = {
  getAllDiscussions,
  createDiscussion,
  getDiscussionDetails,
  deleteDiscussion,
  createReply,
  getProfile,
  updateProfile,
  getAlumniDirectory
};
