const mongoose = require('mongoose');
const { Schema } = mongoose;

const PostSchema = new Schema({
    text: {
        type: String,
        trim: true
    },
    userID: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
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