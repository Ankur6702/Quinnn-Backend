// NPM Packages
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

const logger = require('../logger');

dotenv.config();

let url;
if (process.env.NODE_ENV === 'development') {
    url = 'http://localhost:9999/api';
} else {
    url = process.env.PROD_URL;
}

function sendResetPasswordMail(email, name, token) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_ID,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const verificationURL = `${url}/auth/reset-password/${token}`;

    const mailOptions = {
        from: process.env.EMAIL_ID,
        to: email,
        subject: 'Reset Your Password',
        html: `Hi ${name},<br><br>
        We received a request to reset your password for your account on [Website Name]. 
        If you did not make this request, please ignore this email and no changes will 
        be made to your account.<br><br>
        If you did request a password reset, please click on the following link to 
        reset your password:<br>
        <a href="${verificationURL}">Reset Password</a><br><br>
        This link will expire in 20 minutes, so please reset your password as soon as 
        possible to ensure the security of your account.<br><br>
        If you have any questions or concerns, please don't hesitate to reach out to 
        our support team.<br><br>
        Best,<br>
        The [Website Name] Team`
    };


    logger.info('Sending email');
    transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
            logger.error('Issues in sending Mail: ', err);
        } else {
            logger.info('Email sent');
        }
    });
}

async function sendVerificationMail(email, name, token) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_ID,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const verificationURL = `${url}/auth/verify-email/${token}`;

    const mailOptions = {
        from: process.env.EMAIL_ID,
        to: email,
        subject: 'Verify Your Email Address',
        html: `Hi ${name},<br><br>
        Welcome to [Website Name], a social media platform dedicated to supporting the 
        LGBTQ+ community! Before you can start connecting with others and sharing your 
        story, we need to verify your email address.<br><br>
        To verify your email and gain full access to the platform, please click on 
        the following link:<br>
        <a href="${verificationURL}">Verify Email</a><br><br>
        This link will expire in 1 day, so please verify your mail as soon as possible 
        to ensure smooth verification. If you did not create an account on [Website Name], 
        please ignore this email. 
        But if you did sign up and are having trouble verifying your email, please 
        don't hesitate to reach out to our support team.<br><br>
        We're excited to have you as part of our community and look forward to seeing 
        you on [Website Name].<br><br>
        Best,<br>
        The [Website Name] Team`
    };


    logger.info('Sending email');
    await transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
            logger.error('Issues in sending Mail: ', err);
        } else {
            logger.info('Email sent');
        }
    });
}

module.exports = { sendResetPasswordMail, sendVerificationMail };