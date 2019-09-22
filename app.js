/**
 * Module dependencies.
 */
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');
const cors = require('cors');

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
if (process.env.NODE_ENV !== 'production') {
  dotenv.load({path: '.env'});
}


/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const userController = require('./controllers/user');
// const apiController = require('./controllers/api');
const contactController = require('./controllers/contact');
const loanController = require('./controllers/loan');
const creditController = require('./controllers/credit');
/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */
mongoose.Promise = global.Promise;
mongoose.connect(process.env.ATLAS_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
})
    .catch((err) => {
      console.log('Not Connected to Database ERROR!');
      console.log(err);
    });
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));


/**
 * Express configuration.
 */
app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(expressStatusMonitor());
app.use(compression());
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
}));


function unacceptable(host) {
  return [
    /localhost/gi,
    /plant-share.herokuapp.com/gi,
    /nominatim.openstreetmap.org/gi,
    /api.inaturalist.org/gi,
    /api.tiles.mapbox.com/gi,
    /api.tiles.mapbox.com/gi,
    /google.com/gi,
    /gstatic.com/gi,
    /unpkg.com/gi,
    /gravatar.com/gi,
    /fonts.googleapis.com/gi,
    /storage.googleapis.com/gi,
  ].some((regexp) => regexp.test(host));
}

const corsOptions = {
  origin(origin, callback) {
    if (unacceptable(origin) || !origin) {
      callback(null, true);
    } else {
      // console.log(origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(cors(corsOptions));


app.use((req, res, next) => {
  // The 'x-forwarded-proto' check is for Heroku
  if (!req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV !== 'development') {
    return res.redirect(`https://${req.get('host')}${req.url}`);
  }
  next();
});

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    // url: process.env.ATLAS_URI,
    mongooseConnection: mongoose.connection,
    autoReconnect: true,
    clear_interval: 3600,
  }),
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
  if ((new RegExp('plant/upload').test(req.path) && req.method === 'POST') || (new RegExp('edit').test(req.path) && req.method === 'DELETE') || (new RegExp('info').test(req.path) && req.method === 'POST') || (new RegExp('credit').test(req.path) && req.method === 'POST')) {
    next();
  } else {
    lusca.csrf()(req, res, next);
    // next();
  }
});

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user &&
    req.path !== '/login' &&
    req.path !== '/signup' &&
    !req.path.match(/^\/auth/) &&
    !req.path.match(/api/) &&
    !req.path.match(/\./)) {
    req.session.returnTo = req.path;
  } else if (req.user &&
    req.path === '/account') {
    req.session.returnTo = req.path;
  }
  next();
});


// const sourceFilePath = path.resolve('./example.txt');
// const blobName = path.basename(sourceFilePath, path.extname(sourceFilePath));


app.use(express.static(path.join(__dirname, 'public'), {maxAge: 31557600000}));
// app.use(express.static(path.join(__dirname, 'uploads'), { maxAge: 31557600000 }));

/**
 * Primary app routes.
 */
app.get('/info', homeController.info);
app.get('/fund', homeController.fund);
app.get('/invest', homeController.invest);

app.get('/', homeController.index);
app.get('/api/loan', homeController.getPlantsInRange);

app.get('/credit', creditController.getCredit);
app.post('/credit', creditController.calcCredit);
app.get('/login', userController.getLogin);
app.post('/login', userController.checkPostLogin, userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.checkPostSignup, userController.postSignup);
app.post('/contact', contactController.checkValues, contactController.postContact);
app.get('/contact', contactController.getContact);
app.get('/account', passportConfig.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConfig.isAuthenticated, userController.checkPostUpdateProfile, userController.postUpdateProfile);
app.post('/account/password', passportConfig.isAuthenticated, userController.checkPostUpdatePassword, userController.postUpdatePassword);
app.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);


app.get('/loan/new/', passportConfig.isAuthenticated, loanController.newLoan);
app.post('/loan/new/', passportConfig.isAuthenticated, loanController.checkPostLoan, loanController.postLoan);
//app.get('/loan/upload/:id', passportConfig.isAuthenticated, loanController.newLoanImages);
//app.post('/loan/upload/:id', passportConfig.isAuthenticated, loanController.postNewLoanImages);

app.get('/loan/view/:id', loanController.loanInfo);
app.post('/loan/view/:id', passportConfig.isAuthenticated, loanController.redirectInvest);

app.get('/loan/postings', passportConfig.isAuthenticated, loanController.loanListings);
app.get('/loan/edit/:id', passportConfig.isAuthenticated, loanController.editLoan);
app.post('/loan/edit/:id', passportConfig.isAuthenticated, loanController.checkPostLoanEdit, loanController.postLoanEdit);
app.get('/loan/editUpload/:id', passportConfig.isAuthenticated, loanController.editLoanImages);

app.get('/admin', passportConfig.isAuthenticated, loanController.adminPage);
app.post('/admin/data', passportConfig.isAuthenticated, loanController.adminPageData);


app.post('/loan/editUpload/:id', passportConfig.isAuthenticated, loanController.postLoanEditImages);

app.delete('/loan/edit/:id', passportConfig.isAuthenticated, loanController.deleteLoan);

app.get('/pay/:id', passportConfig.isAuthenticated, loanController.pay);
app.post('/pay/:id', passportConfig.isAuthenticated, loanController.payMoney);
app.get('/process', passportConfig.isAuthenticated, loanController.processPayment);
app.get('/cancel/', passportConfig.isAuthenticated, loanController.cancelPayment);
/**
 * API examples routes.
 */
/* app.get('/api', apiController.getApi);
app.get('/api/lastfm', apiController.getLastfm);
app.get('/api/nyt', apiController.getNewYorkTimes);
app.get('/api/aviary', apiController.getAviary);
// eslint-disable-next-line max-len
app.get('/api/steam', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getSteam);

app.get('/api/scraping', apiController.getScraping);

app.get('/api/clockwork', apiController.getClockwork);
app.post('/api/clockwork', apiController.postClockwork);

app.get('/api/tumblr', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTumblr);
app.get('/api/facebook', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFacebook);


app.get('/api/linkedin', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getLinkedin);
app.get('/api/instagram', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getInstagram);
app.get('/api/paypal', apiController.getPayPal);
app.get('/api/paypal/success', apiController.getPayPalSuccess);
app.get('/api/paypal/cancel', apiController.getPayPalCancel);
app.get('/api/lob', apiController.getLob);
app.get('/api/upload', apiController.getFileUpload);


app.post('/api/upload',  apiController.postFileUpload);
app.get('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getPinterest);
app.post('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postPinterest);
app.get('/api/google-maps', apiController.getGoogleMaps);
*/
/**
 * OAuth authentication routes. (Sign in)
 */
/*
app.get('/auth/instagram', passport.authenticate('instagram'));
app.get('/auth/instagram/callback', passport.authenticate('instagram', { failureRedirect: '/login' }), (req, res) => {
    res.redirect(req.session.returnTo || '/');
});
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
    res.redirect(req.session.returnTo || '/');
});
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
    res.redirect(req.session.returnTo || '/');
});
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect(req.session.returnTo || '/');
});
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), (req, res) => {
    res.redirect(req.session.returnTo || '/');
});
app.get('/auth/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), (req, res) => {
    res.redirect(req.session.returnTo || '/');
});
*/
/**
 * OAuth authorization routes. (API examples)
 */
/*
app.get('/auth/foursquare', passport.authorize('foursquare'));
app.get('/auth/foursquare/callback', passport.authorize('foursquare', { failureRedirect: '/api' }), (req, res) => {
    res.redirect('/api/foursquare');
});
app.get('/auth/tumblr', passport.authorize('tumblr'));
app.get('/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/api' }), (req, res) => {
    res.redirect('/api/tumblr');
});
app.get('/auth/steam', passport.authorize('openid', { state: 'SOME STATE' }));
app.get('/auth/steam/callback', passport.authorize('openid', { failureRedirect: '/login' }), (req, res) => {
    res.redirect(req.session.returnTo || '/');
});
app.get('/auth/pinterest', passport.authorize('pinterest', { scope: 'read_public write_public' }));
app.get('/auth/pinterest/callback', passport.authorize('pinterest', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/api/pinterest');
});

*/
/**
 * Error Handler.
 */
app.use((req, res) => res.render('not_found', {
  title: 'Page Not Found - Fresh Start',
}));

if (process.env.NODE_ENV === 'development') {
  // only use in development
  app.use(errorHandler());
}
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('not_found');
});


/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');
});

module.exports = app;
