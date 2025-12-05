const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET = process.env.AUTH_SECRET || 'minha_chave_super_secreta';

module.exports = {
    async register(req, res) {
        try {
            const { name, email, password } = req.body;

            if (await User.findOne({ email })) {
                return res.status(400).json({ error: 'Email já cadastrado' });
            }

            const hash = await bcrypt.hash(password, 10);
            const user = await User.create({ name, email, password: hash });

            res.status(201).json({ message: 'Usuário registrado com sucesso', userId: user._id });
        } catch (err) {
            res.status(500).json({ error: 'Erro ao registrar usuário', details: err.message });
        }
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email });
            if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });

            const valid = await bcrypt.compare(password, user.password);
            if (!valid) return res.status(401).json({ error: 'Senha inválida' });

            const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, SECRET, {
                expiresIn: '1d'
            });

            res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
        } catch (err) {
            res.status(500).json({ error: 'Erro ao fazer login', details: err.message });
        }
    }
};