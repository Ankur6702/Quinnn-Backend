// Npm Packages
const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');
const fetchUser = require('../middleware/fetchUser');

// Models
const Event = require('../models/Event');

// Local functions
const logger = require('../logger');
const { validateUsername } = require('../utils/validators');

dotenv.config();

// ===========================================Controllers=====================================================




module.exports = router;