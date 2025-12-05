const express = require('express');
const router = express.Router();

const authMiddleware = require('../../config/authMiddleware');
const processStatusService = require('../services/processStatusService');

router.get('/', authMiddleware, processStatusService.getAll);
router.get('/:id', authMiddleware, processStatusService.getById);
router.post('/', authMiddleware, processStatusService.create);
router.put('/:id', authMiddleware, processStatusService.update);
router.delete('/:id', authMiddleware, processStatusService.deactivate);

module.exports = router;
