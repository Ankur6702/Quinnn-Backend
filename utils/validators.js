const logger = require('../logger');

function validatePassword(data) {
    logger.info('Inside Password Validation', data);
    var password = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,15}$/; // 8 to 15 characters which contain at least one lowercase letter, one uppercase letter, one numeric digit
    if (password.test(data)) {
        logger.info('Password validation successful');
        return true;
    }
    else {
        logger.error('Password validation failed');
        return false;
    }
}

function validateUsername(data) {
    logger.info('Inside Username Validation', data);
    var username = /^[a-zA-Z0-9]{3,}$/; // means any character from a-z or A-Z or 0-9 and length should be greater than 3
    if (username.test(data)) {
        logger.info('Username validation successful');
        return true;
    }
    else {
        logger.error('Username validation failed');
        return false;
    }
}

function validateURL(data) {
    logger.info('Inside URL Validation', data);
    var url = /^(https?:\/\/)([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/; // means http:// or https:// followed by any character except space and then . followed by any character except space and then / followed by any character except space
    if (url.test(data)) {
        logger.info('URL validation successful');
        return true;
    }
    else {
        logger.error('URL validation failed');
        return false;
    }
}

module.exports = { validatePassword, validateUsername, validateURL };