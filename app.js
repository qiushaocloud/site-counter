const express = require('express');
const apiControllers = require('./controllers');
const dotenv = require('dotenv');
const {getLogger} = require('./log');
const log = getLogger('App');
const expressApp = express();
dotenv.config();

expressApp.use(express.json());
expressApp.use(express.urlencoded({extended: false}));
expressApp.use(apiControllers);

const {API_PORT} = process.env;

log.info('run expressServer API_PORT:', API_PORT);

const expressServer = expressApp.listen(API_PORT);

expressServer.on('listening',  () => {
  log.info('recv server listening evt');
});

expressServer.on('error', (err) => {
  log.error('recv server error evt, err:', err);
});