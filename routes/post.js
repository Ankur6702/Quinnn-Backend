// Npm Packages
const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');
const { fetchUser } = require('../middleware/fetchUser');

// Models
const User = require('../models/User');
const Post = require('../models/Post');

// Local functions
const logger = require('../logger');

dotenv.config();

// Create a post
// @ts-ignore
router.post('/create', fetchUser, async (req, res) => {
    logger.info('Creating a post');

    try {
        // @ts-ignore
        const userId = req.userId;
        const { text, imageURL } = req.body;
        
        logger.info('Fetching user');
        let user = await User.findById(userId);
        if (!user) {
            logger.error('User not found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const newPost = new Post({ 
            text, 
            imageURL, 
            userID: userId,
        });
        const post = await newPost.save();

        logger.info('Updating user');
        // @ts-ignore
        user.posts.push({
            postID: post._id,
            text: post.text,
            imageURL: post.imageURL,
            creationDate: post.creationDate,
            likes: post.likes,
            comments: post.comments
        });
        //  @ts-ignore
        await user.save();

        logger.info('Post created successfully');
        res.status(200).json({ status: 'success', message: 'Post created successfully', data: post });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Get all posts of a user
// @ts-ignore
router.get('/all', fetchUser, async (req, res) => {
    logger.info('Fetching all posts of a user');
    try {
        // @ts-ignore
        const userId = req.userId;

        logger.info('Fetching user');
        const user = await User.findById(userId);
        if (!user) {
            logger.error('User not found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        logger.info('Fetching posts');
        // @ts-ignore
        const postObj = user.posts;
        // @ts-ignore
        const posts = await Post.find({ _id: { $in: postObj.map(post => post.postID) } }).sort({ creationDate: -1 });
        if (!posts) {
            logger.error('Posts not found');
            return res.status(404).json({ status: 'error', message: 'Posts not found' });
        }
        
        logger.info('Posts fetched successfully');
        res.status(200).json({ status: 'success', message: 'Posts fetched successfully', data: posts });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Update a post
// @ts-ignore
router.put('/update/:id', fetchUser, [
    body('text', 'Text is required').not().isEmpty()
], async (req, res) => {
    logger.info('Updating a post');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Invalid input');
        return res.status(400).json({ status: 'error', message: errors.array() });
    }

    try {
        // @ts-ignore
        const userId = req.userId;
        const postId = req.params.id;
        const { text } = req.body;

        logger.info('Finding the post to be updated');
        let post = await Post.findById(postId);
        if (!post) {
            logger.error('Post not found');
            return res.status(404).json({ status: 'error', message: 'Post not found' });
        }

        logger.info('Checking if the user is authorized to update the post');
        // @ts-ignore
        if (post.userID.toString() !== userId) {
            logger.error('Unauthorized');
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        // Update the post
        // @ts-ignore
        post.text = text;
        // @ts-ignore
        await post.save();
        logger.info('Post updated successfully');
        res.status(200).json({ status: 'success', message: 'Post updated successfully', data: post });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// Delete a post
// @ts-ignore
router.delete('/delete/:id', fetchUser, async (req, res) => {
    logger.info('Deleting a post');
    try {
        // @ts-ignore
        const userId = req.userId;
        const postId = req.params.id;

        logger.info('Finding the post to be deleted');
        const post = await Post.findById(postId);
        if (!post) {
            logger.error('Post not found');
            return res.status(404).json({ status: 'error', message: 'Post not found' });
        }

        logger.info('Checking if the user is authorized to delete the post');
        // @ts-ignore
        if (post.userID.toString() !== userId) {
            logger.error('Unauthorized');
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        // Delete the post
        // @ts-ignore
        await post.remove();
        logger.info('remove the post from the user\'s posts array');
        // @ts-ignore
        let user = await User.findById(userId);
        // @ts-ignore
        user.posts = user.posts.filter(post => post.postID.toString() !== postId);
        // @ts-ignore
        await user.save();

        logger.info('Post deleted successfully');
        res.status(200).json({ status: 'success', message: 'Post deleted successfully', updatedUser: user });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// Like a post
// @ts-ignore
router.put('/like/:id', fetchUser, async (req, res) => {
    logger.info('Liking a post');
    try {
        // @ts-ignore
        const userId = req.userId;
        const postId = req.params.id;

        logger.info('Finding the post');
        let post = await Post.findById(postId);
        if (!post) {
            logger.error('Post not found');
            return res.status(404).json({ status: 'error', message: 'Post not found' });
        }

        logger.info('Checking if the user has already liked the post')
        // @ts-ignore
        const isLiked = post.likes.includes(userId);
        if (isLiked) {
            logger.error('Already liked the post');
            return res.status(400).json({ status: 'error', message: 'Already liked the post' });
        }

        logger.info('Adding the user to the post.likes array');
        // @ts-ignore
        post.likes.push(userId);
        // @ts-ignore
        await post.save();

        logger.info('Post liked successfully');
        // @ts-ignore
        res.status(200).json({ status: 'success', message: 'Post liked successfully', likes: post.likes.length });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Unlike a post
// @ts-ignore
router.put('/unlike/:id', fetchUser, async (req, res) => {
    logger.info('Unliking a post');
    try {
        // @ts-ignore
        const userId = req.userId;
        const postId = req.params.id;

        // Find the post to be liked
        let post = await Post.findById(postId);
        if (!post) {
            logger.error('Post not found');
            return res.status(404).json({ status: 'error', message: 'Post not found' });
        }

        logger.info('Checking if the user has already liked the post');
        // @ts-ignore
        const isLiked = post.likes.includes(userId);
        if (!isLiked) {
            logger.error('Already not liked the post');
            return res.status(400).json({ status: 'error', message: 'Already not liked the post' });
        }

        logger.info('Removing the user id from the post\'s likes array');
        // @ts-ignore
        post.likes = post.likes.filter((id) => id !== userId);
        // @ts-ignore
        await post.save();

        logger.info('Post unliked successfully');
        // @ts-ignore
        res.status(200).json({ status: 'success', message: 'Post unliked successfully', likes: post.likes.length });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;