const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.set('strictQuery', true);
module.exports = mongoose.connect('mongodb://localhost/mymoney')