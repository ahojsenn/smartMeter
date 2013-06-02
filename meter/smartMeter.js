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
	
	The resuting timestamps are logges in "logfile"

*/



var gpio = require('rpi-gpio'),
	timers = require('timers'),
	events = require('events'),
	eventEmitter = new events.EventEmitter(),
	gpio_input_pin = 3,
	polling_intervall = 20,
	lastValue = "start",
	logFile = "smartMeter.log",
	lastTimestamp = 0,
	secondLastTimestamp = 0,
	LOG_DEBUG = false,
	LOG_WARN = false;

//
// some startup logging on the console...
//
console.log('Startup');


//
// just listen on gpio exports...
//
gpio.on('export', function(channel) {
    console.log('Channel set: '  + channel);
});


//
// GPIO setup
//
gpio.setup(gpio_input_pin, gpio.DIR_IN, readInput );


//
// reads the inpup of the GPIO by polling
// since I didn't get the onchange to run...
//
function readInput() {

    gpio.read(gpio_input_pin, function(err, inputValue) {
		if(err) {
	        console.log(err);
	    } else {
			if (lastValue != inputValue) {
				var timestamp = new Date().getTime(),
					message = "";
	        	if (LOG_DEBUG) console.log('gpio_input_pin changed to: ' + inputValue +': now=' + new Date().getTime());
				message += '{';
				message += '"term":"v39.powerConsumption.'+ gpio_input_pin+'"'
				message += ', "Watt":'+powerConsumption (timestamp, secondLastTimestamp, inputValue);
				message += ', "timestamp":' + timestamp;
				message += '}';
			
				eventEmitter.emit('pinChange', message);

				secondLastTimestamp = lastTimestamp;
				lastTimestamp = timestamp;
			}
		}
		lastValue = inputValue;
	});
		
	timers.setTimeout (readInput, polling_intervall);
}

//
// register an event 'pinChange'
//
eventEmitter.on('pinChange', function(message){
	var	fs = require('fs');
    
	//Now make sure, the values are logged somewhere, namely in logFile...
	fs.appendFile (logFile,  message +'\n', function(err) {
	    if(err) {
	        console.log(err);
	    } else {
	        if (LOG_DEBUG) console.log(logFile + " was appended: " + message);
		}
	});
});


//
// a function to calculate ower consumption of my power meter...
//
function powerConsumption (t1, t2, inputValue) {
	var myWatt = 0,
		UmdrehungenProKWh = 75,
		UmdrehungenProh = 1000 * 60 * 60 / (t1 - t2);
	
	if (t2 > 0 )
		myWatt = 1000* UmdrehungenProh / UmdrehungenProKWh ;
	if (LOG_WARN) 
		console.log("in powerConsumption (" 
			+ (t1-t2)/1000 +"s passed, "+ inputValue + "), "
			+"UmdrehungenProh="+Math.round(1000*UmdrehungenProh)/1000 +", "
			+"Watt="+myWatt);
	return myWatt;
}

