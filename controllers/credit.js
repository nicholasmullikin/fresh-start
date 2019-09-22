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
      }, (err, loans) => {
        res.render('credit/update_credit', {
          title: 'Your Credit',
          array: loans,
          creditImpact: calculateCreditImpact(loans),
          creditScore: user.creditScore
        });
      });
    });

};
function calculateCreditImpact (loans){
  var impacts = [];
  for(var i = 0; i < loans.length; i++){
    let impact = 0;
    if(loans[i].overdue){
      impact = loans[i].amountLoaned/10 * -1;
    }
    else{
      impact = loans[i].amountLoaned / 10;
    }
    impacts.push(impact);
  }
  return impacts;
}

function recalculateCreditImpact (impacts){
  var counter = 20;
  for(var i = 0; i < impacts.length; i++){
    counter +=impacts[i];
  }
  return counter;
}

exports.calcCredit = (req, res) => {
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
      }, (err, loans) => {
        user.creditScore = recalculateCreditImpact(calculateCreditImpact(loans));
        user.save((err)=>{});
      });
    });
  return res.redirect('/credit');
};
