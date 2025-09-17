const express = require('express');
const router = express.Router();
const multer = require('multer');

const authMiddleware = require('../../config/authMiddleware');
const processService = require('./processService');
const { route } = require('./processStatusController');

router.get('/', authMiddleware, processService.getAll)
router.get('/:id', authMiddleware, processService.getById)
// POST – criar novo dispatcher
router.post('/', authMiddleware, processService.create);

// PUT – atualizar dispatcher por ID
router.put('/:id', authMiddleware, processService.update);

// DELETE – já implementado anteriormente
router.delete('/:id', authMiddleware, processService.delete);

router.put('/:id/status', authMiddleware, processService.updateStatus)
router.put('/:id/comment', authMiddleware, processService.addComment)
router.put('/:id/files', authMiddleware, processService.updateFiles)
router.delete('/:id/comment/:commentId', authMiddleware, processService.deleteComment)

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB (ajuste conforme necessário)
});

router.post('/:id/documents', authMiddleware, upload.array('documents', 20), processService.uploadDocuments);
router.get('/:id/documents/:documentId', authMiddleware, processService.downloadDocument);
router.delete('/:id/documents/:documentId', authMiddleware, processService.deleteDocument);

module.exports = router;