const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.set('strictQuery', true);
module.exports = mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/mymoney')

