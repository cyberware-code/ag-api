const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Import Sequelize models and initialize Sequelize
const Sequelize = require('sequelize');
const sequelize = new Sequelize({
    dialect: 'mariadb',
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
});

// Import Sequelize models dynamically
const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');

// Automatically generate routes based on models
const router = express.Router();

fs.readdirSync(modelsDir).forEach((file) => {
    const model = sequelize.models[file.replace('.js', '')];
    if (model) {
        require('./routes')(router, model);
    }
});

app.use(express.json());
app.use('/api', router);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
