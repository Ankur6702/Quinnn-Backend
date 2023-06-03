const mongoose = require('mongoose');
const { Schema } = mongoose;

const EventSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
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
        trim: true
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