const Dispatcher = require('../models/dispatcher');
const Process = require('../models/process');

class DashboardService {
    async getDashboardData() {
        // Conta o número de dispatchers cadastrados
        const dispatcherCount = await Dispatcher.countDocuments();
        // Conta o número de processos cadastrados
        const processCount = await Process.countDocuments();

        return {
            data: {
                dispatcherCount,
                processCount
            }
        };
    }
}

module.exports = new DashboardService();