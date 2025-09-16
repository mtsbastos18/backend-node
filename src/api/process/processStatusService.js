const ProcessStatus = require('./processStatus');

exports.getAll = async (req, res) => {
    try {
        const statusList = await ProcessStatus.find({ isActive: true });
        res.json(statusList);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const status = await ProcessStatus.findById(req.params.id);
        if (!status) {
            return res.status(404).json({ message: 'Status não encontrado' });
        }
        res.json(status);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const status = new ProcessStatus(req.body);
        const savedStatus = await status.save();
        res.status(201).json(savedStatus);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const status = await ProcessStatus.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!status) {
            return res.status(404).json({ message: 'Status não encontrado' });
        }
        res.json(status);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deactivate = async (req, res) => {
    try {
        const status = await ProcessStatus.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        if (!status) {
            return res.status(404).json({ message: 'Status não encontrado' });
        }
        res.json(status);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};