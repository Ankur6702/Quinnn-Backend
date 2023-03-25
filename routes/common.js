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
        const user = await User.find({ username: username });
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