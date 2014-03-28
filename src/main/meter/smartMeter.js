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
var global = require ('../global/global.js').init("from smartMeter");

var smarty = {
	lastValue: "start",
	lastTimestamp: 0,
	secondLastTimestamp: 0,
	eventEmitter: new (require('events').EventEmitter),
	//          diese ^ Klammern versteh ich  nicht  ^
	// util.inspect ansehen

	setupGPIO: require ('./setupGPIO.js'),
	startReader: smarty_startReader,
	writeLog: smarty_writeLog,
	powerConsumption: powerConsumption
}

module.exports = smarty;



//
// reads the inpup of the GPIO by polling
// since I didn't get the onchange to run...
//
function smarty_startReader() {
	var fs = require('fs'),
		date = new Date(),
		timestamp,
		gpioFileName = global.gpio_path+'gpio'+global.gpio_input_pin+'/value',
		message="",
		watts = 0;

	message += '{';
	message += '"term":"'+global.location+'.powerConsumption.'+ global.gpio_input_pin+'"';


	fs.readFile (gpioFileName, function(err, inputValue) {
		if(err) {
	        console.log(err);
	    } else {
			if (smarty.lastValue+0 != inputValue+0 ) {
	        	//global.log('gpio_input_pin was '+smarty.lastValue+' and changed to: ' + inputValue +': now=' + new Date().getTime());
				smarty.lastValue = inputValue;
				timestamp = date.getTime();
				watts = powerConsumption (timestamp, smarty.secondLastTimestamp, inputValue);

				message += ', "Watt":'+watts;
				message += ', "timestamp":' + timestamp;
				message += '}';
			
				// only l trigger to og stuff, if there is a significant power consumption, 
				// i.e. not at startup or reboot time
				if (watts > 1)
					global.eE.emit('pinChange', message);

				smarty.secondLastTimestamp = smarty.lastTimestamp;
				smarty.lastTimestamp = timestamp;
			}
		}
	});
		
	global.timers.setTimeout (smarty_startReader, smarty.polling_intervall);
	return this;
}


function smarty_writeLog (message) {
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
//
function powerConsumption (t1, t2, inputValue) {
	var myWatt = 1,  // set myWatt to 1 rather than 0, that will allow me to have a log scale later...
		UmdrehungenProh = 1000 * 3600	 / (t1 - t2);
	
	if (t2 > 0 )
		myWatt = 1000* UmdrehungenProh / global.UmdrehungenProKWh ;
	
	global.log("in powerConsumption (" 
		+ (t1-t2)/1000 +"s passed, "+ inputValue + "), "
		+"UmdrehungenProh="+Math.round(1000*UmdrehungenProh)/1000 +", "
		+"Watt="+myWatt);
	return myWatt;
}



/*
 * register an event 'pinChange' and an event on initDone
 */
global.eE
		.on('readyForMeasurement', smarty.startReader)
		.on('pinChange', smarty.writeLog)	;

/*
 * The main bit... smarty is a nice name for smatrmeter...
 */
smarty.setupGPIO ('readyForMeasurement')
