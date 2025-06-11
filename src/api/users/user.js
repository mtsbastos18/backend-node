const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
    tipo: { type: String, enum: ['admin', 'advogado', 'cliente'], default: 'cliente' }
});

// Criptografa a senha antes de salvar
UserSchema.pre('save', function (next) {
    const user = this;

    if (!user.isModified('senha')) return next();

    bcrypt.genSalt(10, (err, salt) => {
        if (err) return next(err);

        bcrypt.hash(user.senha, salt, (err, hash) => {
            if (err) return next(err);

            user.senha = hash;
            next();
        });
    });
});

// Método auxiliar para validar senha
UserSchema.methods.validarSenha = function (senhaDigitada) {
    return bcrypt.compareSync(senhaDigitada, this.senha);
};

module.exports = mongoose.model('User', UserSchema);
