const mongoose = require('mongoose');
const { Schema } = mongoose;

const EventSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 500
    },
    creator: {
        type: Object,
        required: true,
    },
    isOnline: {
        type: Boolean,
        required: true,
    },
    meetingURL: {
        type: String,
        required: false,
    },
    location: {
        type: String,
        required: false,
        trim: true,
        minlength: 3,
        maxlength: 200
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