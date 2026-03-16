const companyService = require("./company.service");

/* =========================
   COMPANY PROFILE
========================= */

async function getProfile(req, res) {
  try {
    const data = await companyService.getCompanyProfile(req.user.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function updateProfile(req, res) {
  try {
    const data = await companyService.updateCompanyProfile(req.user.id, req.body);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/* =========================
   PLACEMENT DRIVES
========================= */

async function requestDrive(req, res) {
  try {
    const data = await companyService.requestPlacementDrive(req.user.id, req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getFormOptions(req, res) {
  try {
    const data = await companyService.getFormOptions();
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getMyDrives(req, res) {
  try {
    const data = await companyService.getMyDrives(req.user.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function deleteDrive(req, res) {
  try {
    const { driveId } = req.params;
    const data = await companyService.deleteDrive(req.user.id, driveId);
    res.status(200).json({ message: "Drive deleted successfully", data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/* =========================
   PLACEMENT OFFERS
========================= */

async function createOffer(req, res) {
  try {
    const data = await companyService.createOffer(req.user.id, req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getMyOffers(req, res) {
  try {
    const data = await companyService.getMyOffers(req.user.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function deleteOffer(req, res) {
  try {
    const { offerId } = req.params;
    const data = await companyService.deleteOffer(req.user.id, offerId);
    res.status(200).json({ message: "Offer deleted successfully", data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/* =========================
   APPLICANTS
========================= */

async function getDriveApplicants(req, res) {
  try {
    const { driveId } = req.params;
    const data = await companyService.getDriveApplicants(req.user.id, driveId);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function updateApplicantStatus(req, res) {
  try {
    const { registrationId } = req.params;
    const { status } = req.body;
    const data = await companyService.updateApplicantStatus(req.user.id, registrationId, status);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function getOfferApplicants(req, res) {
  try {
    const { offerId } = req.params;
    const data = await companyService.getOfferApplicants(req.user.id, offerId);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function hireApplicant(req, res) {
  try {
    const { applicationId } = req.body;
    const data = await companyService.hireApplicant(req.user.id, applicationId);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  requestDrive,
  getFormOptions,
  getMyDrives,
  deleteDrive,
  createOffer,
  getMyOffers,
  deleteOffer,
  getDriveApplicants,
  updateApplicantStatus,
  getOfferApplicants,
  hireApplicant
};
