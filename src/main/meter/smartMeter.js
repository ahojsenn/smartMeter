#!/usr/bin/env node
/*jslint node: true */
/*
 	Johannes Mainusch, 2013-02-26
 	The purpose of this programm is to support my energy meter reader by recording ttimestamps,
	whenever the reader notices the red mark on my energy meter. This happens every 1/75 KW/hour.

	The connected hardware consists of a prhototransistor, an IR-LED and a Schmitt-Trigger which fires
	on (infrared) light in the prototransistor.

	The signal input on the raspberry is GPIO PIN gpioInputPin, the polling intervall is defined by
	polling_intervall.

	The resuting timestamps are logges in the logfile...

*/
var global = global || require ('../global/global.js').init("from smartMeter"),
	setupGPIO = require ('./setupGPIO.js'),
	DataBase =  require ("../../main/dataBase/dataBase.js"),
	dataBase = new DataBase ({"dataFileName" : global.datafilename});

var smartMeter = function () {
		objref = this;
		this.init = function (i) {
			objref.gpioInputPin = global.measurements[i].gpioInputPin;
			objref.gpioIdentifier = global.measurements[i].gpioIdentifier;
			objref.gpioSimulatorTimeout = global.measurements[i].gpioSimulatorTimeout;
			objref.UmdrehungenProKWh = global.measurements[i].UmdrehungenProKWh;
			objref.EuroCentProKWh = global.measurements[i].EuroCentProKWh;
			objref.pollingIntervall = global.measurements[i].polling_intervall;
			return objref;
		};
		this.lastValue = "start";
		this.lastTimestamp = 0;
		this.secondLastTimestamp = 0;
		return this;
	},
	measurements = new Array();

//
// a function to calculate ower consumption of my power meter...
// t1 and t2 are timestamps...
//
smartMeter.prototype.powerConsumption = function (t1, t2, UmdrehungenProKWh) {
	var myWatt 		= 1,  // set myWatt to 1 rather than 0, that will allow me to have a log scale later...
		pulseProh 	= 3600000 / (t1 - t2);
	if (t2 > 0 ) {
		myWatt = 1000* pulseProh / UmdrehungenProKWh ;
	}
	return myWatt;
}





//
// reads the inpup of the GPIO by polling
// since I didn't get the onchange to run...
//
smartMeter.prototype.readFromGPIO = function () {
	var fs = require('fs'),
		objref = this;
	fs.readFile (	global.gpio_path+'gpio'+objref.gpioInputPin+'/value',
					function(err, inputValue) {
		if(err) {
	        console.log(err);
	        return err;
	    }
	    // only, if the pin changed
		if (objref.lastValue+0 != inputValue+0 ) {
			var moment = require('moment'),
				now 	= moment(),
				nowISO	= moment().format("YYYY-MM-DDTHH:mm:ss.SSSSZ"),
				watts 	= 0,
				message	= '{';

			watts = objref.powerConsumption	(	now,
												objref.secondLastTimestamp,
												objref.UmdrehungenProKWh );
//			global.log ("in readFromGPIO, observed pin flip..., watts="+watts+", "+now +", "+objref.secondLastTimestamp);
			global.log ("in readFromGPIO, nowISO="+nowISO);
			message += '"timestamp":' +'"'+nowISO+'"';
      // message += ', "now":' +'"'+now+'"';
			message += ', "term":"'+global.location+'.'+ objref.gpioIdentifier+'"';
			message += ', "Watt":'+watts;
			message += '}';

			// only trigger to log stuff,
			// if there is a significant power consumption,
			// i.e. not at startup or reboot time
			if (watts > 1) {
//				global.log ("in readFromGPIO, writing data...");
				dataBase.streamString(message+'\n').pipe(dataBase.appendDB());
			}
			objref.lastValue 			= inputValue;
			objref.secondLastTimestamp 	= objref.lastTimestamp;
			objref.lastTimestamp 		= now;
		}
		// wait some time and them read the file again...
		global.timers.setTimeout (
			function () { objref.readFromGPIO() },
			objref.pollingIntervall
		);
	});
	return objref;
}


module.exports = smartMeter;

/*
 * The main bit...
 */
setupGPIO ('readyForMeasurement');

/*
 * after setup, i.e. .on('readyForMeasurement', I will start one
 * smartmeter per configured measurement in globalParameters*.json
 */
global.eventEmitter
	.on('readyForMeasurement', function () {
		/*
		 * loop through the configured input pins
 		 */
		for (var i in global.measurements) {
			var sm =  new smartMeter();
			sm.init(i);
			measurements.push (sm);
//			global.log ("starting the smartmeter on pin="+sm.gpioInputPin);
//			global.log ("                             i="+i);
//			global.log ("           with gpioIdentifier="+sm.gpioIdentifier);
			sm.readFromGPIO ();
		}
	});
/* The End */