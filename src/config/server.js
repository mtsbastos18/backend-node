const port = 3003;

const bodyParser = require('body-parser');
const express = require('express');
const server = express();
const cors = require('cors');

server.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    exposedHeaders: ['Authorization']
}));

server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

module.exports = server;