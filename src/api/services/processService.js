const createError = require('http-errors');
const Process = require('../models/process');
const Dispatcher = require('../models/dispatcher');
const path = require('path'); // <--- ADICIONAR
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
// ADICIONE a importação do Google Cloud Storage
const { Storage } = require('@google-cloud/storage');
// Instancie o cliente do GCS.
// Como você está no Cloud Run, a autenticação é automática!
const storage = new Storage();

// Pegue o nome do bucket da variável de ambiente
const bucketName = process.env.GCS_BUCKET_NAME;

module.exports = {
    async getAll(req, res, next) {
        try {
            let { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, title, sort = 'title', order = 'asc' } = req.query;

            page = parseInt(page);
            limit = parseInt(limit);

            // Validação simples para os parâmetros de ordenação
            const allowedSortFields = ['title', 'createdAt', 'updatedAt', 'priority', 'term', 'status', 'dispatcher.name'];
            if (!allowedSortFields.includes(sort)) {
                sort = 'title';
            }
            const sortOrder = String(order).toLowerCase() === 'desc' ? -1 : 1;

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

            let results;
            let total;

            // Caso especial: ordenar por campo do dispatcher populado
            if (sort === 'dispatcher.name') {
                // Para ordenar por campo do documento referenciado é necessário usar aggregation + $lookup
                const matchStage = {};
                if (title) {
                    matchStage.title = { $regex: title, $options: 'i' };
                }

                const pipeline = [
                    { $match: matchStage },
                    {
                        $lookup: {
                            from: 'dispatchers',
                            localField: 'dispatcher',
                            foreignField: '_id',
                            as: 'dispatcher'
                        }
                    },
                    { $unwind: { path: '$dispatcher', preserveNullAndEmptyArrays: true } },
                    {
                        $lookup: {
                            from: 'processstatuses',
                            localField: 'status',
                            foreignField: '_id',
                            as: 'status'
                        }
                    },
                    { $unwind: { path: '$status', preserveNullAndEmptyArrays: true } },
                    {
                        $facet: {
                            data: [
                                { $sort: { 'dispatcher.name': sortOrder } },
                                { $skip: skip },
                                { $limit: limit }
                            ],
                            total: [{ $count: 'count' }]
                        }
                    }
                ];

                const aggResult = await Process.aggregate(pipeline).collation({ locale: 'pt', strength: 2 }).exec();
                const facet = aggResult[0] || { data: [], total: [] };
                results = facet.data;
                total = facet.total[0] ? facet.total[0].count : 0;
            } else {
                [results, total] = await Promise.all([
                    Process.find(filter)
                        .populate('dispatcher')
                        .populate('status', 'name description') // Adicionando o populate para o status
                        .collation({ locale: 'pt', strength: 2 }) // ordenação case-insensitive (PT)
                        .sort({ [sort]: sortOrder })
                        .skip(skip)
                        .limit(limit),
                    Process.countDocuments(filter)
                ]);
            }

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
                    select: 'name situacao'
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
            const { dispatcher } = req.body;
            if (dispatcher) {
                const dipatcher = await Dispatcher.findByIdAndUpdate(
                    dispatcher._id,
                    dispatcher,
                );
            }
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

            // Pega a referência do nosso bucket
            if (!bucketName) {
                throw new Error('GCS_BUCKET_NAME não está configurado nas variáveis de ambiente.');
            }
            const bucket = storage.bucket(bucketName);

            const filesMeta = []; // Array para guardar os metadados

            for (const file of req.files) {
                // 1. Cria um nome de arquivo seguro e único (sua lógica está ótima)
                const ext = path.extname(file.originalname);
                const baseName = path.basename(file.originalname, ext)
                    .replace(/[^a-z0-9_.-]/gi, '_'); // sanitiza
                const uniqueFilename = `${baseName}-${Date.now()}${ext}`;

                // 2. Define o 'pathname' (caminho) no bucket
                const blobPathname = `uploads/processes/${processId}/${uniqueFilename}`;

                // 3. Pega a referência do arquivo no GCS
                const blob = bucket.file(blobPathname);

                // 4. Cria um stream de escrita e o envolve em uma Promise
                // Isso é necessário para usar await com streams
                await new Promise((resolve, reject) => {
                    const blobStream = blob.createWriteStream({
                        resumable: false, // Bom para uploads pequenos de buffer
                        contentType: file.mimetype,
                    });

                    blobStream.on('error', (err) => reject(err));

                    // 'finish' é chamado quando o upload está completo
                    blobStream.on('finish', () => resolve());

                    // Envia o buffer do multer para o GCS
                    blobStream.end(file.buffer);
                });

                // 5. Monta a URL pública (requer que o bucket seja público)
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

                // 6. Salva os metadados
                filesMeta.push({
                    filename: blob.name, // Salva o path completo (ex: uploads/...)
                    originalname: file.originalname,
                    url: publicUrl, // A URL pública para acesso
                    size: file.size,
                    mimetype: file.mimetype,
                    uploadedAt: new Date()
                });
            }

            // O resto da sua lógica de salvar no MongoDB está perfeita
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
            console.error('Erro no upload para GCS:', error);
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

            // 1. Encontra o processo e o documento
            const process = await Process.findById(processId);
            if (!process) {
                return res.status(404).json({ message: 'Processo não encontrado' });
            }

            const document = process.files.find(file => file._id.toString() === documentId);
            if (!document) {
                return res.status(404).json({ message: 'Documento não encontrado' });
            }

            // Usamos o 'filename' (path do arquivo) que salvamos, não a URL
            if (!document.filename) {
                return res.status(400).json({ message: 'Path do arquivo não encontrado, não é possível deletar do GCS.' });
            }

            // 2. Deleta o arquivo do Google Cloud Storage
            const bucket = storage.bucket(bucketName);
            const blob = bucket.file(document.filename); // ex: 'uploads/processes/...'

            await blob.delete();

            // 3. Remove a referência do arquivo do MongoDB (sua lógica está ótima)
            const updatedProcess = await Process.findByIdAndUpdate(
                processId,
                { $pull: { files: { _id: documentId } } },
                { new: true }
            );

            res.status(200).json({
                message: 'Arquivo deletado com sucesso',
                process: updatedProcess
            });

        } catch (error) {
            console.error('Erro ao deletar documento do GCS:', error);
            res.status(400).json({ message: error.message });
        }
    }
}