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
const { validateUsername, validateURL } = require('../utils/validators');

dotenv.config();

// ===========================================Controllers=====================================================

// Router to fetch user profile
// @ts-ignore
router.get('/', fetchUser, async (req, res) => {
    logger.info('Fetching user profile');
    try {
        // @ts-ignore
        const userId = req.userId;
        const user = await User.findById(userId).select('-password');
        if (!user) {
            logger.error('User not found');
            return res.status(404).send('User not found');
        }
        logger.info('User profile fetched successfully');
        res.status(200).json({ status: 'success', message: 'User profile fetched successfully', data: user });
    }
    catch (error) {
        logger.error('Internal Server Error: ', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Router to update user profile (name, username, bio, profileImageURL, coverImageURL, isPrivate)
// @ts-ignore
router.put('/update', fetchUser, async (req, res) => {
    logger.info('Updating user profile');

    try {
        // @ts-ignore
        const userId = req.userId;
        const { name, username, bio, profileImageURL, coverImageURL, isPrivate } = req.body;

        // Check if the username already exists and is not the current user's username and is valid
        if (username) {
            const user = await User.findOne({ username });
            if (user && user._id.toString() !== userId) {
                logger.error('Username already exists');
                return res.status(400).json({ status: 'error', message: 'Username already exists' });
            }

            // Check if the username is valid
            if (!validateUsername(username)) {
                logger.error('Invalid username');
                return res.status(400).json({ status: 'error', message: 'Invalid username' });
            }
        }

        // Check if the profileImageURL & coverImageURL are valid
        if (profileImageURL && !validateURL(profileImageURL)) {
            logger.error('Invalid profile image URL');
            return res.status(400).json({ status: 'error', message: 'Invalid profile image URL' });
        }
        if (coverImageURL && !validateURL(coverImageURL)) {
            logger.error('Invalid cover image URL');
            return res.status(400).json({ status: 'error', message: 'Invalid cover image URL' });
        }

        // Create a new user object
        const newUser = {};
        if (name) newUser.name = name;
        if (username) newUser.username = username;
        if (bio) newUser.bio = bio;
        if (profileImageURL) newUser.profileImageURL = profileImageURL;
        if (coverImageURL) newUser.coverImageURL = coverImageURL;
        if (isPrivate) newUser.isPrivate = isPrivate;

        // Find the user to be updated and update it
        const user = await User.findByIdAndUpdate(userId, { $set: newUser }, { new: true });
        if (!user) {
            logger.error('User not found');
            return res.status(404).send('User not found');
        }
        logger.info('User profile updated successfully');
        res.status(200).json({ status: 'success', message: 'User profile updated successfully', data: user });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Router to search for a user based on username
router.get('/search/:username', async (req, res) => {
    logger.info('Searching for a user');
    try {
        const username = req.params.username;
        const user = await User.findOne({ username });
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

module.exports = router;