const SequelizeAuto = require('sequelize-auto');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const databaseName = process.env.DB_DATABASE;
const databaseUser = process.env.DB_USER;
const databasePassword = process.env.DB_PASSWORD;
const databaseHost = process.env.DB_HOST;

const auto = new SequelizeAuto(databaseName, databaseUser, databasePassword, {
    host: databaseHost,
    dialect: 'mariadb', // Change this to your database dialect if needed
    directory: './models', // Output directory for models
    additional: {
        timestamps: false, // Set this to true if you want timestamps in your models
    },
    port: 3306, // Change this to your database port if needed
});

auto.run(function (err) {
    if (err) throw err;
    console.log('Models generated successfully!');
    process.exit(0);
});
