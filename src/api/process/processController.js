const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const processId = req.params.id || 'unknown';
        const dest = path.join(__dirname, '..', 'uploads', 'processes', processId);
        fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${unique}${ext}`);
    }
});

const upload = multer({ storage });

router.post('/:id/documents', authMiddleware, upload.array('documents', 20), processService.uploadDocuments);
router.get('/:id/documents/:documentId', authMiddleware, processService.downloadDocument);
module.exports = router;