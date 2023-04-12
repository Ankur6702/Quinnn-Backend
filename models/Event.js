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
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    isOnline: {
        type: Boolean,
        required: true,
    },
    location: {
        type: String,
        required: false,
        trim: true,
        minlength: 3,
        maxlength: 200
    },
    meetingURL: {
        type: String,
        required: false,
    },
    startDate: {
        type: String,
        required: true,
    },
    startTime: {
        type: String,
        required: true,
    },
    endDate: {
        type: String,
        required: true,
    },
    endTime: {
        type: String,
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