// NPM Packages
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const YAML = require('yamljs');

// Local functions
const connectDB = require("./db");
const logger = require('./logger');

connectDB();
const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 9999;
const swaggerDocument = YAML.load('./swagger.yml');

// Routes
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
    res.send('Server Working');
});

app.listen(port, () => {
    logger.info(`🚀 Server running on port ${port}`);
});