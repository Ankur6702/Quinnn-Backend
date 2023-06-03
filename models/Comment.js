const mongoose = require('mongoose');
const { Schema } = mongoose;

const CommentSchema = new Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    userID: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    postID: {
        type: Schema.Types.ObjectId,
        ref: 'post'
    },
    likes: {
        type: Array,
        default: []
    },
    dislikes: {
        type: Array,
        default: []
    },
    creationDate: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('comment', CommentSchema);