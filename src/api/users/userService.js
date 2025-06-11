const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');

const SECRET = 'cf3b1b47e6729f71fa9a4c51a87e5d2e9c8a1d6b04f7c3da2e9a718b5f23c6de';

async function login(email, senha) {
    const user = await User.findOne({ email });

    if (!user || !user.validarSenha(senha)) {
        throw new Error('Email ou senha inválidos');
    }

    const token = jwt.sign(
        {
            id: user._id,
            email: user.email,
            tipo: user.tipo
        },
        SECRET,
        { expiresIn: '1d' }
    );

    return {
        token,
        user: {
            nome: user.nome,
            email: user.email,
            tipo: user.tipo
        }
    };
}

module.exports = {
    login
};
