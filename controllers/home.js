const Loan = require('../models/Loan');
const User = require('../models/User');
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
    title: 'Info',
  });
};

/**
 * GET /invest
 * invest page.
 */
exports.invest = (req, res) => {
    res.render('invest', {
        title: 'invest',
    });
};





/*
 * GET /api/plants
 * Plants that are in range
 */
exports.getPlantsInRange = (req, res) => {
  const results_to_send = [];
  var name = req.query.name;
  Loan.find({
    },
  (err, result) => {
    if (err) {
      console.log(err);
      return res.status(402);
    }
    if (result !== undefined) {
      if(name.length > 0) {
        var reg = new RegExp(name, "gi");
        for (let i = 0; i < result.length; i++) {
          if (result[i].waitingForFunding && (reg.test(result[i].loanTitle) || reg.test(result[i].loanDescription))) {
            results_to_send.push({
              loanTitle: result[i].loanTitle,
              loanDescription: result[i].loanDescription,
              amountWanted: result[i].amountWanted,
              amountLoaned: result[i].amountLoaned,
              interestRate: result[i].interestRate,
              page: `/loan/view/${result[i]._id}`,
            });
          }
        }
      }
      else {
        for (let i = 0; i < result.length; i++) {
          if (result[i].waitingForFunding) {
            results_to_send.push({
              loanTitle: result[i].loanTitle,
              loanDescription: result[i].loanDescription,
              amountWanted: result[i].amountWanted,
              amountLoaned: result[i].amountLoaned,
              interestRate: result[i].interestRate,
              page: `/loan/view/${result[i]._id}`,
            });
          }
        }
      }
      return res.status(250).send(results_to_send);
    }

  });

};


function isFloat(n) {
  return n !== '' && !isNaN(n) && Math.round(n) !== n;
}
