// Npm Packages
const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');
const { fetchUser } = require('../middleware/fetchUser');

// Models
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// Local functions
const logger = require('../logger');

dotenv.config();

// Comment on a post
// @ts-ignore
router.post('/create/:postid', fetchUser, [
    body('text', 'Text is required').not().isEmpty()
], async (req, res) => {
    logger.info('Commenting on a post');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Invalid input');
        return res.status(400).json({ status: 'error', message: errors.array() });
    }

    try {
        // @ts-ignore
        const userId = req.userId;
        const postId = req.params.postid;
        const { text } = req.body;

        logger.info('Fetching post');
        let post = await Post.findById(postId);
        if (!post) {
            logger.error('Post not found');
            return res.status(404).json({ status: 'error', message: 'Post not found' });
        }

        logger.info('Creating comment');
        const comment = new Comment({ text: text, userID: userId, postID: postId });
        // @ts-ignore
        await comment.save();

        logger.info('Adding comment to the post');
        // @ts-ignore
        post.comments.push(comment._id);
        // @ts-ignore
        await post.save();

        logger.info('Commented on the post successfully');
        res.status(200).json({ status: 'success', message: 'Commented on the post successfully', commentId: comment._id });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Fetch all comments of a post
// @ts-ignore
router.get('/fetch/:postid', async (req, res) => {
    logger.info('Fetching all comments of a post');
    try {
        // @ts-ignore
        const userId = req.userId;
        const postId = req.params.postid;

        logger.info('Fetching post');
        const post = await Post.findById(postId);
        if (!post) {
            logger.error('Post not found');
            return res.status(404).json({ status: 'error', message: 'Post not found' });
        }

        logger.info('Fetching comments');
        // @ts-ignore
        const comments = await Comment.find({ postID: postId });
        if (!comments) {
            logger.error('No comments found');
            return res.status(404).json({ status: 'error', message: 'No comments found' });
        }

        logger.info('Comments fetched successfully');
        res.status(200).json({ status: 'success', message: 'Comments fetched successfully', comments });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Delete a comment
// @ts-ignore
router.delete('/delete/:id', fetchUser, async (req, res) => {
    logger.info('Deleting a comment');
    try {
        // @ts-ignore
        const userId = req.userId;
        const commentId = req.params.id;

        logger.info('Fetching comment');
        const comment = await Comment.findById(commentId);
        if (!comment) {
            logger.error('Comment not found');
            return res.status(404).json({ status: 'error', message: 'Comment not found' });
        }

        logger.info('Checking if the user is authorized to delete the comment');
        // @ts-ignore
        if (comment.userID.toString() !== userId) {
            logger.error('Not authorized to delete the comment');
            return res.status(401).json({ status: 'error', message: 'Not authorized to delete the comment' });
        }

        logger.info('Fetching post');
        // @ts-ignore
        let post = await Post.findById(comment.postID);
        if (!post) {
            logger.error('Post not found');
            return res.status(404).json({ status: 'error', message: 'Post not found' });
        }

        logger.info('Deleting comment from the post');
        // @ts-ignore
        post.comments = post.comments.filter((id) => id !== commentId);
        // @ts-ignore
        await post.save();

        logger.info('Deleting comment');
        // @ts-ignore
        comment.remove();

        logger.info('Comment deleted successfully');
        res.status(200).json({ status: 'success', message: 'Comment deleted successfully' });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Like a comment
// @ts-ignore
router.put('/like/:id', fetchUser, async (req, res) => {
    logger.info('Liking a comment');
    try {
        // @ts-ignore
        const userId = req.userId;
        const commentId = req.params.id;

        logger.info('Fetching comment');
        let comment = await Comment.findById(commentId);
        if (!comment) {
            logger.error('Comment not found');
            return res.status(404).json({ status: 'error', message: 'Comment not found' });
        }

        logger.info('Checking if the user has already liked the comment');
        // @ts-ignore
        const isLiked = comment.likes.includes(userId);
        if (isLiked) {
            logger.error('Already liked the comment');
            return res.status(400).json({ status: 'error', message: 'Already liked the comment' });
        }

        logger.info('Liking the comment');
        // @ts-ignore
        comment.likes.push(userId);
        // @ts-ignore
        await comment.save();

        logger.info('Comment liked successfully');
        // @ts-ignore
        res.status(200).json({ status: 'success', message: 'Comment liked successfully', likes: comment.likes.length });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Unlike a comment
// @ts-ignore
router.put('/unlike/:id', fetchUser, async (req, res) => {
    logger.info('Unliking a comment');
    try {
        // @ts-ignore
        const userId = req.userId;
        const commentId = req.params.id;

        logger.info('Fetching comment');
        let comment = await Comment.findById(commentId);
        if (!comment) {
            logger.error('Comment not found');
            return res.status(404).json({ status: 'error', message: 'Comment not found' });
        }

        logger.info('Checking if the user has already liked the comment');
        // @ts-ignore
        const isLiked = comment.likes.includes(userId);
        if (!isLiked) {
            logger.error('Comment not liked yet');
            return res.status(400).json({ status: 'error', message: 'Comment not liked yet' });
        }

        logger.info('Unliking the comment');
        // @ts-ignore
        comment.likes = comment.likes.filter((id) => id !== userId);
        // @ts-ignore
        await comment.save();

        logger.info('Comment unliked successfully');
        // @ts-ignore
        res.status(200).json({ status: 'success', message: 'Comment unliked successfully', likes: comment.likes.length });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Dislike a comment
// @ts-ignore
router.put('/dislike/:id', fetchUser, async (req, res) => {
    logger.info('Disliking a comment');
    try {
        // @ts-ignore
        const userId = req.userId;
        const commentId = req.params.id;

        logger.info('Fetching comment');
        let comment = await Comment.findById(commentId);
        if (!comment) {
            logger.error('Comment not found');
            return res.status(404).json({ status: 'error', message: 'Comment not found' });
        }

        logger.info('Checking if the user has already disliked the comment');
        // @ts-ignore
        const isDisliked = comment.dislikes.includes(userId);
        if (isDisliked) {
            logger.error('Already disliked the comment');
            return res.status(400).json({ status: 'error', message: 'Already disliked the comment' });
        }

        logger.info('Disliking the comment');
        // @ts-ignore
        const isLiked = comment.likes.includes(userId);
        if (isLiked) {
            logger.info('Removing the user from the likes list of the comment');
            // @ts-ignore
            comment.likes = comment.likes.filter((id) => id !== userId);
        }

        logger.info('Disliking the comment');
        // @ts-ignore
        comment.dislikes.push(userId);
        // @ts-ignore
        await comment.save();

        logger.info('Comment disliked successfully');
        // @ts-ignore
        res.status(200).json({ status: 'success', message: 'Comment disliked successfully', dislikes: comment.dislikes.length });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Undislike a comment
// @ts-ignore
router.put('/undislike/:id', fetchUser, async (req, res) => {
    logger.info('Undisliking a comment');
    try {
        // @ts-ignore
        const userId = req.userId;
        const commentId = req.params.id;

        logger.info('Fetching comment');
        let comment = await Comment.findById(commentId);
        if (!comment) {
            logger.error('Comment not found');
            return res.status(404).json({ status: 'error', message: 'Comment not found' });
        }

        logger.info('Checking if the user has already disliked the comment');
        // @ts-ignore
        const isDisliked = comment.dislikes.includes(userId);
        if (!isDisliked) {
            logger.error('Comment not disliked yet');
            return res.status(400).json({ status: 'error', message: 'Comment not disliked yet' });
        }

        logger.info('Undisliking the comment');
        // @ts-ignore
        comment.dislikes = comment.dislikes.filter((id) => id !== userId);
        // @ts-ignore
        await comment.save();

        logger.info('Comment undisliked successfully');
        // @ts-ignore
        res.status(200).json({ status: 'success', message: 'Comment undisliked successfully', dislikes: comment.dislikes.length });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;