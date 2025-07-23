const mongoose = require('mongoose');

const processSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: mongoose.Schema.Types.ObjectId, ref: 'ProcessStatus', required: true },
    priority: { type: String, required: true, enum: ['low', 'medium', 'high'] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    term: { type: String, required: true },
    dispatcher: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispatcher', required: true },
    files: [{ type: String }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
});


module.exports = mongoose.model('Process', processSchema);