const express = require('express');
const authService = require('../services/authService');
const router = express.Router();

router.post('/register', authService.register);
router.post('/login', authService.login);

module.exports = router;