const express = require('express');
const router = express.Router();

const authMiddleware = require('../../config/authMiddleware');
const processService = require('./processService');

router.get('/', authMiddleware, processService.getAll)
router.get('/:id', authMiddleware, processService.getById)
// POST – criar novo dispatcher
router.post('/', authMiddleware, processService.create);

// PUT – atualizar dispatcher por ID
router.put('/:id', authMiddleware, processService.update);

// DELETE – já implementado anteriormente
router.delete('/:id', authMiddleware, processService.delete);

module.exports = router;