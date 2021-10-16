const cors = require('cors');
const url = require("url");
const xss = require('xss-clean');
const helmet = require('helmet');
const express = require('express');
const passport = require('passport');
const httpStatus = require('http-status');
const compression = require('compression');
const { AtomicMarketApi } = require('atomicmarket');
const mongoSanitize = require('express-mongo-sanitize');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const ApiError = require('./utils/ApiError');

const { authLimiter } = require('./middlewares/rateLimiter');
const { errorConverter, errorHandler } = require('./middlewares/error');

const config = require('./config/config');
const morgan = require('./config/morgan');
const { jwtStrategy } = require('./config/passport');
const { PAGE, LIMIT, BASE_SALE_OPTION } = require('./consts/salesReqest');

const routes = require('./routes/v1');

const app = express();

app.use(morgan.successHandler);
app.use(morgan.errorHandler);

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
// app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.options('*', cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

// v1 api routes
app.use('/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

const taskLink = 'https://wax.atomichub.io/market?collection_name=farmersworld&max_price=5000&order=asc&schema_name=packs&sort=price&symbol=WAX&template_data:text.name=Welcome%20Pack';
const { query } = url.parse(taskLink, true);

const saleOptions = {
  ...BASE_SALE_OPTION,
  ...query
  // collection_blacklist
  // contract_whitelist
  // seller_blacklist
};

const atomicApi = new AtomicMarketApi("https://wax.api.atomicassets.io", "atomicmarket", { fetch });
let reqCount = 0;


const scanSales = () =>
  atomicApi.getSales(saleOptions, PAGE, LIMIT)
  .then(result => {
    ++reqCount;

    console.log({ saleCount: result.length, saleOptions , result , reqCount});

    // return !result.length && scanSales();
  });

scanSales();

module.exports = app;
