import express from 'express';
import bodyParser from 'body-parser';

import logger from '../shared/logger';
import octoprintWebhook from './octoprint-webhook';

export default () => {
  const app = express();

  app.get('/health', (req, res) => {
    res.status(200).end();
  });

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  octoprintWebhook(app);

  logger.info('---------------------------');
  logger.info('☕️ ');
  logger.info('Starting Server');
  logger.info(`Environment: ${process.env.NODE_ENV}`);

  const preferredPort = process.env.PORT || 3000;

  app.listen(preferredPort, (error) => {
    if (!error) {
      logger.info(`📡  Running on port: ${preferredPort}`);
    }
  });
};
