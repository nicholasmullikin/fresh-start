const bluebird = require('bluebird');
const crypto = require('crypto');
const passport = require('passport');
const mongoose = require('mongoose');
const {check, validationResult} = require('express-validator/check');
const xssFilters = require('xss-filters');
const sgMail = require('@sendgrid/mail');
const Plant = require('../models/Plant');
const User = require('../models/User');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * GET /login
 * Login page.
 */
exports.getLogin = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/login', {
    title: 'Login',
  });
};


/**
 * POST /login
 * Sign in using email and password.
 */

exports.checkPostLogin = [
  check('email', 'Email is not valid').isEmail(),
  check('password', 'Password cannot be blank').exists({checkFalsy: true}),
];

exports.postLogin = (req, res, next) => {
  // console.log(req.session.returnTo);
  const errors = validationResult(req).mapped();
  if (Object.getOwnPropertyNames(errors).length) {
    const prop = Object.getOwnPropertyNames(errors); // get list of objects in error response
    req.flash('errors', errors[prop[0]]); // access property name with [x] notation
    return res.redirect('/login');
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash('errors', info);
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      req.flash('success', {
        msg: 'Success! You are logged in.',
      });
      res.redirect(req.session.returnTo || '/');
    });
  })(req, res, next);
};
/**
 * GET /logout
 * Log out.
 */
exports.logout = (req, res) => {
  req.logout();
  res.redirect('/');
};
/**
 * GET /signup
 * Signup page.
 */
exports.getSignup = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/signup', {
    title: 'Create Account',
  });
};
/**
 * POST /signup
 * Create a new local account.
 */
exports.checkPostSignup = [
  check('email', 'Email is not valid').isEmail(),
  check('password', 'Password must be at least 4 characters long').isLength({min: 4, max: 64}),
  check('confirmPassword', 'Passwords do not match')
      .exists()
      .custom((value, {req}) => value === req.body.password),
];

exports.postSignup = (req, res, next) => {
  // req.check('email', 'Email is not valid').isEmail();
  // req.check('password', 'Password must be at least 4 characters long').len(4, 100);
  // req.check('confirmPassword', 'Passwords do not match').equals(req.body.password);
  // req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });
  // req.body.email = req.sanitize(req.body.email);
  // console.log(validationResult(req).mapped());
  const errors = validationResult(req).mapped();
  if (Object.getOwnPropertyNames(errors).length) {
    const prop = Object.getOwnPropertyNames(errors); // get list of objects in error response
    req.flash('errors', errors[prop[0]]); // access property name with [x] notation
    return res.redirect('/signup');
  }
  const user = new User({
    email: req.body.email,
    password: req.body.password,
    uploads: [{
      time: 0,
      size: 0,
    }],
    admin: false,
  });
  User.findOne({
    email: req.body.email,
  }, (err, existingUser) => {
    if (err) {
      return next(err);
    }
    if (existingUser) {
      req.flash('errors', {
        msg: 'Account with that email address already exists.',
      });
      return res.redirect('/signup');
    }
    user.save((err) => {
      if (err) {
        return next(err);
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        res.redirect('/');
      });
    });
  });
};
/**
 * GET /account
 * Profile page.
 */
exports.getAccount = (req, res) => {
  res.render('account/profile', {
    title: 'Account Management',
  });
};
/**
 * POST /account/profile
 * Update profile information.
 */

exports.checkPostUpdateProfile = [
  check('email', 'Email is not valid').isEmail(),
  check('location', 'Not a valid zipcode').isPostalCode('any'),
];

exports.postUpdateProfile = (req, res, next) => {
  // req.check('email', 'Please enter a valid email address.').isEmail();
  // req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });
  // req.body.email = req.sanitize(req.body.email);
  const errors = validationResult(req).mapped();
  if (Object.getOwnPropertyNames(errors).length) {
    const prop = Object.getOwnPropertyNames(errors); // get list of objects in error response
    req.flash('errors', errors[prop[0]]); // access property name with [x] notation
    return res.redirect('/account');
  }
  User.findById(req.user.id, (err, user) => {
    if (err) {
      return next(err);
    }
    user.email = req.body.email || '';
    user.location = req.body.location || '';
    user.save((err) => {
      if (err) {
        if (err.code === 11000) {
          req.flash('errors', {
            msg: 'The email address you have entered is already associated with an account.',
          });
          return res.redirect('/account');
        }
        return next(err);
      }
      req.flash('success', {
        msg: 'Profile information has been updated.',
      });
      res.redirect('/account');
    });
  });
};
/**
 * POST /account/password
 * Update current password.
 */

exports.checkPostUpdatePassword = [
  check('password', 'Password must be at least 4 characters long').isLength({min: 4, max: 64}),
  check('confirmPassword', 'Passwords do not match')
      .exists()
      .custom((value, {req}) => value === req.body.password),
];

exports.postUpdatePassword = (req, res, next) => {
  const errors = validationResult(req).mapped();
  if (Object.getOwnPropertyNames(errors).length) {
    const prop = Object.getOwnPropertyNames(errors); // get list of objects in error response
    req.flash('errors', errors[prop[0]]); // access property name with [x] notation
    return res.redirect('/account');
  }
  User.findById(req.user.id, (err, user) => {
    if (err) {
      return next(err);
    }
    user.password = req.body.password;
    user.save((err) => {
      if (err) {
        return next(err);
      }
      req.flash('success', {
        msg: 'Password has been changed.',
      });
      res.redirect('/account');
    });
  });
};
/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = (req, res, next) => {
  User.remove({_id: req.user.id}, (err) => {
    if (err) {
      return next(err);
    }
    Plant.find({user: req.user.id}, (err, plantArray) => {
      if (err) return handleError(err);
      if (plantArray === null) {
        if (plantArray.length === 0) {
          res.redirect('/');
        }
      }
      plantArray.forEach((plant) => {
        if (plant.pictures) {
          for (let i = 0; i < plant.pictures.length; i++) {
            Plant.deleteImage(plant.pictures[i]);
          }
          Plant.findByIdAndRemove(mongoose.mongo.ObjectId(plant._id), (err) => {
            console.log(err);
          });
        }
      });
    });
    req.logout();
    req.flash('info', {
      msg: 'Your account has been deleted.',
    });
    res.redirect('/');
  });
};
/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
exports.getOauthUnlink = (req, res, next) => {
  const {provider} = req.params;
  User.findById(req.user.id, (err, user) => {
    if (err) {
      return next(err);
    }
    user[provider] = undefined;
    user.tokens = user.tokens.filter((token) => token.kind !== provider);
    user.save((err) => {
      if (err) {
        return next(err);
      }
      req.flash('info', {
        msg: `${provider} account has been unlinked.`,
      });
      res.redirect('/account');
    });
  });
};
/**
 * GET /reset/:token
 * Reset Password page.
 */
exports.getReset = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  User
      .findOne({
        passwordResetToken: req.params.token,
      })
      .where('passwordResetExpires').gt(Date.now())
      .exec((err, user) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          req.flash('errors', {
            msg: 'Password reset token is invalid or has expired.',
          });
          return res.redirect('/forgot');
        }
        res.render('account/reset', {
          title: 'Password Reset',
        });
      });
};
/**
 * POST /reset/:token
 * Process the reset password request.
 */

exports.checkPostReset = [
  check('password', 'Password must be at least 4 characters long').isLength({min: 4, max: 64}),
  check('confirmPassword', 'Passwords do not match')
      .exists()
      .custom((value, {req}) => value === req.body.password),
];
exports.postReset = (req, res, next) => {
  const errors = validationResult(req).mapped();
  if (Object.getOwnPropertyNames(errors).length) {
    const prop = Object.getOwnPropertyNames(errors); // get list of objects in error response
    req.flash('errors', errors[prop[0]]); // access property name with [x] notation
    return res.redirect(`/reset/${req.params.token}`);
  }
  const resetPassword = () => User
      .findOne({
        passwordResetToken: req.params.token,
      })
      .where('passwordResetExpires').gt(Date.now())
      .then((user) => {
        if (!user) {
          req.flash('errors', {
            msg: 'Password reset token is invalid or has expired.',
          });
          return res.redirect('back');
        }
        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        return user.save().then(() => new Promise((resolve, reject) => {
          req.logIn(user, (err) => {
            if (err) {
              return reject(err);
            }
            resolve(user);
          });
        }));
      });
  const sendResetPasswordEmail = (user) => {
    if (!user) {
      return;
    }

    const msg = {
      to: user.email,
      from: 'hackathon@starter.com',
      subject: 'Your Plant Share password has been changed',
      html: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`,
    };
    return sgMail.send(msg, (error) => {
      if (error) {
        req.flash('errors', {msg: error.message});
        return res.redirect('back');
      }

      req.flash('success', {
        msg: 'Success! Your password has been changed.',
      });
    });
  };
  resetPassword()
      .then(sendResetPasswordEmail)
      .then(() => {
        if (!res.finished) res.redirect('/');
      })
      .catch((err) => next(err));
};
/**
 * GET /forgot
 * Forgot Password page.
 */
exports.getForgot = (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('account/forgot', {
    title: 'Forgot Password',
  });
};
/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
exports.checkPostForgot = [
  check('email', 'Email is not valid').isEmail(),
];
exports.postForgot = (req, res) => {
  // req.check('email', 'Please enter a valid email address.').isEmail();
  // req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });
  // req.body.email = req.sanitize(req.body.email);
  const errors = validationResult(req).mapped();
  if (Object.getOwnPropertyNames(errors).length) {
    const prop = Object.getOwnPropertyNames(errors); // get list of objects in error response
    req.flash('errors', errors[prop[0]]); // access property name with [x] notation
    return res.redirect('/forgot');
  }
  req.body.email = xssFilters.inHTMLData(req.body.email);
  User
      .findOne({
        email: req.body.email,
      })
      .then((user) => {
        if (!user) {
          req.flash('info', {
            msg: `If this is a valid email, an e-mail has been sent to ${req.body.email} with further instructions.`,
          });
          res.redirect('back');
        } else {
          crypto.randomBytes(32, (err, buf) => {
            if (err) {
              console.log(err);
            }
            user.passwordResetToken = buf.toString('hex');
            user.passwordResetExpires = Date.now() + 3600000; // 1 hour
            user.save().then((user) => {
              sendForgotPasswordEmail(user);
            });
          });
        }
      });

  const sendForgotPasswordEmail = (user) => {
    if (!user) {
      return;
    }
    const token = user.passwordResetToken;
    const msg = {
      to: user.email,
      from: 'info@plantshare.io',
      subject: 'Reset your password on Hackathon Starter',
      html: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
                    Please click on the following link, or paste this into your browser to complete the process:\n\n
                    https://${req.headers.host}/reset/${token}\n\n
                    If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };
    sgMail.send(msg, (error) => {
      if (error) {
        req.flash('errors', {msg: error.message});
        return res.redirect('back');
      }

      req.flash('info', {
        msg: `If this is a valid email, an e-mail has been sent to ${user.email} with further instructions.`,
      });
      res.redirect('/forgot');
    });
  };
};
