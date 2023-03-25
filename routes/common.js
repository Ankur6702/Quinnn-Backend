// Npm Packages
const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');
const { fetchUser } = require('../middleware/fetchUser');

// Models
const User = require('../models/User');

// Local functions
const logger = require('../logger');

dotenv.config();

// ===========================================Controllers=====================================================

// Router to search for a user based on username
router.get('/search/:username', async (req, res) => {
    logger.info('Searching for a user');
    try {
        const username = req.params.username;
        const user = await User.find({ username: { $regex: username, $options: 'i' } });
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

// To get all the followers of a user
router.get('/followers/:username', async (req, res) => {
    logger.info('Getting all the followers of a user');
    try {
        const username = req.params.username;

        const user = await User.find({ following: username });
        if (!user) {
            logger.error('User not found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // @ts-ignore
        const followers = user.followers;

        logger.info('Followers found');
        res.status(200).json({ status: 'success', message: 'Followers found', data: followers, count: followers.length });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// To get all the users a user is following
router.get('/following/:username', async (req, res) => {
    logger.info('Getting all the users a user is following');
    try {
        const username = req.params.username;

        const user = await User.find({ username: username });
        if (!user) {
            logger.error('User not found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        
        // @ts-ignore
        const following = user.following;

        logger.info('Users found');
        res.status(200).json({ status: 'success', message: 'Users found', data: following, count: following.length });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;