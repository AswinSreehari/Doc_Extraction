// backend/routes/documents.js
const express = require('express');
const router = express.Router();
const documentsController = require('../controllers/documentsController');
const upload = require('../services/uploadService');

// GET /documents
router.get('/', documentsController.listDocuments);

// GET /documents/:id
router.get('/:id', documentsController.getDocumentById);

// POST /documents/upload
router.post('/upload', upload.array('files', 50), documentsController.uploadDocuments);

router.post(
  '/upload-and-convert',
  upload.single('file'),
  documentsController.uploadAndConvert
);

// GET /documents/:id/pdf
router.get('/:id/pdf', documentsController.downloadDocumentPdf);

router.delete('/:id', documentsController.deleteDocument);

// GET /documents/:id/json
router.get('/:id/json', documentsController.downloadDocumentJson);



module.exports = router;
