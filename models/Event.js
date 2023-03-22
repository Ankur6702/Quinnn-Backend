const mongoose = require('mongoose');
const { Schema } = mongoose;

const EventSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 200
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    isOnline: {
        type: Boolean,
        required: true,
    },
    location: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100
    },
    dateTime: {
        type: Date,
        required: true,
    },
    imageURL: {
        type: String,
        required: false,
    },
    attendees: {
        type: Array,
        default: []
    },
    creationDate: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('event', EventSchema);