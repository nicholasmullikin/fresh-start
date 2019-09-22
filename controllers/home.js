const Loan = require('../models/Loan');

/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
  res.render('home', {
    title: 'Home',
  });
};


/**
 * GET /info
 * info page.
 */
exports.info = (req, res) => {
  res.render('info', {
    title: 'Home',
  });
};

/**
 * GET /fund
 * stages of loan.
 */
exports.fund = (req, res) => {
  res.render('fund', {
    title: 'fund',
  });
};

/**
 * GET /api/plants
 * Plants that are in range
 */
exports.getPlantsInRange = (req, res) => {
  const results_to_send = {};

  Loan.getLoans((err, result) => {
    if (err) {
      console.log(err);
      return res.status(402);
    }
    if (result !== undefined) {
      for (let i = 0; i < result.length; i++) {
        results_to_send[i] = {
          loanTitle: result[i].loanTitle,
          loanDescription: result[i].loanDescription,
          page: `/loan/view/${result[i]._id}`,
        };
      }
      return res.status(250).send(results_to_send);
    }

  });
  return res.status(403);
};


function isFloat(n) {
  return n !== '' && !isNaN(n) && Math.round(n) !== n;
}
