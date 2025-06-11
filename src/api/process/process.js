const mongoose = require('mongoose');
const restful = require('node-restful');

const processSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, required: true, enum: ['open', 'in progress', 'closed'] },
    priority: { type: String, required: true, enum: ['low', 'medium', 'high'] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    term: { type: String, required: true },
    dispatcher: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispatcher', required: true },
    files: [{ type: String }],
    comments: [{
        // user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        user: { type: String, required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    history: [{
        status: { type: String, required: true, enum: ['open', 'in progress', 'closed'] },
        updatedAt: { type: Date, default: Date.now },
        // user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
        user: { type: String, required: true }
    }]
});


module.exports = restful.model('Process', processSchema);