const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const logger = require('../logger');

dotenv.config();


// To verify that the user is logged in
const fetchUser = async (req, res, next) => {
    logger.info('Verifying user');
    
    const token = req.header('token');
    logger.debug('JWT Token: ', token);
    
    let bearer = req.header('Authorization');
    if(bearer !== undefined) {
        bearer = bearer.split(' ')[1];
        logger.debug('Bearer token: ', bearer);
    }
    
    if (!token && !bearer) {
        logger.error('No token, authorization denied');
        return res.status(401).json({
            status: 'error',
            message: 'No token, authorization denied'
        });
    }
    
    try {
        let decoded;
        if(bearer) {
            // @ts-ignore
            decoded = jwt.verify(bearer, process.env.JWT_SECRET);
            logger.debug('Decoded Bearer token: ', decoded);
        } else {
            // @ts-ignore
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            logger.debug('Decoded JWT token: ', decoded);
        }
        console.log(decoded)
        req.userId = decoded.id;
        req.name = decoded.name;
        req.username = decoded.username;
        next();
    } catch (error) {
        logger.error('Token is not valid: ', error);
        res.status(401).json({
            status: 'error',
            message: 'Token is not valid'
        });
    }
};


module.exports = { fetchUser };