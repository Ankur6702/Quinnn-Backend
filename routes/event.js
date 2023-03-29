// Npm Packages
const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');
const { fetchUser } = require('../middleware/fetchUser');

// Models
const Event = require('../models/Event');
const User = require('../models/User');

// Local functions
const logger = require('../logger');

dotenv.config();

// ===========================================Controllers=====================================================

// To create a new event
// @ts-ignore
router.post('/create', fetchUser, [
    body('title', 'Title must be atleast 3 characters').isLength({ min: 3 }),
    body('description', 'Description must be atleast 5 characters').isLength({ min: 5 }),
    body('location', 'Location must be atleast 3 characters').isLength({ min: 3 }).optional(),
    body('meetingURL', 'Meeting URL must be a valid URL').isURL().optional(),
    body('dateTime', 'Date and time must be in the future').isAfter(),
    body('isOnline', 'isOnline must be a boolean').isBoolean(),
    body('imageURL', 'imageURL must be a valid URL').isURL().optional()
], async (req, res) => {
    logger.info('Creating a new event');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Invalid input');
        return res.status(400).json({ status: 'error', message: errors.array() });
    }

    try {
        // Create a new event
        const { title, description, location, meetingURL, dateTime, isOnline, imageURL } = req.body;
        const event = new Event({
            title,
            description,
            location,
            meetingURL,
            dateTime,
            isOnline,
            imageURL,
            // @ts-ignore
            creator: { name: req.name, username: req.username, id: req.userId }
        });
        const savedEvent = await event.save();
        logger.info('Event created successfully');
        res.json({ status: 'success', message: 'Event created successfully', event: savedEvent });
    } catch (error) {
        logger.error('Internal server error');
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// To fetch a single event
router.get('/fetch/:id', async (req, res) => {
    logger.info('Fetching a single event');
    try {
        const id = req.params.id;
        const event = await Event.findById(id);
        if (!event) {
            logger.error('Event not found');
            return res.status(404).json({ status: 'error', message: 'Event not found' });
        }
        logger.info('Event fetched successfully');
        res.json({ status: 'success', message: 'Event fetched successfully', event });
    } catch (error) {
        logger.error('Internal server error');
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// To update an event
// @ts-ignore
router.put('/update/:id', fetchUser, async (req, res) => {
    logger.info('Updating an event');
    try {
        // @ts-ignore
        const userId = req.userId;
        const eventId = req.params.id;
        const { title, description, location, meetingURL, dateTime, isOnline, imageURL } = req.body;

        // Create a new event object
        const newEvent = {};
        if (title) newEvent.title = title;
        if (description) newEvent.description = description;
        if (location || location === '') newEvent.location = location;
        if (meetingURL || meetingURL === '') newEvent.meetingURL = meetingURL;
        if (dateTime) newEvent.dateTime = dateTime;
        if (isOnline !== null) newEvent.isOnline = isOnline;
        if (imageURL || imageURL === '') newEvent.imageURL = imageURL;

        // Find the event to be updated and update it, remember thaat creator is an object
        const event = await Event.findOneAndUpdate({
            _id: eventId,
            'creator.id': userId
        }, { $set: newEvent }, { new: true });
        if (!event) {
            logger.error('Event not found');
            return res.status(404).json({ status: 'error', message: 'Event not found' });
        }

        if (event.creator.id.toString() !== userId) {
            logger.error('Not allowed');
            return res.status(401).json({ status: 'error', message: 'Not allowed' });
        }

        logger.info('Event updated successfully');
        res.json({ status: 'success', message: 'Event updated successfully', data: event });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// To delete an event
// @ts-ignore
router.delete('/delete/:id', fetchUser, async (req, res) => {
    logger.info('Deleting an event');
    try {
        // @ts-ignore
        const userId = req.userId;
        const eventId = req.params.id;

        // Find the event to be deleted and delete it
        const event = await Event.findByIdAndDelete({ _id: eventId, creator: userId });
        if (!event) {
            logger.error('Event not found');
            return res.status(404).json({ status: 'error', message: 'Event not found' });
        }

        if (event.creator.toString() !== userId) {
            logger.error('Not allowed');
            return res.status(401).json({ status: 'error', message: 'Not allowed' });
        }

        logger.info('Event deleted successfully');
        res.json({ status: 'success', message: 'Event deleted successfully' });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// To fetch all events which are live
router.get('/fetchLive', async (req, res) => {
    logger.info('Fetching all live events');
    try {
        const events = await Event.find({ dateTime: { $gte: new Date() } });
        logger.info('Live events fetched successfully');
        res.json({ status: 'success', message: 'Live events fetched successfully', events });
    } catch (error) {
        logger.error('Internal server error');
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// To attend an event
// @ts-ignore
router.put('/register/:id', fetchUser, async (req, res) => {
    logger.info('Registering in an event');
    try {
        // @ts-ignore
        const userId = req.userId;
        const eventId = req.params.id;

        // Find the event to be attended and attend it
        const event = await Event.findById(eventId);
        if (!event) {
            logger.error('Event not found');
            return res.status(404).json({ status: 'error', message: 'Event not found' });
        }
        if (event.attendees.find(attendee => attendee.userId.toString() === userId.toString())) {
            logger.error('Already registered the event');
            return res.status(400).json({ status: 'error', message: 'Already registered the event' });
        }
        event.attendees.push({
            // @ts-ignore
            userId: userId,
            // @ts-ignore
            name: req.name,
            // @ts-ignore
            username: req.username
        });

        await event.save();
        logger.info('Event registration successful');
        res.json({ status: 'success', message: 'Event registration successful!' });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;