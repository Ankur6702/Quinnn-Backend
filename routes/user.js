// Npm Packages
const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const { fetchUser } = require('../middleware/fetchUser');

// Models
const User = require('../models/User');

// Local functions
const logger = require('../logger');
const { validateUsername } = require('../utils/validators');

dotenv.config();

// Router to fetch user profile
// @ts-ignore
router.get('/profile', fetchUser, async (req, res) => {
    logger.info('Fetching user profile');
    try {
        // @ts-ignore
        const user = await User.findById(req.userId).select('-password');
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
            logger.info('Checking if username already exists');
            const user = await User.findOne({ username });
            if (user && user._id.toString() !== userId) {
                logger.error('Username already exists');
                return res.status(400).json({ status: 'error', message: 'Username already exists' });
            }

            logger.info('Validating username');
            if (!validateUsername(username)) {
                logger.error('Invalid username');
                return res.status(400).json({ status: 'error', message: 'Invalid username' });
            }
        }

        // Create a new user object
        let newUser = {};
        if (name) newUser.name = name;
        if (username) newUser.username = username;
        if (bio || bio === '') newUser.bio = bio;
        if (profileImageURL || profileImageURL === '') newUser.profileImageURL = profileImageURL;
        if (coverImageURL || coverImageURL === '') newUser.coverImageURL = coverImageURL;
        if (isPrivate != null) newUser.isPrivate = isPrivate;
        if (country) newUser.country = country;
        if (dob) newUser.dob = dob;

        logger.info('Finding and updating the user');
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
router.get('/search/:username', fetchUser, async (req, res) => {
    logger.info('Searching for a user');
    try {
        const usernameToSearch = req.params.username;
        // @ts-ignore
        const userId = req.userId;
        
        logger.info('Finding the user');
        const user = await User.findById(userId);

        logger.info('Finding the user to search');
        const userToSearch = await User.findOne({ username: usernameToSearch }).select('-password');
        if (!userToSearch) {
            logger.error('User not found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        logger.info('Checking if the user is following the user to be searched');
        // @ts-ignore
        const isFollowing = user?.following?.includes(userToSearch._id.toString());
        logger.info('User found');
        res.status(200).json({ status: 'success', message: 'User found', data: userToSearch, isFollowing });
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

        logger.info('Finding the user to be followed');
        let userToFollow = await User.findById(followId);
        if (!userToFollow) {
            logger.error('User not found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        logger.info('Finding the user');
        let user = await User.findById(userId);
        if (!user) {
            logger.error('User not found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        logger.info('Checking if the user is already following the user to be followed');
        // @ts-ignore
        const isFollowing = user.following.includes(followId);
        if (isFollowing) {
            logger.error('Already following');
            return res.status(400).json({ status: 'error', message: 'Already following' });
        }

        logger.info('Adding the user to the following list of the user');
        // @ts-ignore
        user.following.push(followId);
        // @ts-ignore
        await user.save();

        logger.info('Adding the user to the followers list of the user to be followed');
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

        logger.info('Finding the user to be unfollowed');
        let userToUnfollow = await User.findById(unfollowId);
        if (!userToUnfollow) {
            logger.error('User not found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        logger.info('Finding the user');
        let user = await User.findById(userId);
        if (!user) {
            logger.error('User not found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        logger.info('Checking if the user is already following the user to be unfollowed');
        // @ts-ignore
        const isFollowing = user.following.includes(unfollowId);
        if (!isFollowing) {
            logger.error('Already not following the user');
            return res.status(400).json({ status: 'error', message: 'Already not following the user' });
        }

        logger.info('Removing the user from the following list of the user');
        // @ts-ignore
        user.following = user.following.filter((id) => id !== unfollowId);
        // @ts-ignore
        await user.save();
        
        logger.info('Removing the user from the followers list of the user to be unfollowed');
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

module.exports = router;