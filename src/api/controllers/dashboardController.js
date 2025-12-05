const express = require('express');
const dashboardService = require('../services/dashboardService');
const router = express.Router();
const authMiddleware = require('../../config/authMiddleware');

// Rota para obter os dados do dashboard
router.get('/', authMiddleware, async (req, res) => {
    try {
        const data = await dashboardService.getDashboardData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dados do dashboard.' });
    }
});

module.exports = router;

