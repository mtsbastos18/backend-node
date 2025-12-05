const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    street: { type: String, required: true },
    number: { type: Number, required: true },
    complement: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    type: { type: String, enum: ['residential', 'commercial'] }
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
    orgao_expedidor: { type: String },
    uf: { type: String },
    titulo_eleitoral: { type: String },
    titulo_eleitoral_zona: { type: String },
    titulo_eleitoral_secao: { type: String },
    nome_pai: { type: String },
    nome_mae: { type: String },
    naturalidade: { type: String },
    naturalidade_uf: { type: String },
    matricula: { type: String, required: true, unique: true },
    birthDate: { type: Date, required: true },
    estado_civil: { type: String, enum: ['solteiro', 'casado', 'divorciado', 'viuvo'] },
    nome_conjuge: { type: String },
    nome_escritorio: { type: String, },
    razao_social: { type: String, },
    cnpj: { type: String, },
    alinea: { type: String, },
    data_registro: { type: Date },
    nacionalidade: { type: String },
    obeservacoes: { type: String },
    sexo: { type: String, enum: ['masculino', 'feminino', 'outro'] },
    situacao: { type: String, enum: ['ativo', 'inativo', 'suspenso'], default: 'ativo' }
});


module.exports = mongoose.model('Dispatcher', dispatcherSchema);