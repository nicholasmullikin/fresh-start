const paypal = require('paypal-rest-sdk');

paypal.configure({
  mode: 'sandbox', // Sandbox or live
  client_id: 'ARFf3TQDEIx_S9dqkYgKe2FbZvfMyxKHIWcynO55g14Cq7Iw869uYHaEuqfpM79FdEIOQMFab0sNprx-',
  client_secret: 'EJiNfrGUz-18WVOtzkj0-su3R8FWejhXVXEybfHVO8SvHD6r8CEkiL5hAyvLR20e5kzbpZhliBf2-ZSy'});


exports.makePaymentJSON = (amount, paymentString, req) =>
{
  const payReq = JSON.stringify({
    intent: 'sale',
    payer: {
      payment_method: 'paypal'
    },
    redirect_urls: {
      return_url: req.protocol + '://' + req.get('host') +'/process',
      cancel_url: req.protocol + '://' + req.get('host') +'/cancel'
    },
    transactions: [{
      amount: {
        total: amount.toString(),
        currency: 'USD'
      },
      description: paymentString.toString()
    }]
  });
  return payReq;
};

exports.makePayment = (payJSON, callback) => {
  paypal.payment.create(payJSON, function(error, payment){
    var links = {};

    if(error){
      console.error(JSON.stringify(error));
    } else {
      // Capture HATEOAS links
      payment.links.forEach(function(linkObj){
        links[linkObj.rel] = {
          href: linkObj.href,
          method: linkObj.method
        };
      });

      // If the redirect URL is present, redirect the customer to that URL
      if (links.hasOwnProperty('approval_url')){
        callback(links['approval_url'].href);
      } else {
        console.error('no redirect URI present');
        callback(null);
      }
    }
  });
};

exports.completePayment = (paymentId, payerId, callback) => {
  paypal.payment.execute(paymentId, payerId, function (error, payment) {
    if (error) {
      console.error(JSON.stringify(error));
    } else {
      callback(error, payment);
    }
  });
};

