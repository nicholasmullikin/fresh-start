const Loan = require('../models/Loan');
const User = require('../models/User');

/**
 * GET /credit
 * Login page.
 */
exports.getCredit = (req, res) => {
  if (!req.user) {
    return res.redirect('/');
  }
  User.findById(req.user._id, (err) => {
    if (err) {
      console.log(err);
    }
  })
    .then((user) => {
      Loan.find({
        user: req.user._id,
      }, (err, loans) => res.render('loan/postings', {
        title: 'Your Postings',
        array: loans,
      }));
    });

};

