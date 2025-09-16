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

    const processStatusController = require('../api/process/processStatusController');
    router.use('/process-status', processStatusController);

    // Lista todas as rotas registradas no console
    const listEndpoints = require('express-list-endpoints');
    console.log('Rotas registradas:');
    console.log(listEndpoints(server));
};
