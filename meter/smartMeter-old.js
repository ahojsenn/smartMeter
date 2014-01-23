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

var SmartMeter = {


}

var fs = require('fs'),
	gpio_input_pin = 3,
	LOG_DEBUG = true,
	gpio_path = '/sys/class/gpio/',
	timers = require('timers'),
	events = require('events'),
	eventEmitter = new events.EventEmitter(),
	polling_intervall = 20,
	lastValue = "start",
	logFile = "data/gotResults.json",
	lastTimestamp = 0,
	secondLastTimestamp = 0,
	LOG_DEBUG = true,
	LOG_WARN = true;

//
// some startup logging on the console...
//
console.log('Startup the meter on pin ' + gpio_input_pin);

//
// GPIO setup
//
console.log ('setting up gpio on gpio_input_pin ' +gpio_input_pin + ' direction in' );

fs.writeFileSync(gpio_path+'export', gpio_input_pin);
console.log ('written \"'+gpio_input_pin+'\" to '+gpio_path+'export');

fs.writeFileSync(gpio_path+'gpio'+gpio_input_pin+'/direction', 'in');
console.log ('written \"in\" to '+gpio_path+'gpio'+gpio_input_pin+'/direction');

readInput();




//
// reads the inpup of the GPIO by polling
// since I didn't get the onchange to run...
//
function readInput() {

    //gpio.read(gpio_input_pin, function(err, inputValue) {
	fs.readFile (gpio_path+'gpio'+gpio_input_pin+'/value', function(err, inputValue) {
		if(err) {
	        console.log(err);
	    } else {
			if (lastValue+0 != inputValue+0) {
	        	if (LOG_DEBUG) console.log('gpio_input_pin was '+lastValue+' and changed to: ' + inputValue +': now=' + new Date().getTime());
				lastValue = inputValue;
				var timestamp = new Date().getTime(),
					message = "";
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
	var myWatt = 1,  // set myWatt to 1 rather than 0, that will allow me to have a log scale later...
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

