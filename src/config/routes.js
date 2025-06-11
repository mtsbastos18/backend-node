const express = require('express');

module.exports = function (server) {
    // API Routes
    const router = express.Router();
    server.use('/api', router);
    // Billing Cycle Routes
    const billingCycleService = require('../api/billingCycle/billingCycleService');
    billingCycleService.register(router, '/billingCycles');

    // Dispatcher Routes
    const dispatcherService = require('../api/dispatcher/dispatcherService');
    dispatcherService.register(router, '/dispatchers');

    // Process Routes
    const processService = require('../api/process/processService');
    processService.register(router, '/process');



    console.log('Routes registered', router.stack.map(r => r.route.path));
}