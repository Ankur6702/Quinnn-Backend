// NPM Packages
// @ts-ignore
const express = require('express');
// @ts-ignore
const swaggerUi = require('swagger-ui-express');
// @ts-ignore
const cors = require('cors');
// @ts-ignore
const YAML = require('yamljs');

// Local functions
const connectDB = require("./db");
const logger = require('./logger');

connectDB();
const app = express();
// @ts-ignore
app.use(express.json());
// @ts-ignore
app.use(cors());
const port = process.env.PORT || 9999;
const swaggerDocument = YAML.load('./swagger.yml');

// Routes
// @ts-ignore
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// @ts-ignore
app.use('/api/auth', require('./routes/auth'));
// @ts-ignore
app.use('/api/profile', require('./routes/profile'));
// @ts-ignore
app.use('/api/event', require('./routes/event'));

// @ts-ignore
app.get('/', (req, res) => {
    res.send('Server Working');
});

// @ts-ignore
app.listen(port, () => {
    logger.info(`🚀 Server running on port ${port}`);
});