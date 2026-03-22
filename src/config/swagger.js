const swaggerJsdoc = require('swagger-jsdoc');

const env = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Zestora API',
      version: '1.0.0',
      description: 'Zestora automation platform API',
    },
    servers: [
      { url: `http://localhost:${env.port}/api/v1` },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
