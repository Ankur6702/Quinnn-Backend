// Npm Packages
const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');

// Models
const User = require('../models/User');
const Post = require('../models/Post');

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
            posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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

module.exports = router;