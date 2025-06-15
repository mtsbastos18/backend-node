const express = require('express');
const dispatcherService = require('./dispatcherService');
const router = express.Router();
const authMiddleware = require('../../config/authMiddleware');

// GET all with pagination and filter by name
router.get('/', authMiddleware, dispatcherService.getAll);

// GET by ID
router.get('/:id', authMiddleware, dispatcherService.getById);

// POST – criar novo dispatcher
router.post('/', authMiddleware, dispatcherService.create);

// PUT – atualizar dispatcher por ID
router.put('/:id', authMiddleware, dispatcherService.update);

// DELETE – já implementado anteriormente
router.delete('/:id', authMiddleware, dispatcherService.delete);

module.exports = router;
