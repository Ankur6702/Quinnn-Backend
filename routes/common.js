// Npm Packages
const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');

// Models
const User = require('../models/User');
const Post = require('../models/Post');
const Event = require('../models/Event');

// Local functions
const logger = require('../logger');

dotenv.config();

// ===========================================Controllers=====================================================

// To get all the posts of all the users
router.get('/posts', async (req, res) => {
    logger.info('Getting all the posts of all the users');
    try {
        const { page = 1, limit = 10, sort = 'popular' } = req.query;
        // @ts-ignore
        const posts = await Post.find();
        if (!posts) {
            logger.error('Posts not found');
            return res.status(404).json({ status: 'error', message: 'Posts not found' });
        }

        if (sort === 'popular') {
            posts.sort((a, b) => b.likes.length - a.likes.length);
        } else {
            // @ts-ignore
            posts.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate));
        }
        // @ts-ignore
        const startIndex = (page - 1) * limit;
        // @ts-ignore
        const endIndex = page * limit;
        const results = posts.slice(startIndex, endIndex);
        logger.info('Posts found');
        res.status(200).json({ status: 'success', message: 'Posts found', data: results });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// To get all the posts of a user
router.get('/fetchPosts/:userId', async (req, res) => {
    logger.info('Getting all the posts of a user');
    try {
        const userId = req.params.userId;
        // @ts-ignore
        logger.info('Fetching posts of user');
        const posts = await Post.find({ userID: userId });
        if (!posts) {
            logger.error('Posts not found');
            return res.status(404).json({ status: 'error', message: 'Posts not found' });
        }
        logger.info('Posts found');
        res.status(200).json({ status: 'success', message: 'Posts found', data: posts });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Search a user using userId
router.get('/fetchUser/:userId', async (req, res) => {
    logger.info('Searching a user');
    try {
        const userId = req.params;
        // @ts-ignore
        const user = await User.findById(userId);
        if (!user) {
            logger.error('User not found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        logger.info('User found');
        res.status(200).json({ status: 'success', message: 'User found', data: user });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// To get all the users
router.get('/users', async (req, res) => {
    logger.info('Getting all the users');
    try {
        const { page = 1, limit = 10 } = req.query;
        // @ts-ignore
        const users = await User.find();
        if (!users) {
            logger.error('Users not found');
            return res.status(404).json({ status: 'error', message: 'Users not found' });
        }

        // @ts-ignore
        const startIndex = (page - 1) * limit;
        // @ts-ignore
        const endIndex = page * limit;
        const results = users.slice(startIndex, endIndex);
        logger.info('Users found');
        res.status(200).json({ status: 'success', message: 'Users found', data: results });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Fetch all events
router.get('/events', async (req, res) => {
    logger.info('Fetching all events');
    try {
        const { page = 1, limit = 10 , sort = 'popular'} = req.query;
        // @ts-ignore
        const events = await Event.find();
        if (!events) {
            logger.error('Events not found');
            return res.status(404).json({ status: 'error', message: 'Events not found' });
        }

        if (sort === 'popular') {
            events.sort((a, b) => b.attendees.length - a.attendees.length);
        } else {
            // @ts-ignore
            events.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
        }
        // @ts-ignore
        const startIndex = (page - 1) * limit;
        // @ts-ignore
        const endIndex = page * limit;
        const results = events.slice(startIndex, endIndex);
        logger.info('Events found');
        res.status(200).json({ status: 'success', message: 'Events found', data: results });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;