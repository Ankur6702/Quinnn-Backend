// Npm Packages
const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');
const { fetchUser } = require('../middleware/fetchUser');

// Models
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// Local functions
const logger = require('../logger');
const { validateUsername, validateURL } = require('../utils/validators');

dotenv.config();

// ===========================================Controllers=====================================================

// Router to fetch user profile
// @ts-ignore
router.get('/profile', fetchUser, async (req, res) => {
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

// Router to update user profile (name, username, bio, profileImageURL, coverImageURL, isPrivate, dob, country)
// @ts-ignore
router.put('/profile/update', fetchUser, async (req, res) => {
    logger.info('Updating user profile');

    try {
        // @ts-ignore
        const userId = req.userId;
        const { name, username, bio, profileImageURL, coverImageURL, isPrivate, country, dob } = req.body;

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

        // Create a new user object
        const newUser = {};
        if (name) newUser.name = name;
        if (username) newUser.username = username;
        if (bio || bio === '') newUser.bio = bio;
        if (profileImageURL || profileImageURL === '') newUser.profileImageURL = profileImageURL;
        if (coverImageURL || coverImageURL === '') newUser.coverImageURL = coverImageURL;
        if (isPrivate) newUser.isPrivate = isPrivate;
        if (country) newUser.country = country;
        if (dob) newUser.dob = dob;

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


// Create a post
// @ts-ignore
router.post('/create-post', fetchUser, async (req, res) => {
    logger.info('Creating a post');

    try {
        // @ts-ignore
        const userId = req.userId;
        const { text, imageURL } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            logger.error('User not found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const newPost = new Post({ text, imageURL, userID: userId });
        const post = await newPost.save();

        // Update posts array of the user
        // @ts-ignore
        user.posts.push(post._id);
        //  @ts-ignore
        await user.save();

        logger.info('Post created successfully');
        res.status(200).json({ status: 'success', message: 'Post created successfully', data: post });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Get a specific post of a user
// @ts-ignore
router.get('/post/:postId', fetchUser, async (req, res) => {
    logger.info('Fetching a post of a user');
    try {
        // @ts-ignore
        const userId = req.userId;
        const postId = req.params.postId;

        // Find the user
        const user = User.findById(userId);
        if (!user) {
            logger.error('User not found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // Find the post
        const post = await Post.findById(postId);
        if (!post) {
            logger.error('Post not found');
            return res.status(404).json({ status: 'error', message: 'Post not found' });
        }

        // Check if the post belongs to the user
        // @ts-ignore
        if (post.userID.toString() !== userId) {
            logger.error('Post not found');
            return res.status(404).json({ status: 'error', message: 'Post not found' });
        }

        logger.info('Post fetched successfully');
        res.status(200).json({ status: 'success', message: 'Post fetched successfully', data: post });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Get all posts of a user
// @ts-ignore
router.get('/posts', fetchUser, async (req, res) => {
    logger.info('Fetching all posts of a user');
    try {
        // @ts-ignore
        const userId = req.userId;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            logger.error('User not found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // Find all posts of the user
        // @ts-ignore
        const postIds = user.posts;
        const posts = await Post.find({ _id: { $in: postIds } }).sort({ createdAt: -1 });
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
router.put('/update-post/:id', fetchUser, [
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

        // Find the post to be updated
        const post = await Post.findById(postId);
        if (!post) {
            logger.error('Post not found');
            return res.status(404).json({ status: 'error', message: 'Post not found' });
        }

        // Check if the user is authorized to update the post
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
router.delete('/delete-post/:id', fetchUser, async (req, res) => {
    logger.info('Deleting a post');
    try {
        // @ts-ignore
        const userId = req.userId;
        const postId = req.params.id;

        // Find the post to be deleted
        const post = await Post.findById(postId);
        if (!post) {
            logger.error('Post not found');
            return res.status(404).json({ status: 'error', message: 'Post not found' });
        }

        // Check if the user is authorized to delete the post
        // @ts-ignore
        if (post.userID.toString() !== userId) {
            logger.error('Unauthorized');
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        // Delete the post
        // @ts-ignore
        await post.remove();
        logger.info('Post deleted successfully');
        res.status(200).json({ status: 'success', message: 'Post deleted successfully' });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// To follow a user
// @ts-ignore
router.put('/follow/:id', fetchUser, async (req, res) => {
    logger.info('Following a user');
    try {
        // @ts-ignore
        const userId = req.userId;
        const followId = req.params.id;

        // Find the user to be followed
        const userToFollow = await User.findById(followId);
        if (!userToFollow) {
            logger.error('User not found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            logger.error('User not found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // Check if the user is already following the user to be followed
        // @ts-ignore
        const isFollowing = user.following.includes(followId);
        if (isFollowing) {
            logger.error('Already following');
            return res.status(400).json({ status: 'error', message: 'Already following' });
        }

        // Add the user to be followed to the following list of the user
        // @ts-ignore
        user.following.push(followId);
        // @ts-ignore
        await user.save();

        // Add the user to the followers list of the user to be followed
        // @ts-ignore
        userToFollow.followers.push(userId);
        // @ts-ignore
        await userToFollow.save();

        logger.info('User followed successfully');
        res.status(200).json({ status: 'success', message: 'User followed successfully' });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// To unfollow a user
// @ts-ignore
router.put('/unfollow/:id', fetchUser, async (req, res) => {
    logger.info('Unfollowing a user');
    try {
        // @ts-ignore
        const userId = req.userId;
        const unfollowId = req.params.id;

        // Find the user to be unfollowed
        const userToUnfollow = await User.findById(unfollowId);
        if (!userToUnfollow) {
            logger.error('User not found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            logger.error('User not found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // Check if the user is following the user to be unfollowed
        // @ts-ignore
        const isFollowing = user.following.includes(unfollowId);
        if (!isFollowing) {
            logger.error('Already not following the user');
            return res.status(400).json({ status: 'error', message: 'Already not following the user' });
        }

        // Remove the user to be unfollowed from the following list of the user
        // @ts-ignore
        user.following = user.following.filter((id) => id !== unfollowId);
        // @ts-ignore
        await user.save();
        
        // Remove the user from the followers list of the user to be unfollowed
        // @ts-ignore
        userToUnfollow.followers = userToUnfollow.followers.filter((id) => id !== userId);
        // @ts-ignore
        await userToUnfollow.save();

        logger.info('User unfollowed successfully');
        res.status(200).json({ status: 'success', message: 'User unfollowed successfully' });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Like a post
// @ts-ignore
router.put('/like-post/:id', fetchUser, async (req, res) => {
    logger.info('Liking a post');
    try {
        // @ts-ignore
        const userId = req.userId;
        const postId = req.params.id;

        // Find the post to be liked
        const post = await Post.findById(postId);
        if (!post) {
            logger.error('Post not found');
            return res.status(404).json({ status: 'error', message: 'Post not found' });
        }

        // Check if the user has already liked the post
        // @ts-ignore
        const isLiked = post.likes.includes(userId);
        if (isLiked) {
            logger.error('Already liked the post');
            return res.status(400).json({ status: 'error', message: 'Already liked the post' });
        }

        // Add the user to the likes list of the post
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
router.put('/unlike-post/:id', fetchUser, async (req, res) => {
    logger.info('Unliking a post');
    try {
        // @ts-ignore
        const userId = req.userId;
        const postId = req.params.id;

        // Find the post to be liked
        const post = await Post.findById(postId);
        if (!post) {
            logger.error('Post not found');
            return res.status(404).json({ status: 'error', message: 'Post not found' });
        }

        // Check if the user has already liked the post
        // @ts-ignore
        const isLiked = post.likes.includes(userId);
        if (!isLiked) {
            logger.error('Already not liked the post');
            return res.status(400).json({ status: 'error', message: 'Already not liked the post' });
        }

        // Remove the user from the likes list of the post
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

// Comment on a post
// @ts-ignore
router.post('/comment/:postid', fetchUser, [
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

        // Find the post to be commented on
        const post = await Post.findById(postId);
        if (!post) {
            logger.error('Post not found');
            return res.status(404).json({ status: 'error', message: 'Post not found' });
        }

        // Create a new comment
        const comment = new Comment({ text: text, userID: userId, postID: postId });
        // @ts-ignore
        await comment.save();

        // Add the comment to the comments list of the post
        // @ts-ignore
        post.comments.push(comment._id);
        // @ts-ignore
        await post.save();

        logger.info('Commented on the post successfully');
        res.status(200).json({ status: 'success', message: 'Commented on the post successfully' });
    } catch (error) {
        logger.error('Internal Server Error: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Delete a comment
// @ts-ignore
router.delete('/delete-comment/:id', fetchUser, async (req, res) => {
    logger.info('Deleting a comment');
    try {
        // @ts-ignore
        const userId = req.userId;
        const commentId = req.params.id;

        // Find the comment to be deleted
        const comment = await Comment.findById(commentId);
        if (!comment) {
            logger.error('Comment not found');
            return res.status(404).json({ status: 'error', message: 'Comment not found' });
        }

        // Check if the user is the owner of the comment
        // @ts-ignore
        if (comment.userID.toString() !== userId) {
            logger.error('Not authorized to delete the comment');
            return res.status(401).json({ status: 'error', message: 'Not authorized to delete the comment' });
        }

        // Find the post to which the comment belongs
        // @ts-ignore
        const post = await Post.findById(comment.postID);
        if (!post) {
            logger.error('Post not found');
            return res.status(404).json({ status: 'error', message: 'Post not found' });
        }

        // Remove the comment from the comments list of the post
        // @ts-ignore
        post.comments = post.comments.filter((id) => id !== commentId);
        // @ts-ignore
        await post.save();

        // Delete the comment
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
router.put('/like-comment/:id', fetchUser, async (req, res) => {
    logger.info('Liking a comment');
    try {
        // @ts-ignore
        const userId = req.userId;
        const commentId = req.params.id;

        // Find the comment to be liked
        const comment = await Comment.findById(commentId);
        if (!comment) {
            logger.error('Comment not found');
            return res.status(404).json({ status: 'error', message: 'Comment not found' });
        }

        // Check if the user has already liked the comment
        // @ts-ignore
        const isLiked = comment.likes.includes(userId);
        if (isLiked) {
            logger.error('Already liked the comment');
            return res.status(400).json({ status: 'error', message: 'Already liked the comment' });
        }

        // Add the user to the likes list of the comment
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
router.put('/unlike-comment/:id', fetchUser, async (req, res) => {
    logger.info('Unliking a comment');
    try {
        // @ts-ignore
        const userId = req.userId;
        const commentId = req.params.id;

        // Find the comment to be unliked
        const comment = await Comment.findById(commentId);
        if (!comment) {
            logger.error('Comment not found');
            return res.status(404).json({ status: 'error', message: 'Comment not found' });
        }

        // Check if the user has already liked the comment
        // @ts-ignore
        const isLiked = comment.likes.includes(userId);
        if (!isLiked) {
            logger.error('Comment not liked yet');
            return res.status(400).json({ status: 'error', message: 'Comment not liked yet' });
        }

        // Remove the user from the likes list of the comment
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
router.put('/dislike-comment/:id', fetchUser, async (req, res) => {
    logger.info('Disliking a comment');
    try {
        // @ts-ignore
        const userId = req.userId;
        const commentId = req.params.id;

        // Find the comment to be disliked
        const comment = await Comment.findById(commentId);
        if (!comment) {
            logger.error('Comment not found');
            return res.status(404).json({ status: 'error', message: 'Comment not found' });
        }

        // Check if the user has already disliked the comment
        // @ts-ignore
        const isDisliked = comment.dislikes.includes(userId);
        if (isDisliked) {
            logger.error('Already disliked the comment');
            return res.status(400).json({ status: 'error', message: 'Already disliked the comment' });
        }

        // Check if the user has already liked the comment
        // @ts-ignore
        const isLiked = comment.likes.includes(userId);
        if (isLiked) {
            // Remove the user from the likes list of the comment
            // @ts-ignore
            comment.likes = comment.likes.filter((id) => id !== userId);
        }

        // Add the user to the dislikes list of the comment
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
router.put('/undislike-comment/:id', fetchUser, async (req, res) => {
    logger.info('Undisliking a comment');
    try {
        // @ts-ignore
        const userId = req.userId;
        const commentId = req.params.id;

        // Find the comment to be undisliked
        const comment = await Comment.findById(commentId);
        if (!comment) {
            logger.error('Comment not found');
            return res.status(404).json({ status: 'error', message: 'Comment not found' });
        }

        // Check if the user has already disliked the comment
        // @ts-ignore
        const isDisliked = comment.dislikes.includes(userId);
        if (!isDisliked) {
            logger.error('Comment not disliked yet');
            return res.status(400).json({ status: 'error', message: 'Comment not disliked yet' });
        }

        // Remove the user from the dislikes list of the comment
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