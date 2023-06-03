// Npm Packages
const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const { fetchUser } = require('../middleware/fetchUser');

// Models
const Event = require('../models/Event');

// Local functions
const logger = require('../logger');

dotenv.config();

// To create a new event
// @ts-ignore
router.post('/create', fetchUser, async (req, res) => {
    logger.info('Creating a new event');
    try {
        // @ts-ignore
        const userId = req.userId;
        const { title, description, location, meetingURL, isOnline, imageURL, startDate, startTime, endDate, endTime } = req.body;

        logger.info('Creating a new event')
        const newEvent = new Event({
            title, description, location, meetingURL, isOnline,
            imageURL, startDate, startTime, endDate, endTime,
            creator: userId
        });

        logger.info('Saving the event');
        const event = await newEvent.save();
        logger.info('Event saved successfully');
        res.status(201).json({ status: 'success', message: 'Event saved successfully', event });

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
        const { title, description, location, meetingURL, imageURL, startDate, startTime, endDate, endTime } = req.body;

        logger.info('Finding the event to be updated');
        let event = await Event.findById(eventId);
        if (!event) {
            logger.error('Event not found');
            return res.status(404).json({ status: 'error', message: 'Event not found' });
        }

        logger.info('Checking if the user is authorized to update the event');
        if (event.creator.toString() !== userId) {
            logger.error('Not allowed');
            return res.status(401).json({ status: 'error', message: 'Not allowed' });
        }

        logger.info('Check if the date and time are valid');
        if (new Date(startDate + ' ' + startTime) > new Date(endDate + ' ' + endTime)) {
            logger.error('Invalid date and time');
            return res.status(400).json({ status: 'error', message: 'Invalid date and time' });
        }

        logger.info('Updating the event');
        if (title) event.title = title;
        if (description) event.description = description;
        if (location) event.location = location;
        if (meetingURL) event.meetingURL = meetingURL;
        if (imageURL || imageURL === '') event.imageURL = imageURL;
        if (startDate) event.startDate = startDate;
        if (startTime) event.startTime = startTime;
        if (endDate) event.endDate = endDate;
        if (endTime) event.endTime = endTime;

        logger.info('Saving the event');
        const updatedEvent = await event.save();
        logger.info('Event updated successfully');
        res.json({ status: 'success', message: 'Event updated successfully', updatedEvent });
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

        logger.info('Finding the event to be deleted');
        const event = await Event.findByIdAndDelete({ _id: eventId, creator: userId });
        if (!event) {
            logger.error('Event not found');
            return res.status(404).json({ status: 'error', message: 'Event not found' });
        }

        logger.info('Checking if the user is authorized to delete the event');
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


// To attend an event
// @ts-ignore
router.put('/register/:id', fetchUser, async (req, res) => {
    logger.info('Registering in an event');
    try {
        // @ts-ignore
        const userId = req.userId;
        const eventId = req.params.id;

        logger.info('Finding the event to be registered');
        let event = await Event.findById(eventId);
        if (!event) {
            logger.error('Event not found');
            return res.status(404).json({ status: 'error', message: 'Event not found' });
        }

        logger.info('Checking if the user is already registered in the event');
        if (event.attendees.find(id => id.toString() === userId.toString())) {
            logger.error('Already registered the event');
            return res.status(400).json({ status: 'error', message: 'Already registered the event' });
        }

        logger.info('Registering the user in the event');
        event.attendees.push(userId);

        await event.save();
        logger.info('Event registration successful');
        res.json({ status: 'success', message: 'Event registration successful!' });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Fetch all upcoming events
router.get('/upcoming', async (req, res) => {
    logger.info('Fetching all upcoming events');
    try {
        const currentDate = new Date();
        const formattedCurrentDate = currentDate.toISOString().split('T')[0];
        const currentTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        const events = await Event.find({
            $or: [
                { startDate: { $gt: formattedCurrentDate } },
                {
                    $and: [
                        { startDate: formattedCurrentDate },
                        { startTime: { $gt: currentTime } }
                    ]
                }
            ]
        }).sort({ startDate: 1 }); // Sort events based on startDate in ascending order

        logger.info('Upcoming events fetched successfully');
        res.json({ status: 'success', message: 'Upcoming events fetched successfully', events });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Fetch all past events
router.get('/past', async (req, res) => {
    logger.info('Fetching all past events');
    try {
        const currentDate = new Date();
        const formattedCurrentDate = currentDate.toISOString().split('T')[0];
        const currentTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        const events = await Event.find({
            $or: [
                { endDate: { $lt: formattedCurrentDate } },
                {
                    $and: [
                        { endDate: formattedCurrentDate },
                        { endTime: { $lt: currentTime } }
                    ]
                }
            ]
        });

        logger.info('Past events fetched successfully');
        res.json({ status: 'success', message: 'Past events fetched successfully', events });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Fetch all ongoing events based on startDate startTime and endDate endTime
router.get('/ongoing', async (req, res) => {
    logger.info('Fetching all ongoing events');
    try {
        const currentDate = new Date();
        const formattedCurrentDate = currentDate.toISOString().split('T')[0];
        const currentTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        const events = await Event.find({
            $or: [
                {
                    $and: [
                        { startDate: { $lte: formattedCurrentDate } },
                        { endDate: { $gte: formattedCurrentDate } },
                    ]
                },
                {
                    $and: [
                        { startDate: formattedCurrentDate },
                        { startTime: { $lte: currentTime } },
                        { endDate: { $gte: formattedCurrentDate } },
                        { endTime: { $gte: currentTime } }
                    ]
                }
            ]
        });

        logger.info('Ongoing events fetched successfully');
        res.json({ status: 'success', message: 'Ongoing events fetched successfully', events });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// Fetch all events created by a user
// @ts-ignore
router.get('/myevents', fetchUser, async (req, res) => {
    logger.info('Fetching all events created by a user');
    try {
        // @ts-ignore
        const userId = req.userId;
        const events = await Event.find({ creator: userId });
        logger.info('Events fetched successfully');
        res.json({ status: 'success', message: 'Events fetched successfully', events });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;