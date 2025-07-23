const createError = require('http-errors');
const Process = require('./process');
const Dispatcher = require('../dispatcher/dispatcher');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

module.exports = {
    async getAll(req, res, next) {
        try {
            let { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, title } = req.query;

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
            if (title) {
                filter.title = { $regex: title, $options: 'i' }; // busca insensível a maiúsculas/minúsculas
            }

            const [results, total] = await Promise.all([
                await Process.find(filter).populate('dispatcher').skip(skip).limit(limit),
                Process.countDocuments(filter)
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
            const process = await Process.findById(req.params.id)
                .populate({
                    path: 'dispatcher',
                    model: 'Dispatcher',
                    select: 'name email cpf rg matricula birthDate address phones'
                })
                .populate({
                    path: 'comments.user',
                    model: 'User',
                    select: 'name email cpf rg matricula birthDate address phones'
                });

            if (!process) {
                throw createError(404, 'Processo não encontrado');
            }
            res.json(process);
        } catch (err) {
            next(err);
        }
    },

    async create(req, res, next) {
        try {
            const newProcess = new Process(req.body);
            const savedProcess = await newProcess.save();
            res.status(201).json(savedProcess);
        } catch (err) {
            next(err);
        }
    },

    async update(req, res, next) {
        try {
            const updatedProcess = await Process.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
            if (!updatedProcess) {
                throw createError(404, 'Processo não encontrado');
            }
            res.json(updatedProcess);
        } catch (err) {
            next(err);
        }
    },

    async delete(req, res, next) {
        try {
            const deletedProcess = await Process.findByIdAndUpdate(req.params.id, { status: 'closed' }, { new: true });
            if (!deletedProcess) {
                throw createError(404, 'Processo não encontrado');
            }
            res.json(deletedProcess);
        } catch (err) {
            next(err);
        }
    },

    async updateStatus(req, res, next) {
        try {
            const { status } = req.body;
            if (!status || !['open', 'in progress', 'closed'].includes(status)) {
                throw createError(400, 'Status inválido. Deve ser "open", "in progress" ou "closed".');
            }

            const updatedProcess = await Process.findByIdAndUpdate(
                req.params.id,
                { status, $push: { history: { status, updatedAt: new Date(), user: req.body.user || 'system' } } },
                { new: true, runValidators: true }
            );

            if (!updatedProcess) {
                throw createError(404, 'Processo não encontrado');
            }

            res.json(updatedProcess);
        } catch (err) {
            next(err);
        }
    },

    async addComment(req, res, next) {
        try {
            const { text } = req.body;
            const user = req.user.id; // Get user from authenticated token
            if (!text) {
                throw createError(400, 'Texto do comentário é obrigatório.');
            }

            const updatedProcess = await Process.findByIdAndUpdate(
                req.params.id,
                { $push: { comments: { user, text, createdAt: new Date() } } },
                { new: true, runValidators: true }
            );

            if (!updatedProcess) {
                throw createError(404, 'Processo não encontrado');
            }

            res.json(updatedProcess);
        } catch (err) {
            next(err);
        }
    },

    async updateFiles(req, res, next) {
        try {
            const { files } = req.body;
            if (!files || !Array.isArray(files)) {
                throw createError(400, 'É necessário fornecer um array de arquivos.');
            }

            const updatedProcess = await Process.findByIdAndUpdate(
                req.params.id,
                { $push: { files: { $each: files } } },
                { new: true, runValidators: true }
            );

            if (!updatedProcess) {
                throw createError(404, 'Processo não encontrado');
            }

            res.json(updatedProcess);
        } catch (err) {
            next(err);
        }
    },

    async deleteComment(req, res, next) {
        try {
            const updatedProcess = await Process.findByIdAndUpdate(
                req.params.id,
                { $pull: { comments: { _id: req.params.commentId } } },
                { new: true, runValidators: true }
            );

            if (!updatedProcess) {
                throw createError(404, 'Processo não encontrado');
            }

            res.json(updatedProcess);
        } catch (err) {
            next(err);
        }
    },


}