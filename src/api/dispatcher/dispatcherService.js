const Dispatcher = require('./dispatcher');

Dispatcher.methods(['get', 'post', 'put', 'delete']);
Dispatcher.updateOptions({ new: true, runValidators: true });

module.exports = Dispatcher;