const mongoose = require('mongoose');
const { Schema } = mongoose;

const CommentSchema = new Schema({
    text: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100
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