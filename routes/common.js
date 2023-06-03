// Npm Packages
const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const axios = require('axios');

// Models
const User = require('../models/User');
const Post = require('../models/Post');
const Event = require('../models/Event');
const Blog = require('../models/Blog');

// Local functions
const logger = require('../logger');

dotenv.config();

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

// To fetch all blogs
router.get('/blogs', async (req, res) => {
    logger.info('Fetching all blogs');
    try {
        const { page = 1, limit = 10, sort = 'popular' } = req.query;
        // @ts-ignore
        const blogs = await Blog.find();
        if (!blogs) {
            logger.error('Blogs not found');
            return res.status(404).json({ status: 'error', message: 'Blogs not found' });
        }

        if (sort === 'popular') {
            blogs.sort((a, b) => b.upvotes.length - a.upvotes.length);
        } else {
            // @ts-ignore
            blogs.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate));
        }
        // @ts-ignore
        const startIndex = (page - 1) * limit;
        // @ts-ignore
        const endIndex = page * limit;
        const results = blogs.slice(startIndex, endIndex);
        logger.info('Blogs found');
        res.status(200).json({ status: 'success', message: 'Blogs found', data: results });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// To get a particular post
router.get('/fetchPost/:postId', async (req, res) => {
    logger.info('Getting a particular post');
    try {
        const { page = 1, limit = 10 } = req.query;
        const postId = req.params.postId;
        // @ts-ignore
        logger.info('Fetching a post');
        const post = await Post.find({ _id: postId });
        if (!post) {
            logger.error('Post not found');
            return res.status(404).json({ status: 'error', message: 'Post not found' });
        }
        logger.info('Post found');
        res.status(200).json({ status: 'success', message: 'Post found', data: post });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Get all followers of a user
router.get('/fetchFollowers/:userId', async (req, res) => {
    logger.info('Getting all the followers of a user');
    try {
        const userId = req.params.userId;
        // @ts-ignore
        const user = await User.findById(userId);
        if (!user) {
            logger.error('User not found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        logger.info('User found');
        logger.info('Fetching followers of user');
        let followers = user.followers;
        if (!followers) {
            logger.error('Followers not found');
            return res.status(404).json({ status: 'error', message: 'Followers not found' });
        }
        // It contains only the userIds of the followers. Now we need to fetch the details of the followers
        followers = await Promise.all(
            // @ts-ignore
            followers.map(async (follower) => {
                // @ts-ignore
                const followerDetails = await User.findById(follower);
                return followerDetails;
            })
        );
        logger.info('Followers found');
        res.status(200).json({ status: 'success', message: 'Followers found', data: followers });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// Get all the users that a user is following
router.get('/fetchFollowing/:userId', async (req, res) => {
    logger.info('Getting all the users that a user is following');
    try {
        const userId = req.params.userId;
        // @ts-ignore
        const user = await User.findById(userId);
        if (!user) {
            logger.error('User not found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        logger.info('User found');
        logger.info('Fetching users that a user is following');
        let following = user.following;
        if (!following) {
            logger.error('Following not found');
            return res.status(404).json({ status: 'error', message: 'Following not found' });
        }
        // It contains only the userIds of the users that the user is following. Now we need to fetch the details of the users
        following = await Promise.all(
            // @ts-ignore
            following.map(async (follow) => {
                // @ts-ignore
                const followDetails = await User.findById(follow);
                return followDetails;
            })
        );
        logger.info('Following found');
        res.status(200).json({ status: 'success', message: 'Following found', data: following });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// Search a user using userId
router.get('/fetchUser/:userId', async (req, res) => {
    logger.info('Searching a user');
    try {
        const userId = req.params.userId;
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
        const { page = 1, limit = 10, sort = 'popular' } = req.query;
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

// To check the toxicity of text using Perspective API
router.post('/checkToxicity', async (req, res) => {
    logger.info('Checking toxicity of text');
    try {
        const text = req.body.text;
        // @ts-ignore
        const { data } = await axios.post(
            `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${process.env.PERSPECTIVE_API_KEY}`,
            {
                comment: { text },
                languages: ['en'],
                requestedAttributes: { TOXICITY: {} },
            }
        );
        logger.info('Toxicity checked');
        res.status(200).json({ status: 'success', message: 'Toxicity checked', data: data });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});


module.exports = router;