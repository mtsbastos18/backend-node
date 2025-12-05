module.exports = function (server) {
    const express = require('express');
    const router = express.Router();
    server.use('/api', router);

    // Dispatcher (com router do Express)
    const dispatcherRoutes = require('../api/controllers/dispatcherController');
    router.use('/dispatchers', dispatcherRoutes); // ✅ AQUI

    // Process (continua com restful)
    const processRoutes = require('../api/controllers/processController');
    router.use('/processes', processRoutes); // ✅ AQUI

    const authController = require('../api/controllers/authController');
    router.use('/auth', authController)

    const processStatusController = require('../api/controllers/processStatusController');
    router.use('/process-status', processStatusController);

    const dashboardController = require('../api/controllers/dashboardController');
    router.use('/dashboard', dashboardController); // ✅ AQUI

    // Lista todas as rotas registradas no console
    const listEndpoints = require('express-list-endpoints');
    console.log('Rotas registradas:');
    console.log(listEndpoints(server));
};
