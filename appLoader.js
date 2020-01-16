const request = require('request');
const mongoose = require('mongoose');
const mailer = require('./lib/mailer')();
const constants = require('./config/config.json');

const createCsvWriter = require('csv-writer').createObjectCsvWriter;

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
  csvLoader: function (date) {
    let fileName = date + '.csv';
    let filePath = `collection/${fileName}`;

    AcHolders.find((err, docs) => {
        var object = [];
        docs.forEach( (obj, index) => {
            var json = {};
            json["address"] = obj.address;
            obj.data.forEach( (data, index) => {
                json[data.date] = data.balance;
            });
            object.push(json);
        });
        var keys = Object.keys(object[0]);
        var headers = [];
        
        for(var i=0; i<keys.length; i++) {
            if(keys[i] == "address") {
                headers.push({id: keys[i], title: keys[i]})
            } else {
                headers.push({id: keys[i], title: "Balance on: " + keys[i]})
            }
        }

        let csvWriter = createCsvWriter({
          path: filePath,
          header: headers
        });

        csvWriter
          .writeRecords(object)
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
    });
  }
}
