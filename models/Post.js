const mongoose = require('mongoose');
const { Schema } = mongoose;

const PostSchema = new Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    user: {
        type: Object,
        required: true,
    },
    imageURL: {
        type: String,
        required: false,
    },
    likes: {
        type: Array,
        default: []
    },
    comments: {
        type: Array,
        default: []
    },
    creationDate: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('post', PostSchema);