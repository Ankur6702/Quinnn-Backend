const mongoose = require('mongoose');
const { Schema } = mongoose;

const PostSchema = new Schema({
    text: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100
    },
    userID: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    image: {
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