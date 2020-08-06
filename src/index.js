import dotenv from 'dotenv';
import 'core-js/stable';
import 'regenerator-runtime/runtime';

import server from './server';

dotenv.config();

server();
