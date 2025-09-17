const createError = require('http-errors');
const Process = require('./process');
const Dispatcher = require('../dispatcher/dispatcher');
const { put, del } = require('@vercel/blob'); // <--- ADICIONAR
const path = require('path'); // <--- ADICIONAR
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
                await Process.find(filter)
                    .populate('dispatcher')
                    .populate('status', 'name description') // Adicionando o populate para o status
                    .skip(skip)
                    .limit(limit),
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
                    path: 'status',
                    model: 'ProcessStatus',
                    select: 'name description'
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

    async uploadDocuments(req, res) {
        try {
            const processId = req.params.id;
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ message: 'Nenhum arquivo enviado' });
            }

            const filesMeta = []; // Array para guardar os metadados do blob

            for (const file of req.files) {
                // 1. Cria um nome de arquivo seguro e único
                const ext = path.extname(file.originalname);
                const baseName = path.basename(file.originalname, ext)
                    .replace(/[^a-z0-9]/gi, '_'); // sanitiza

                const uniqueFilename = `${baseName}-${Date.now()}${ext}`;

                // 2. Define o 'pathname' (caminho) no blob
                const blobPathname = `uploads/processes/${processId}/${uniqueFilename}`;

                // 3. Faz o upload para o Vercel Blob
                const blob = await put(
                    blobPathname,
                    file.buffer, // <--- O buffer do 'memoryStorage'
                    {
                        access: 'public'  // Garante que o arquivo seja publicamente acessível
                    }
                );

                // 4. Salva os metadados do blob
                filesMeta.push({
                    filename: blob.pathname, // O 'pathname' no blob (ex: uploads/...)
                    originalname: file.originalname,
                    url: blob.url, // A URL pública para acesso
                    size: file.size,
                    mimetype: file.mimetype,
                    uploadedAt: new Date()
                });
            }

            const updated = await Process.findByIdAndUpdate(
                processId,
                { $push: { files: { $each: filesMeta } } },
                { new: true, runValidators: true }
            );
            if (!updated) {
                throw new Error('Processo não encontrado');
            }
            res.status(200).json(updated);

        } catch (error) {
            res.status(400).json({ message: error.message });
        }

    },

    async downloadDocument(req, res) {
        try {
            const process = await Process.findById(req.params.id);
            if (!process) {
                return res.status(404).json({ message: 'Processo não encontrado' });
            }
            const document = process.files.find(file => file._id.toString() === req.params.documentId);
            if (!document.url) {
                return res.status(400).json({ message: 'URL do documento não encontrada.' });
            }
            res.redirect(document.url);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    async deleteDocument(req, res) {
        try {
            const { id: processId, documentId } = req.params;

            // 1. Encontra o processo e o documento para pegar a URL
            const process = await Process.findById(processId);
            if (!process) {
                return res.status(404).json({ message: 'Processo não encontrado' });
            }

            const document = process.files.find(file => file._id.toString() === documentId);
            if (!document) {
                return res.status(404).json({ message: 'Documento não encontrado' });
            }

            if (!document.url) {
                return res.status(400).json({ message: 'URL do documento não encontrada, não é possível deletar do Blob.' });
            }

            // 2. Deleta o arquivo do Vercel Blob
            await del(document.url);

            // 3. Remove a referência do arquivo do MongoDB
            const updatedProcess = await Process.findByIdAndUpdate(
                processId,
                { $pull: { files: { _id: documentId } } }, // Remove o item do array 'files'
                { new: true }
            );

            res.status(200).json({
                message: 'Arquivo deletado com sucesso',
                process: updatedProcess
            });

        } catch (error) {
            console.error('Erro ao deletar documento:', error);
            res.status(400).json({ message: error.message });
        }
    }
}