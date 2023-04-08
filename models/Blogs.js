const mongoose = require('mongoose');
const { Schema } = mongoose;

const BlogSchema = new Schema({
    title: {
        type: String,
        trim: true,
        required: true
    },
    content: {
        type: String,
        required: true
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
    upvote: {
        type: Array,
        default: []
    },
    downvote: {
        type: Array,
        default: []
    },
    comments: {
        tlikesype: Array,
        default: []
    },
    creationDate: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('blog', BlogSchema);