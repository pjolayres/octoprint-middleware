/**
 * @typedef {import("express").Express} Express
 */
import axios from 'axios';
import moment from 'moment';

import logger from '../shared/logger';

/**
 * @param app {Express}
 */
export default (app) => {
  app.post('/octoprint-webhook', async (req, res) => {
    logger.info('/octoprint-webhook called %0.', req.body);

    const notifyMeAccessCode = process.env.NOTIFY_ME_ACCESS_CODE;
    const {
      deviceIdentifier, currentTime, extra, job, message, topic
    } = req.body;
    const currentDate = moment(currentTime * 1000);
    const notificationMessage = [];

    let filamentConsumptionInMeters = 0;
    if (typeof job?.filament === 'number' && job?.filament > 0) {
      filamentConsumptionInMeters = job?.filament * 1000;
    }

    const duration = moment.duration(extra?.time, 'seconds');
    let humanizedDuration = '';
    if (moment.isDuration(duration)) {
      const days = duration.days();
      const hours = duration.hours();
      const minutes = duration.minutes();
      const seconds = duration.seconds();
      const durationTokens = [];

      if (days > 0) {
        durationTokens.push(`${days} day${days > 1 ? 's' : ''}`);
      }
      if (hours > 0) {
        durationTokens.push(`${hours} hour${hours > 1 ? 's' : ''}`);
      }
      if (minutes > 0) {
        durationTokens.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
      }
      if (seconds > 0) {
        durationTokens.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
      }

      if (durationTokens.length > 0) {
        const prefixTokens = durationTokens.splice(0, durationTokens.length - 1);

        humanizedDuration = `${prefixTokens.join(', ')}${prefixTokens.length > 0 && durationTokens.length > 0 ? ', and ' : ''}${
          durationTokens[0] || ''
        }`;
      }
    }

    switch (topic) {
      case 'Print Done': {
        notificationMessage.push(`${deviceIdentifier} reports your print has finished at around ${currentDate.format('LT')}.`);

        if (filamentConsumptionInMeters) {
          notificationMessage.push(`It consumed ${filamentConsumptionInMeters} meters of filament`);

          if (humanizedDuration) {
            notificationMessage.push(`and took ${humanizedDuration} to complete.`);
          }
        }
        else if (humanizedDuration) {
          notificationMessage.push(`It took ${humanizedDuration} to complete.`);
        }

        break;
      }
      default:
        notificationMessage.push(`At around ${currentDate.format('LT')}, ${deviceIdentifier} reports ${message}.`);
        break;
    }

    const notificationData = {
      notification: notificationMessage.join(' '),
      accessCode: notifyMeAccessCode
    };

    try {
      if (!notifyMeAccessCode) {
        throw new Error('NOTIFY_ME_ACCESS_CODE is not defined');
      }

      await axios.post('https://api.notifymyecho.com/v1/NotifyMe', notificationData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      res.status(200);
    }
    catch (ex) {
      res.status(500);
    }
    finally {
      res.end();
    }
  });
};
