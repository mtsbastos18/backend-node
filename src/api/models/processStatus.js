const mongoose = require('mongoose');

const processStatusSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

processStatusSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const ProcessStatus = mongoose.model('ProcessStatus', processStatusSchema);

module.exports = ProcessStatus;


// instauração, instrução, defesa, relatório e julgamento.