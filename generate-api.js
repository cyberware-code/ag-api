const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const cors = require('cors'); // Import the cors package

app.use(cors()); // This allows all origins

dotenv.config();

const sequelize = new Sequelize({
    dialect: 'mariadb',
    database: process.env.DB_DATABASE,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
});

// Load environment variables from .env file
dotenv.config();

// Dynamically import models from the models directory
const modelsDir = path.join(__dirname, 'models');
const models = {};

fs.readdirSync(modelsDir).forEach((file) => {
    const modelName = path.basename(file, '.js');
    const model = require(path.join(modelsDir, file))(sequelize, Sequelize.DataTypes);
    models[modelName] = model;
});

const route = express.Router();
route.get('/', (req, res) => {
    const modelsDir = path.join(__dirname, 'models'); // Replace with your actual models directory

    // Read the filenames in the models directory
    fs.readdir(modelsDir, (err, files) => {
        if (err) {
            console.error('Error reading models directory:', err);
            return res.status(500).json({error: 'Server error'});
        }

        // Extract table names by removing the '.js' extension
        const tableNames = files.map((file) => path.basename(file, '.js'));

        res.json({tables: tableNames});
    });
});

app.use(`/tables`, route);
// Dynamically generate routes for each model
for (const modelName in models) {
    const model = models[modelName];
    const route = express.Router();


    route.get('/', async (req, res) => {
        const {field, value, page = 1, limit = 15, sortBy, sortOrder} = req.query;
        const where = {};

        if (field && value) {
            where[field] = {[Sequelize.Op.like]: `%${value}%`};
        }

        try {

            const {count, rows} = await model.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset: (page - 1) * limit,
            });

            const totalPages = Math.ceil(count / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;

            // Build dynamic query strings for next and previous links
            const query = {limit};
            if (field && value) {
                query.field = field;
                query.value = value;
            }
            const nextQuery = {...query, page: page + 1};
            const prevQuery = {...query, page: page - 1};

            const paginationInfo = {
                totalRecords: count,
                totalPages,
                currentPage: page,
                hasNextPage,
                hasPrevPage,
            };

            const links = {
                next: hasNextPage ? `/api/model-name?${new URLSearchParams(nextQuery).toString()}` : null,
                prev: hasPrevPage ? `/api/model-name?${new URLSearchParams(prevQuery).toString()}` : null,
            };

            res.json({records: rows, pagination: paginationInfo, links});
        } catch (err) {
            res.status(500).json({message: 'Server Error'});
        }
    });


    route.get('/:id', async (req, res) => {
        const item = await model.findByPk(req.params.id);
        if (!item) {
            return res.status(404).json({message: `${modelName} not found`});
        }
        res.json(item);
    });

    route.post('/', async (req, res) => {
        try {
            const newItem = await model.create(req.body);
            res.status(201).json(newItem);
        } catch (err) {
            res.status(400).json({message: err.message});
        }
    });

    route.put('/:id', async (req, res) => {
        const item = await model.findByPk(req.params.id);
        if (!item) {
            return res.status(404).json({message: `${modelName} not found`});
        }

        try {
            await item.update(req.body);
            res.json(item);
        } catch (err) {
            res.status(400).json({message: err.message});
        }
    });

    route.delete('/:id', async (req, res) => {
        const item = await model.findByPk(req.params.id);
        if (!item) {
            return res.status(404).json({message: `${modelName} not found`});
        }

        await item.destroy();
        res.json({message: `${modelName} deleted`});
    });


    console.log('Adddming model' + modelName)

    app.use(`/api/${modelName.toLowerCase()}`, route);
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
