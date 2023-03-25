// Npm Packages
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');

// Models
const User = require('../models/User');

// Local functions
const { sendResetPasswordMail, sendVerificationMail } = require('../utils/mailer');
const logger = require('../logger');
const { validatePassword, validateUsername } = require('../utils/validators');

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

// ===========================================Controllers=====================================================

// To register a new user
router.post('/signup',
    body('name').notEmpty().withMessage('Name is required'),
    body('username').notEmpty().withMessage('Username is required'),
    body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Email is invalid'),
    body('password').notEmpty().withMessage('Password is required'),
    body('gender').notEmpty().withMessage('Gender is required'),
    async (req, res) => {
        logger.info('Signup request received');
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.error('Signup request failed');
            return res.status(400).json({ status: 'error', errors: errors.array() });
        }

        if (!validatePassword(req.body.password)) {
            return res.status(400).json({ status: 'error', message: "Password should be of 8 characters long and should be less than 16 characters. It should contain at least one uppercase, one lowercase, and one number" });
        }

        if(!validateUsername(req.body.username)) {
            return res.status(400).json({ status: 'error', message: "Username should be more then 3 characters. It can contain alphanumeric data" });
        }

        try {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            logger.debug('Hashed password: ' + hashedPassword);

            const user = await User.create({
                name: req.body.name,
                username: req.body.username,
                email: req.body.email,
                password: hashedPassword,
                gender: req.body.gender
            });

            // @ts-ignore
            await sendVerificationMail(req.body.email, req.body.name, jwt.sign({ email: req.body.email }, JWT_SECRET, { expiresIn: '30d' }));

            logger.info('Signup successful');
            logger.debug('User details: ' + user);
            res.status(200).json({ status: 'success', message: 'User created, please verify your email' });
        } catch (error) {
            logger.error('Signup failed: ' + error.message);
            res.status(500).json({ status: 'error', message: error.message });
        }
    });

// ============================================================================================================

// To verify email
router.get('/verify-email/:token', async (req, res) => {
    logger.info('Email verification request received');
    try {
        const token = req.params.token;
        // @ts-ignore
        const decoded = jwt.verify(token, JWT_SECRET, { maxAge: '1d' });
        const user = await User.findOne({ email: decoded.email });
        if (user === null) {
            logger.error('Email verification failed: No user found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        if (user.isEmailVerified === true) {
            logger.error('Email verification failed: Email already verified');
            return res.status(400).json({ status: 'error', message: 'Email already verified' });
        }
        user.isEmailVerified = true;
        await user.save();
        logger.info('Email verification successful');
        res.status(200).json({ status: 'success', message: 'Email verified' });
    } catch (error) {
        logger.error('Email verification failed: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// To login a user
router.post('/login', [
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password cannot be blank').exists(),
], async (req, res) => {
    logger.info('Login request received');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Login request failed');
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    try {
        const user = await User.findOne({ email: req.body.email });
        logger.debug('User details: ' + user);
        if (user === null) {
            logger.error('Login failed: No user found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        // check if user is email verified
        if (user.isEmailVerified === false) {
            logger.error('Login failed: Email not verified');
            return res.status(401).json({ status: 'error', message: 'Email not verified' });
        }
        // check if password is correct
        const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
        if (isPasswordCorrect === false) {
            logger.error('Login failed: Incorrect password');
            return res.status(401).json({ status: 'error', message: 'Incorrect password' });
        }
        // create and assign a token
        // @ts-ignore
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
        logger.info('Login successful');
        res.status(200).json({ status: 'success', message: 'Login successful', token });
    } catch (error) {
        logger.error('Login failed: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// Forgot Password - User
router.post('/forgot-password', [
    body('email', 'Enter a valid email').isEmail(),
], async (req, res) => {
    logger.info('Forgot password request received');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Forgot password request failed');
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    try {
        logger.info('Processing forgot password request');
        const user = await User.findOne({ email: req.body.email });
        logger.debug('User details: ' + user);
        if (user === null) {
            logger.error('Forgot password failed: No user found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // @ts-ignore
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
        logger.debug('Token: ' + token);

        sendResetPasswordMail(user.email, user.name, token);
        res.status(200).json({ status: 'success', message: 'Password reset link sent to your email' });
    } catch (error) {
        logger.error('Forgot password request failed: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// GET-Reset Password - User
router.get('/reset-password/:token', async (req, res) => {
    logger.info('Reset password token received');
    try {
        logger.info('Processing request further');
        // @ts-ignore
        const decoded = jwt.verify(req.params.token, JWT_SECRET);
        logger.debug('Decoded token: ' + decoded);

        const user = await User.findOne({ _id: decoded.id });
        logger.debug('User details: ' + user);
        if (user === null) {
            logger.error('Reset password failed: No user found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        res.status(200).json({ status: 'success', message: 'Verified, now you can enter new password', token: req.params.token });
    } catch (error) {
        logger.error('Reset password request failed: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================================================================

// POST-Reset Password - User
router.post('/reset-password/:token', [
    body('newPassword', 'Password cannot be blank').exists(),
    body('confirmPassword', 'Passwords do not match').custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error('Passwords do not match');
        }
        return true;
    }),
], async (req, res) => {
    logger.info('Reset password request received');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Reset password request failed');
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    if (validatePassword(req.body.newPassword) === false) {
        return res.status(400).json({ status: 'error', message: "Password should be of 8 characters long and should be less than 16 characters. It should contain at least one uppercase, one lowercase, and one number" });
    }
    try {
        logger.info('Processing reset password request');
        // @ts-ignore
        const decoded = jwt.verify(req.params.token, JWT_SECRET);
        logger.debug('Decoded token: ' + decoded);

        const user = await User.findOne({ _id: decoded.id });
        logger.debug('User found: ' + user);
        if (user === null) {
            logger.error('Reset password failed: No user found');
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // @ts-ignore
        const saltRounds = parseInt(process.env.SALT_ROUNDS);
        const salt = await bcrypt.genSalt(saltRounds);
        // @ts-ignore
        const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);

        logger.debug('Hashed password: ' + hashedPassword);
        // @ts-ignore
        user.password = hashedPassword;
        await user.save();

        logger.info('Reset password successful');
        logger.debug('User details: ' + user);
        res.status(200).json({ status: 'success', message: 'Password reset' });
    } catch (error) {
        logger.error('Reset password failed: ', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router