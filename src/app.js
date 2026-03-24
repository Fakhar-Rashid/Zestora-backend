const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const credentialRoutes = require('./routes/credentialRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const executionRoutes = require('./routes/executionRoutes');
const nodeRoutes = require('./routes/nodeRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const knowledgeBaseRoutes = require('./routes/knowledgeBaseRoutes');

require('./engine/nodes/index');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/credentials', credentialRoutes);
app.use('/api/v1/workflows', workflowRoutes);
app.use('/api/v1/executions', executionRoutes);
app.use('/api/v1/nodes', nodeRoutes);
app.use('/api/v1/webhook', webhookRoutes);
app.use('/api/v1/workflows', knowledgeBaseRoutes);

app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, message: 'Zestora API is running' });
});

app.use(errorHandler);

module.exports = app;
