#!/usr/bin/env node
/*jslint node: true */
/*
 	Johannes Mainusch, 2013-02-26
 	The purpose of this programm is to support my energy meter reader by recording ttimestamps,
	whenever the reader notices the red mark on my energy meter. This happens every 1/75 KW/hour.

	The connected hardware consists of a prhototransistor, an IR-LED and a Schmitt-Trigger which fires
	on (infrared) light in the prototransistor.

	The signal input on the raspberry is GPIO PIN gpio_input_pin, the polling intervall is defined by
	polling_intervall.

	The resuting timestamps are logges in the logfile...

*/
var global = require ('../global/global.js').init("from smartMeter"),
	setupGPIO = require ('./setupGPIO.js');

var smartMeter = {

		init: function (i) {
			this.gpioInputPin = global.measurements[i].gpioInputPin;
			this.gpioIdentifier = global.measurements[i].gpioIdentifier;
			this.gpioSimulatorTimeout = global.measurements[i].gpioSimulatorTimeout;
			this.UmdrehungenProKWh = global.measurements[i].UmdrehungenProKWh;
			this.EuroCentProKWh = global.measurements[i].EuroCentProKWh;
			return this;
		},

		lastValue: new Array(),
		lastTimestamp: 0,
		secondLastTimestamp: 0,
		setupGPIO: require ('./setupGPIO.js'),
		readFromGPIO: readFromGPIO,
		powerConsumption: powerConsumption
	},
	measurements = new Array();

module.exports = smartMeter;



//
// reads the inpup of the GPIO by polling
// since I didn't get the onchange to run...
//
function readFromGPIO(i) {
	var fs = require('fs'),
		gpioPin = global.gpio_input_pin[i],
		gpioIdentifier = global.gpioIdentifier[i],
		UmdrehungenProKWh = global.UmdrehungenProKWh[i],
		date = new Date(),
		timestamp,
		gpioFileName = global.gpio_path+'gpio'+gpioPin+'/value',
		message="",
		watts = 0;

	//global.log ("in readFromGPIO("+gpioPin+", "+gpioIdentifier+"), polling interval="+global.polling_intervall+"ms");

	message += '{';
	message += '"term":"'+global.location+'.'+ gpioIdentifier+'"';


// too tired to continue
//here, I have to cater for finding pinchanges on different pins


	fs.readFile (gpioFileName, function(err, inputValue) {
		if(err) {
	        console.log(err);
	    } else {
			if (smartMeter.lastValue[i]+0 != inputValue+0 ) {
	        	//global.log('gpio_input_pin was '+smartMeter.lastValue+' and changed to: ' + inputValue +': now=' + new Date().getTime());
				smartMeter.lastValue[i] = inputValue;
				timestamp = date.getTime();
				watts = powerConsumption (timestamp, smartMeter.secondLastTimestamp, UmdrehungenProKWh);

				message += ', "Watt":'+watts;
				message += ', "timestamp":' + timestamp;
				message += '}';

				// only trigger to log stuff, if there is a significant power consumption,
				// i.e. not at startup or reboot time
				if (watts > 1)
					smartMeter_writeLog (message);

				smartMeter.secondLastTimestamp = smartMeter.lastTimestamp;
				smartMeter.lastTimestamp = timestamp;
			}
		}
	});

	global.timers.setTimeout ( function () {readFromGPIO(i)},
				global.polling_intervall);
	return this;
}


function smartMeter_writeLog (message) {
	var	fs = require('fs');

	//Now make sure, the values are logged somewhere, namely in logFile...
	fs.appendFile (global.datafilename,  message +'\n', function(err) {
	    if(err) {
	        console.log(err);
	    } else {
	        global.log(global.datafilename + " was appended: " + message);
		}
	});
}


//
// a function to calculate ower consumption of my power meter...
// t1 and t2 are timestamps...
//
function powerConsumption (t1, t2, UmdrehungenProKWh) {
	var myWatt = 1,  // set myWatt to 1 rather than 0, that will allow me to have a log scale later...
		UmdrehungenProh = 1000 * 3600	 / (t1 - t2);

	if (t2 > 0 )
		myWatt = 1000* UmdrehungenProh / UmdrehungenProKWh ;

	global.log("in powerConsumption ("
		+ (t1-t2)/1000 +"s passed, "+ UmdrehungenProKWh + "), "
		+"UmdrehungenProh="+Math.round(1000*UmdrehungenProh)/1000 +", "
		+"Watt="+myWatt);
	return myWatt;
}




/*
 * The main bit...
 */
setupGPIO ('readyForMeasurement')

/*
 * register an event 'pinChange' and an event on initDone
 */
global.eventEmitter
	.on('readyForMeasurement',
		function () {
			/*
			 * loop through the configured input pins
 			 */
			for (var i in global.measurements) {
				var sm =  smartMeter.init(i);

				measurements.push (sm);
				global.log ("starting the smartmeter on pin="+sm.gpioInputPin);
				global.log ("           with gpioIdentifier="+sm.gpioIdentifier);
			}

			for (var i=0; i<global.gpio_input_pin.length; i++) {
				global.log ("starting the smartmeter on pin="+global.gpio_input_pin[i]);
				global.log ("           with gpioIdentifier="+global.gpioIdentifier[i]);
				smartMeter.readFromGPIO (i);
			}
		});


