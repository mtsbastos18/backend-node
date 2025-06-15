module.exports = function (server) {
    const express = require('express');
    const router = express.Router();
    server.use('/api', router);

    // Dispatcher (com router do Express)
    const dispatcherRoutes = require('../api/dispatcher/dispatcherController');
    router.use('/dispatchers', dispatcherRoutes); // ✅ AQUI

    // Process (continua com restful)
    const processRoutes = require('../api/process/processController');
    router.use('/processes', processRoutes); // ✅ AQUI

    const authController = require('../api/auth/authController');
    router.use('/auth', authController)

    console.log('Routes registered', router.stack.map(r => r.route?.path || 'middleware'));
};
