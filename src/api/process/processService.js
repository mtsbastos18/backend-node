const Process = require('./process');

// Registra métodos padrão
Process.methods(['get', 'post', 'put', 'delete']);
Process.updateOptions({ new: true, runValidators: true });

// Rota personalizada: adicionar comentário
Process.route('addComment', {
    detail: true, // usa :id na rota
    method: 'put',
    handler: async (req, res) => {
        const { id } = req.params;
        const { user, text } = req.body;

        if (!user || !text) {
            return res.status(400).json({ errors: ['User and text are required'] });
        }

        try {
            const updated = await Process.findByIdAndUpdate(
                id,
                {
                    $push: {
                        comments: {
                            user,
                            text,
                            createdAt: new Date()
                        }
                    },
                    $set: { updatedAt: new Date() }
                },
                { new: true, runValidators: true }
            );

            if (!updated) {
                return res.status(404).json({ errors: ['Process not found'] });
            }

            res.json(updated);
        } catch (err) {
            console.error(err);
            res.status(500).json({ errors: [err.message] });
        }
    }
});

// Rota personalizada: alterar status e salvar no histórico
Process.route('updateStatus', {
    detail: true,
    method: 'put',
    handler: async (req, res) => {
        const { id } = req.params;
        const { status, user } = req.body;

        if (!status || !user) {
            return res.status(400).json({ errors: ['Status and user are required'] });
        }

        const validStatuses = ['open', 'in progress', 'closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ errors: ['Invalid status value'] });
        }

        try {
            const updated = await Process.findByIdAndUpdate(
                id,
                {
                    $set: { status, updatedAt: new Date() },
                    $push: {
                        history: {
                            status,
                            updatedAt: new Date(),
                            user
                        }
                    }
                },
                { new: true, runValidators: true }
            );

            if (!updated) {
                return res.status(404).json({ errors: ['Process not found'] });
            }

            res.json(updated);
        } catch (err) {
            console.error(err);
            res.status(500).json({ errors: [err.message] });
        }
    }
});


// Popula o campo dispatcher em requisições GET
Process.before('get', function (req, res, next) {
    console.log('Populating dispatcher for GET request');
    req.query.populate = 'dispatcher';
    next();
});

module.exports = Process;
