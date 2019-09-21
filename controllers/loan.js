const mongoose = require('mongoose');
const fileType = require('file-type');
const lusca = require('lusca');
const geoip = require('geoip-lite');
const {check, oneOf, validationResult} = require('express-validator/check');
const xssFilters = require('xss-filters');
const https = require('https');
const uuidv1 = require('uuid/v1');
const User = require('../models/User');
const Loan = require('../models/Loan');
/**
 * GET /loan/view/:id
 * Show the info of a loan.
 */
exports.loanInfo = (req, res) => {
  if (!Loan.isObjectId(req.params.id)) {
    req.flash('errors', {
      msg: 'Not a valid load id',
    });
    return res.redirect('back');
  }
  Loan.findOne({
    _id: mongoose.Types.ObjectId(req.params.id),
  }, (err, loan) => {
    if (err) return res.redirect('/');
    if (loan === null || loan.loanName === null) {
      res.redirect('/');
    }
    return res.render('loan/loan_info', {
      title: loan.loanName,
      name: 'loan_info',
      array: loan,
    });
  });
};


/**
 * GET /loan/new/
 * New Loan Page
 */
exports.newLoan = (req, res) => {
  if (!req.user) {
    req.flash('errors', {
      msg: 'You must be logged in to create a posting',
    });
    req.session.returnTo = '/loan/new/';
    return res.redirect('/login');
  }
  const geo = geoip.lookup(getIP(req));
  // console.log(req.user);
  return res.render('loan/new_loan', {
    title: 'New Loan',
    results: geo,
  });
};

/**
 * POST /loan/new/
 * Page one of making a new loan
 */
exports.checkPostLoan = [
  check('loanName', 'Name must be between 3 and 100 characters').isLength({min: 4, max: 100}),
  check('loanDescription', 'Loan Description must be at least 4 characters long').isLength({min: 4}),
  check('amount', 'Load amount is invalid, we don\'t support tranactions above $5000').isInt({min: 1, max: 5000}),
  check('name', 'Name must be between 3 and 100 characters').isLength({min: 4, max: 100}),
  check('dueDate', 'Date bad').isISO8601(),
  check('loanType', 'Loan type must be less than 100 characters').isLength({max: 100}),
  // oneOf([
  //   check('email', 'Email is invalid').isEmail(),
  //   check('phone_number', 'Phone number is invalid').isMobilePhone('any'),
  // ]),
];
exports.postLoan = (req, res) => {
  if (!req.user) {
    req.flash('errors', {
      msg: 'You must be logged in to create a posting',
    });
    req.session.returnTo = '/loan/new/';
    return res.redirect('/login');
  }
  const errors = validationResult(req).mapped();
  if (Object.getOwnPropertyNames(errors).length) {
    const prop = Object.getOwnPropertyNames(errors); // get list of objects in error response
    req.flash('errors', errors[prop[0]]); // access property name with [x] notation
    return res.redirect('back');
  }

  User.findById(req.user.id, (err) => {
    if (err) {
      console.log(err);
    }
  }).then((user) => {
    req.body.loanName = xssFilters.inHTMLData(req.body.loanName);
    req.body.loanDescription = xssFilters.inHTMLData(req.body.loanDescription);
    req.body.amount = xssFilters.inHTMLData(req.body.amount);
    req.body.name = xssFilters.inHTMLData(req.body.name);
    req.body.dueDate = xssFilters.inHTMLData(req.body.dueDate);
    req.body.email = xssFilters.inHTMLData(req.body.email);
    req.body.phone_number = xssFilters.inHTMLData(req.body.phone_number);
    const loan = new Loan({
      loanTitle: req.body.loanName,
      loanDescription: req.body.loanDescription,
      amountWanted: req.body.amount,
      amountLoaned: 0,
      creditScore: 0,
      dueDate: req.body.dueDate,
      user: req.user._id,
      contact_info: {
        email: req.body.email,
        phone_number: req.body.phone_number,
      }
    });

    loan.save((err, loan) => {
      if (err) {
        console.log(err);
        req.flash('errors', err);
        return res.redirect('back');
      }
      user.applications.push({
        id: user._id
      });
      user.save((err) => {
        if (err) {
          console.log(err);
        }
      });

      return res.redirect(`/loan/view/${loan._id}`);
    });

  }, (err) => {
    console.log(err);
  });
};



/**
 * GET /loan/edit/:id
 * Edit Loan page
 */
exports.editLoan = (req, res) => {
  if (!Loan.isObjectId(req.params.id)) {
    // console.log("jo")
    req.flash('errors', {
      msg: 'Not a valid loan id',
    });
    return res.redirect('back');
  }
  Loan.findOne({
    _id: mongoose.Types.ObjectId(req.params.id),
  }, (err, loan) => {
    if (err) {
      return handleError(err);
    }
    if (loan === null) {
      return res.redirect('/');
    }
    if (loan.user.toString() !== req.user._id.toString() && !req.user.admin) {
      req.flash('errors', {
        msg: 'You are not the owner!',
      });
      return res.redirect('/');
    }
    return res.render('loan/edit_loan', {
      title: 'Edit Posting',
      array: loan,
    });
  });
};

/**
 * POST /loan/edit/:id
 * Change a posting
 */
exports.checkPostLoanEdit = [
  check('lat', 'Map error').isFloat({min: -90.0, max: 90.0}),
  check('lng', 'Map error').isFloat({min: -180.0, max: 180.0}),
  check('loanName', 'Name must be between 3 and 100 characters').isLength({min: 4, max: 100}),
  check('loanTaxa', 'Taxa must be less than 100 characters').isLength({max: 100}),
  check('price', 'Price must be less than 100 characters').isLength({max: 100}),
  check('loanZone', 'Zone is invalid').isLength({max: 4}),
  check('loanDescription', 'Loan Description must be at least 4 characters long').isLength({min: 4}),
  check('quantity', 'Number is invalid').isInt({min: 1, max: 999}),
  check('loanType', 'Loan type must be less than 100 characters').isLength({max: 100}),
  oneOf([
    check('email', 'Email is invalid').isEmail(),
    check('phone_number', 'Phone number is invalid').isMobilePhone('any'),
  ]),
];
exports.postLoanEdit = (req, res) => {
  if (!req.user) {
    req.flash('errors', {
      msg: 'You must be logged in to edit a posting',
    });
    req.session.returnTo = '/loan';
    return res.redirect('/login');
  }

  const errors = validationResult(req).mapped();
  if (Object.getOwnPropertyNames(errors).length) {
    const prop = Object.getOwnPropertyNames(errors); // get list of objects in error response
    req.flash('errors', errors[prop[0]]); // access property name with [x] notation
    console.log(errors[prop[0]]);
    return res.redirect('back');
  }

  User.findById(req.user.id, (err, user) => {
    if (err) {
      console.log(err);
    }
    // if (checkIfUserIsOwner(user, req.params.id)) {
    //     req.flash('errors', {
    //         msg: 'You are not the owner!'
    //     });
    //     req.session.returnTo = '/loan';
    //     return res.redirect('/login');
    // }
    /* let date = new Date();
        let difference = (date.getTime() - last_upload(response.uploads).getTime());
         if (difference < 60000) {
          req.flash('errors', {
            msg: 'Please wait another ' + Math.round((60000 - difference )/ 1000) + ' seconds'
          });
           return res.redirect('/loan');
        } */

    Loan.findById(req.params.id, (err, response) => {
      if (err) {
        console.log(err);
        // TODO add redirect
      }
      if (response.user.toString() !== req.user._id.toString() && req.user.admin !== true) {
        req.flash('errors', {
          msg: 'You are not the owner!',
        });
        return res.redirect('/');
      }
      req.body.loanName = xssFilters.inHTMLData(req.body.loanName);
      req.body.loanDescription = xssFilters.inHTMLData(req.body.loanDescription);
      req.body.quantity = xssFilters.inHTMLData(req.body.quantity);
      req.body.lat = xssFilters.inHTMLData(req.body.lat);
      req.body.lng = xssFilters.inHTMLData(req.body.lng);
      req.body.loanTaxa = xssFilters.inHTMLData(req.body.loanTaxa);
      req.body.loanZone = xssFilters.inHTMLData(req.body.loanZone);
      req.body.email = xssFilters.inHTMLData(req.body.email);
      req.body.phone_number = xssFilters.inHTMLData(req.body.phone_number);
      req.body.price = xssFilters.inHTMLData(req.body.price);
      const new_loan = {
        loanName: req.body.loanName || response.loanName,
        loanDescription: req.body.loanDescription || response.loanDescription,
        quantity: req.body.quantity || response.quantity,
        location:
                    {
                      type: 'Point',
                      coordinates:
                            [
                              req.body.lat || response.location.coordinates[0],
                              req.body.lng || response.location.coordinates[1],
                            ],
                    },
        loanTaxa: req.body.loanTaxa || response.loanTaxa,
        loanZone: req.body.loanZone || response.loanZone,
        price: req.body.price || response.price,
        contact_info:
                    {
                      email: req.body.email || response.contact_info.email,
                      phone_number: req.body.phone_number || response.contact_info.phone_number,
                    },
        loanType: req.body.loanType || response.loanType,

      };
      if (req.user.admin && req.body.admin) {
        new_loan.pictures = JSON.parse(req.body.pictures);
      }
      Loan.findByIdAndUpdate(response._id, new_loan, (err) => {
        if (err) {
          console.log(err);
          req.flash('errors', {msg: 'Update failed'});
          return res.redirect('back');
        }

        return res.redirect(`/loan/editUpload/${req.params.id}`);
      });
    });
  });
};

/**
 * GET /loan/editUpload/:id
 * Edit Loan page - images
 */
exports.editLoanImages = (req, res) => {
  if (!Loan.isObjectId(req.params.id)) {
    // console.log("jo");
    req.flash('errors', {
      msg: 'Not a valid loan id',
    });
    return res.redirect('back');
  }
  Loan.findOne({
    _id: mongoose.Types.ObjectId(req.params.id),
  }, (err, loan) => {
    if (err) {
      return handleError(err);
    }
    if (loan === null) {
      return res.redirect('/');
    }
    if (loan.user.toString() !== req.user._id.toString() && !req.user.admin) {
      req.flash('errors', {
        msg: 'You are not the owner!',
      });
      return res.redirect('/');
    }
    return res.render('loan/edit_loan_files', {
      title: 'Edit Posting',
      array: loan,
    });
  });
};

/**
 * POST /loan/editUpload/:id
 * Change a posting - images
 */
exports.postLoanEditImages = (req, res) => {
  if (!Loan.isObjectId(req.params.id)) {
    req.flash('errors', {
      msg: 'Not a valid loan id',
    });
    return res.redirect('back');
  }

  if (!req.user) {
    req.flash('errors', {
      msg: 'You must be logged in to edit a posting',
    });
    req.session.returnTo = '/loan';
    return res.redirect('/login');
  }

  const errors = validationResult(req).mapped();
  console.log(errors);
  if (Object.getOwnPropertyNames(errors).length) {
    const prop = Object.getOwnPropertyNames(errors); // get list of objects in error response
    req.flash('errors', errors[prop[0]]); // access property name with [x] notation
    return res.redirect('back');
  }
  User.findById(req.user.id, (err) => {
    if (err) {
      console.log(err);
    }
  }).then((user) => {
    if (checkIfUserIsOwner(user, req.params.id.toString()) && req.user.admin) {
      req.flash('errors', {
        msg: 'You are not the owner!',
      });
      req.session.returnTo = '/loan';
      return res.redirect('/login');
    }
    /* let date = new Date();
        let difference = (date.getTime() - last_upload(user.uploads).getTime());
         if (difference < 60000) {
          req.flash('errors', {
            msg: 'Please wait another ' + Math.round((60000 - difference )/ 1000) + ' seconds'
          });
           return res.redirect('/loan');
        } */

    Loan.findById(req.params.id, (err, response) => {
      if (err) {
        console.log(err);
        req.flash('errors', {
          msg: 'Error finding loan',
        });
        return res.redirect('back');
      }
      Loan.loanUpload(req, res, (err) => {
        if (err) {
          console.log(err);
        }
        lusca.csrf()(req, res, (error) => {
          if (error) {
            console.log(error);
            req.flash('errors', {
              msg: 'Please reload page',
            });
            return res.redirect('back');
          }
        });
        const new_loan = {pictures: []};
        const final_images = response.pictures;
        // console.log(final_images);
        let t = req.body.files_deleted;
        if (typeof t !== 'undefined' && t.length !== 0) {
          t = JSON.parse(t);
          // console.log(t[0]);
          for (let c = 0; c < t.length; c++) {
            Loan.deleteImage(t[c]);
            final_images.splice(final_images.indexOf(t[c]), 1);
          }
        }
        new_loan.pictures = final_images;

        // console.log(final_images);
        // console.log(new_loan);

        if (req.files.gallery) {
          let total_size = 0;
          const imgAmount = req.files.gallery.length;
          for (let i = 0; i < imgAmount; i++) {
            total_size += req.files.gallery[i].size;
            if (req.files.gallery[i].size > 1024 * 1024 * 10) {
              req.flash('errors', {
                msg: 'Image is too big! (10 MB max)',
              });
              delete req.files.gallery[i].buffer;
              return res.redirect('/loan');
            }
            const filetypes = /(jpg|jpeg|png|gif|tif)/;
            const infoFile = fileType(req.files.gallery[i].buffer);
            if (infoFile === null) {
              req.flash('errors', {
                msg: 'Only images are allowed (e.g. jpg jpeg png gif tif)',
              });
              delete req.files.gallery[i].buffer;
              return res.redirect('/loan');
            }
            const mimetype = filetypes.test(infoFile.mime);
            const extname = filetypes.test(infoFile.ext);
            if (!mimetype || !extname) {
              req.flash('errors', {
                msg: 'Only images are allowed (e.g. jpg jpeg png gif tif)',
              });
              delete req.files.gallery[i].buffer;
              return res.redirect('/loan');
            }

            Loan.on('error', (err) => {
              console.log(err);
            });
            const current_date = Date.now().toString();
            const name = `${req.user._id.toString()}-${current_date}.` + 'png';
            const urlBegin = 'https://storage.googleapis.com/loan-app-e8af8.appspot.com/';
            Loan.saveImage(req.files.gallery[i].buffer, name);
            delete req.files.gallery[i].buffer;
            final_images.push(urlBegin + name);
            if (i + 1 === imgAmount) {
              new_loan.pictures = final_images;
              const date = new Date();
              user.uploads.push({
                time: date,
                size: total_size,
              });
              user.save((err) => {
                if (err) {
                  console.log(err);
                }
              });
              Loan.findByIdAndUpdate(response._id, new_loan, (err) => {
                if (err) {
                  console.log(err);
                  req.flash('errors', {msg: err});
                  return res.redirect('back');
                }
                return res.redirect('/');
              });
            }
          }
        } else {
          Loan.findByIdAndUpdate(response._id, new_loan, (err) => {
            if (err) {
              console.log(err);
              req.flash('errors', {msg: err});
              return res.redirect('back');
            }
            return res.redirect('/');
          });
        }
      });
    });
  }, (error) => {
    console.log(error);
  });
};


/**
 * GET /loan/postings
 * Show all posting by a user
 */
exports.loanListings = (req, res) => {
  if (!req.user) {
    req.flash('errors', {
      msg: 'You must be logged in to view your postings',
    });
    req.session.returnTo = '/postings';
    return res.redirect('/login');
  }
  Loan.find({
    user: req.user._id,
  }, (err, loans) => res.render('loan/postings', {
    title: 'Your Postings',
    array: loans,
  }));
};

/**
 * DELETE /loan/edit/:id
 * Remove a posting
 */
exports.deleteLoan = (req, res) => {
  Loan.findOne({_id: mongoose.Types.ObjectId(req.params.id)}, (err, loan) => {
    if (err) return handleError(err);

    User.findById(mongoose.mongo.ObjectId(loan.user), (err, user) => {
      if (err) {
        console.log(err);
        return res.sendStatus(402);
      }
      if (user) {
        if (loan === null) {
          res.redirect('/');
        }
        for (let i = 0; i < loan.pictures.length; i++) {
          Loan.deleteImage(loan.pictures[i]);
        }
        Loan.findByIdAndRemove(mongoose.mongo.ObjectId(req.params.id), (err) => {
          console.log(err);
        });
      }
    });
  });
  res.sendStatus(303);
};

/**
 * POST /loan/view/:id
 * Get contact info for a loan
 */
exports.getContactInformation = (req, res) => { // TODO: add captcha here
  if (!Loan.isObjectId(req.body.loan_id)) {
    req.flash('errors', {
      msg: 'Not a valid loan id',
    });
    return res.redirect('back');
  }
  if (!req.user) {
    req.flash('errors', {
      msg: 'You must be logged in to see contact info',
    });
    return res.sendStatus(401);
  }
  verifyRecaptcha(req.body['g-recaptcha-response'], (success) => {
    if (success) {
      Loan.findById(req.params.id, (err, loan) => {
        if (err) {
          console.log(err);
          return res.sendStatus(402);
        }
        User.findById(mongoose.mongo.ObjectId(loan.user), (err, user) => {
          if (err) {
            console.log(err);
            return res.sendStatus(402);
          }
          if (user) {
            return res.render('loan/loan_info', {
              title: loan.loanName,
              name: 'loan_info',
              array: loan,
              user_info: loan.contact_info,
            });
          }
        });
      });
    } else {
      req.flash('errors', {
        msg: 'Captcha failed',
      });
      return res.redirect('back');
    }
  });
};


/**
 * GET /admin
 * Admin Page
 */
exports.adminPage = (req, res) => {
  User.findById(mongoose.mongo.ObjectId(req.user._id), (err, user) => {
    if (err) {
      console.log(err);
      // return res.sendStatus(402);
    }
    if (user.admin) {
      return res.render('loan/admin', {
        title: 'admin',
        name: 'loan_info',
        array: 'loan',
      });
    }

    return res.render('not_found');
  });
};
/**
 * GET /admin/data
 * Admin Page for data
 */
exports.adminPageData = (req, res) => {
  if (!Loan.isObjectId(req.body.id)) {
    return res.send(JSON.stringify({
      msg: 'Not a valid loan id',
    }));
  }

  User.findById(mongoose.mongo.ObjectId(req.user._id), (err, user) => {
    if (err) {
      console.log(err);
      // return res.sendStatus(402);
    }
    if (user.admin) {
      if (!Loan.isObjectId(req.body.id)) {
        return res.send(JSON.stringify({
          msg: 'Not a valid loan id',
        }));
      }
      Loan.findById(req.body.id, (err, loan) => {
        if (err) {
          console.log(err);
          return res.sendStatus(402);
        }
        return res.send(JSON.stringify(loan));
      });
    } else {
      return res.render('not_found');
    }
  });
};


/*

Helper Functions
 */
const SECRET = '6LfpOm0UAAAAAKlM_pVAdE2pWFMTEeGdP5YcSqwf';

// Helper function to make API call to recatpcha and check response
function verifyRecaptcha(key, callback) {
  https.get(`https://www.google.com/recaptcha/api/siteverify?secret=${SECRET}&response=${key}`, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk.toString();
    });
    res.on('end', () => {
      try {
        const parsedData = JSON.parse(data);
        callback(parsedData.success);
      } catch (e) {
        callback(false);
      }
    });
  });
}


function checkIfUserIsOwner(user, loanId) {
  for (let i = 0; i < user.uploads.length; i++) {
    if (user.uploads[i] === loanId) {
      return true;
    }
  }
  return false;
}

function last_upload(array) {
  const len = array.length;
  let most_recent_date = new Date(0);
  for (let i = 0; i < len; i++) {
    if (array[i].time.getTime() > most_recent_date.getTime()) {
      most_recent_date = array[i].time;
    }
  }
  return most_recent_date;
}

function getIP(req) {
  let headers = '';
  let remoteAddress = '';
  let socket = '';
  let conRemoteAddress = '';
  if (typeof req.headers['x-forwarded-for'] !== 'undefined') {
    headers = req.headers['x-forwarded-for'].split(',').pop();
  }
  if (typeof req.connection.remoteAddress !== 'undefined') {
    remoteAddress = req.connection.remoteAddress;
  }
  if (typeof req.socket.remoteAddress !== 'undefined') {
    socket = req.socket.remoteAddress;
  }
  if (typeof req.connection.socket !== 'undefined') {
    if (typeof req.connection.socket.remoteAddress !== 'undefined') {
      conRemoteAddress = req.connection.socket.remoteAddress;
    }
  }
  if ((headers || remoteAddress || socket || conRemoteAddress) === '::1') {
    return '69.74.60.146';
  }
  return headers || remoteAddress || socket || conRemoteAddress;
}
