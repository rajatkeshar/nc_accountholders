const request = require('request');
const mongoose = require('mongoose');
const mailer = require('./lib/mailer')();
const constants = require('./config/config.json');

const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const fileName = new Date() + '.csv';
const filePath = `collection/${fileName}`;

const csvWriter = createCsvWriter({
  path: filePath,
  header: [
    {id: 'address', title: 'Address'},
    {id: 'balance', title: 'Balance'},
    {id: 'share', title: 'Share'}
  ]
});

var mongoDB = 'mongodb://127.0.0.1/addressDetails';
mongoose.connect(mongoDB, { useNewUrlParser: true });
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection

var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

require('./models/AcHolders');
const AcHolders = mongoose.model("AcHolders");

module.exports = {
  csvLoader: function () {
    AcHolders.find((err, docs) => {
      csvWriter
      .writeRecords(docs)
      .then(()=> {
        console.log('The CSV file was written successfully');
        const email = constants.EMAIL;
        const subject = constants.SUBJECT;
        const messBody = constants.MESSAGE_BODY;
        attachments = [{ 'filename': fileName, 'path': filePath, 'cid': 'csv' }];
        mailer.sendEmail(email, subject, messBody, attachments, function(info) {
            console.log(info);
        });
      });
    })
  }
}
