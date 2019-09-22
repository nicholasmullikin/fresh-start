const stream = require('stream');
const mongoose = require('mongoose');
const multer = require('multer');
const Jimp = require('jimp');

//const quantity = 20;

var ObjectId = mongoose.Schema.Types.ObjectId;
const loanSchema = new mongoose.Schema({
  loanTitle: String,
  loanDescription: String,
  amountWanted: Number,
  amountLoaned: Number,
  interestRate: Number,
  creditScore: Number,
  waitingForFunding: Boolean,
  waitingForRepayment: Boolean,
  overdue: Boolean,
  failed: Boolean,
  dueDate: Date,
  user: ObjectId,
  contact_info: {
    email: String,
    phone_number: String,
  },
  createdAt: {type: Date, expires: 365 * 24 * 3600, default: Date.now},
}, {timestamps: true});

//loanSchema.index({location: '2dsphere'});
// plantSchema.index({"expireAt": 1}, {expireAfterSeconds: 1});

/**
 * Get all plant info
 */

loanSchema.statics.getAll = function(callback) {
  return this.find(callback);
};

loanSchema.statics.getLoans = function(callback) {
  return this.find({}, callback);
};
loanSchema.statics.getLoansByBame = function(name, callback) {
  return this.find({}, callback);
};

loanSchema.statics.isObjectId = (n) => mongoose.Types.ObjectId.isValid(n);

const Loan = mongoose.model('Loan', loanSchema);
module.exports = Loan;
