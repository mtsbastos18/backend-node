const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const Dispatcher = require('./dispatcher');

module.exports = {
    async getAll(req, res, next) {
        try {
            let { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, name } = req.query;

            page = parseInt(page);
            limit = parseInt(limit);

            if (isNaN(page) || page < 1) {
                throw createError(400, 'O parâmetro "page" deve ser um número inteiro positivo');
            }

            if (isNaN(limit) || limit < 1 || limit > MAX_LIMIT) {
                throw createError(400, `O parâmetro "limit" deve ser um número entre 1 e ${MAX_LIMIT}`);
            }

            const skip = (page - 1) * limit;

            const filter = {};
            if (name) {
                filter.name = { $regex: name, $options: 'i' }; // busca insensível a maiúsculas/minúsculas
            }

            const [results, total] = await Promise.all([
                Dispatcher.find(filter).skip(skip).limit(limit),
                Dispatcher.countDocuments(filter)
            ]);

            const totalPages = Math.ceil(total / limit);

            if (page > totalPages && totalPages > 0) {
                throw createError(400, `A página ${page} não existe. Total de páginas: ${totalPages}`);
            }

            res.json({
                data: results,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            });
        } catch (err) {
            next(err);
        }
    },

    async getById(req, res, next) {
        try {
            const dispatcher = await Dispatcher.findById(req.params.id);
            if (!dispatcher) {
                throw createError(404, 'Despachante não encontrado');
            }
            res.json(dispatcher);
        } catch (err) {
            next(err);
        }
    },

    async create(req, res, next) {
        try {
            const dispatcher = new Dispatcher(req.body);
            await dispatcher.save();
            res.status(201).json(dispatcher);
        } catch (err) {
            next(err);
        }
    },

    async update(req, res, next) {
        try {
            const dispatcher = await Dispatcher.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            if (!dispatcher) {
                throw createError(404, 'Despachante não encontrado');
            }
            res.json(dispatcher);
        } catch (err) {
            next(err);
        }
    },

    async delete(req, res, next) {
        try {
            await Dispatcher.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: 'Despachante excluído com sucesso' });
        } catch (err) {
            next(err);
        }
    }
}