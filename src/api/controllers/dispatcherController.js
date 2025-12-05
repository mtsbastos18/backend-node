const express = require('express');
const dispatcherService = require('../services/dispatcherService');
const router = express.Router();
const authMiddleware = require('../../config/authMiddleware');
const MAX_LIMIT = 100;

// GET by ID
router.get('/:id', authMiddleware, dispatcherService.getById);

// POST – criar novo dispatcher
router.post('/', authMiddleware, dispatcherService.create);

// PUT – atualizar dispatcher por ID
router.put('/:id', authMiddleware, dispatcherService.update);

// DELETE – já implementado anteriormente
router.delete('/:id', authMiddleware, dispatcherService.delete);

// GET all with pagination and filter by name
router.get('/', authMiddleware, getAll);
async function getAll(req, res, next) {
    try {
        let { page = 1, limit = 10, name } = req.query;

        page = Number(page);
        limit = Number(limit);

        checkPageAndLimit(page, limit);

        const skip = (page - 1) * limit;

        const filter = {};
        if (name) {
            filter.name = { $regex: name, $options: 'i' };
        }

        const dispatcherList = await dispatcherService.getAll(filter, skip, page, limit);
        res.json(dispatcherList);
    } catch (error) {
        next(error); // Passa o erro para o middleware de tratamento
    }
}

function checkPageAndLimit(page, limit) {
    if (isNaN(page) || page < 1) {
        throw createError(400, 'O parâmetro "page" deve ser um número inteiro positivo');
    }

    if (isNaN(limit) || limit < 1 || limit > MAX_LIMIT) {
        throw createError(400, `O parâmetro "limit" deve ser um número entre 1 e ${MAX_LIMIT}`);
    }
}
module.exports = router;
