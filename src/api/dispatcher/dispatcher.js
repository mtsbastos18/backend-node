const mongoose = require('mongoose');

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
    name: { type: String, required: [true, 'O campo nome é obrigatório'] },
    address: [addressSchema],
    phones: [phoneSchema],
    email: { type: String, required: true, unique: true },
    cpf: { type: String, required: true, unique: true },
    rg: { type: String, required: true, unique: true },
    matricula: { type: String, required: true, unique: true },
    birthDate: { type: Date, required: true },
});

module.exports = mongoose.model('Dispatcher', dispatcherSchema);