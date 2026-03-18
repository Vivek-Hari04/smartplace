const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../../middleware/auth.middleware');
const roleMiddleware = require('../../middleware/role.middleware');
const documentsController = require('./documents.controller');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);
router.use(roleMiddleware('student'));

router.post('/documents', upload.single('document'), documentsController.uploadDocument);
router.get('/documents', documentsController.getMyDocuments);
router.get('/documents/:id/view', documentsController.viewDocument);

module.exports = router;