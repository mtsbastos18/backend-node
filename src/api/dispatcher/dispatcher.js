const restful = require('node-restful');
const mongoose = restful.mongoose;

const addressSchema = new mongoose.Schema({
    street: { type: String, required: true },
    number: { type: Number, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true }
});

const phoneSchema = new mongoose.Schema({
    type: { type: String, required: true, enum: ['home', 'work', 'mobile'] },
    number: { type: String, required: true }
});

const dispatcherSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: [addressSchema],
    phoneSchema: [phoneSchema],
    email: { type: String, required: true, unique: true },
});

module.exports = restful.model('Dispatcher', dispatcherSchema);