// Npm Packages
const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
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
        if (isPrivate != null) newUser.isPrivate = isPrivate;
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

// Router to search for a user based on username
router.get('/search/:username', fetchUser, async (req, res) => {
    logger.info('Searching for a user');
    try {
        const usernameToSearch = req.params.username;
        // @ts-ignore
        const userId = req.userId;
        // Find the user
        const user = await User.findById(userId);
        const userToSearch = await User.findOne({ username: usernameToSearch }).select('-password');
        if (!userToSearch) {
            logger.error('User not found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // @ts-ignore
        const isFollowing = user.following?.some((user) => user.userID.toString() === userToSearch._id.toString());
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
        const isFollowing = user.following?.some((user) => user.userID.toString() === followId);
        if (isFollowing) {
            logger.error('Already following');
            return res.status(400).json({ status: 'error', message: 'Already following' });
        }

        // Add the user to be followed to the following list of the user
        // @ts-ignore
        user.following.push({
            userID: followId,
            name: userToFollow.name,
            username: userToFollow.username,
            profileImageURL: userToFollow.profileImageURL,
            gender: userToFollow.gender,
            // @ts-ignore
            numberOfFollowers: userToFollow.followers.length
        });
        // @ts-ignore
        await user.save();

        // Add the user to the followers list of the user to be followed
        // @ts-ignore
        userToFollow.followers.push({
            userID: userId,
            name: user.name,
            username: user.username,
            profileImageURL: user.profileImageURL,
            gender: user.gender,
            // @ts-ignore
            numberOfFollowers: user.followers.length
        });
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
        const isFollowing = user.following.some((user) => user.userID.toString() === unfollowId);
        if (!isFollowing) {
            logger.error('Already not following the user');
            return res.status(400).json({ status: 'error', message: 'Already not following the user' });
        }

        // Remove the user to be unfollowed from the following list of the user
        // @ts-ignore
        user.following = user.following.filter((user) => user.userID.toString() !== unfollowId);
        // @ts-ignore
        await user.save();
        
        // Remove the user from the followers list of the user to be unfollowed
        // @ts-ignore
        userToUnfollow.followers = userToUnfollow.followers.filter((user) => user.userID.toString() !== userId);
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