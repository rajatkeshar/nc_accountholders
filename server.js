const mongoose = require('mongoose');
const moment = require('moment');
const CronJob = require('cron').CronJob;
const httpCall = require('./lib/httpCall');
const appLoader = require('./appLoader');
const constants = require('./config/config.json');

const mongoDB = 'mongodb://127.0.0.1/addressDetails';
mongoose.connect(mongoDB, { useNewUrlParser: true });
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

require('./models/AcHolders');
const AcHolders = mongoose.model("AcHolders");

var url = 'https://ethplorer.io/service/service.php?refresh=holders&data=0x809826cceAb68c387726af962713b64Cb5Cb3CCA&page=tab%3Dtab-holders%26pageSize%3D100%26holders%3D';

async function manipulateData(counter, date) {
	console.log(date);
    try {
        var info = await httpCall.call("GET", url + counter);
        if(info && info.holders && Array.isArray(info.holders)) {
            info.holders.forEach(async function(obj, index) {
            	var details = {
                    address:obj.address,
						data: [{
								date:date,
								balance: obj.balance/1000000000000000000,
								share: obj.share
						}]
                };
				var res = await AcHolders.findOne({ address: details.address });
				if(res && Array.isArray(res.data)) {
					details.data.push(...res.data);
				}
				var query = { address: details.address };
				var cond = { upsert: true, new: true, runValidators: true }
				AcHolders.findOneAndUpdate( query, details, cond, function (err, doc) {
                    if (err) {
                        console.log("err: ", err);
                    } else {
                        //console.log("doc inserted successfully: ", doc);
                	}
				});
        	});
        } else {
            console.log("info: ", info);
    	}
    } catch (e) {
        console.log("Caught Exeptions: ", e);
    }
}

async function start(counter, date) {
	console.log("Current counter value: ", counter);
	if(counter < constants.TOTAL_PAGE){
    	await (function() {
			setTimeout(async function(){
				await manipulateData(++counter, date);
	      		await start(counter, date);
	    	}, 5000);
		})();
  	} else {
		setTimeout(function() {
			console.log("Data Extraction Is Done!!, Calling CSV Loader...");
			appLoader.csvLoader(new Date());
		}, 3000);
	}
}

const job = new CronJob('00 00 05 * * *', function() {
	console.log('Started Cron At:', new Date());
	date = moment().format("MMM Do YYYY");
	start(0, date);
});
job.start();
