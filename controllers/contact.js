const sgMail = require('@sendgrid/mail');
const {check, validationResult} = require('express-validator/check');
const xssFilters = require('xss-filters');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * GET /contact
 * Contact form page.
 */
exports.getContact = (req, res) => {
  res.render('contact', {
    title: 'Contact',
  });
};

/**
 * POST /contact
 * Send a contact form via Nodemailer.
 */
exports.checkValues = [
  check('name', 'Name cannot be blank').exists({checkFalsy: true}),
  check('email', 'Email is not valid').isEmail(),
  check('message', 'Message cannot be blank').exists({checkFalsy: true}),
];


exports.postContact = (req, res) => {
  const errors = validationResult(req).mapped();
  if (Object.getOwnPropertyNames(errors).length) {
    const prop = Object.getOwnPropertyNames(errors); // get list of objects in error response
    req.flash('errors', errors[prop[0]]); // access property name with [x] notation
    return res.redirect('/contact');
  }
  req.body.name = xssFilters.inHTMLData(req.body.name);
  req.body.email = xssFilters.inHTMLData(req.body.email);
  req.body.message = xssFilters.inHTMLData(req.message.name);
  const msg = {
    to: process.env.CONTACT_EMAIL,
    from: `${req.body.name} <${req.body.email}>`,
    subject: 'Contact Form | Plant Share',
    html: req.body.message,
  };
  sgMail.send(msg, (error) => {
    if (error) {
      req.flash('errors', {msg: error.message});
      return res.redirect('/contact');
    }

    req.flash('success', {msg: 'Email has been sent successfully!'});
    res.redirect('/contact');
  });
  //   });
};
