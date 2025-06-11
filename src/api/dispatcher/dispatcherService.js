const Dispatcher = require('./dispatcher');

Dispatcher.methods(['get', 'post', 'put', 'delete']);
Dispatcher.updateOptions({ new: true, runValidators: true });
// Middleware para customizar a resposta do delete
Dispatcher.after('delete', function (req, res, next) {
    res.status(200).json({ message: 'Despachante excluido com sucesso' });
});
module.exports = Dispatcher;