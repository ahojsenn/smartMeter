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
var global = require ('../global/global.js');

var smarty = {
	lastValue: "start",
	lastTimestamp: 0,
	secondLastTimestamp: 0,
	eventEmitter: new (require('events').EventEmitter),
	//          diese ^ Klammern versteh ich  nicht  ^
	// util.inspect ansehen

	init: smarty_Init,
	setupGPIO: smarty_setupGPIO,
	startReader: smarty_startReader,
	writeLog: smarty_writeLog,
	powerConsumption: powerConsumption
}

module.exports = smarty;

/*
 * initialize function for the smarty 
 */
function smarty_Init () {
	var objref = this,
		params = require ('./smartMeter.json');


	// Simple constructor, links all parameters in params object to >>this<<
	if (params && Object.keys && Object.keys(params).length >= 1) {
		global.log ("initializing this smarty with params");
		Object.keys(params).forEach( function(param) {
			objref[param] = params[param];
			global.log ("setting this."+param+"="+ params[param]);
		})
	}


	return this; 
}



/*
 * GPIO setup function for the smarty
 */
function smarty_setupGPIO (emitEventWhenFinished) {
	var exec = require('child_process').exec,
		commands = new Array(),
		cmdNr = 0;

	// create gpio device and moch it on non raspi hardware //
	global.log ("in smarty_setupGPIO");
	if (process.platform == 'darwin') {
		global.gpio_path="/tmp/gpio/"
		commands = [
			"clear",
			"rm -rf " + global.gpio_path,
			"mkdir -p " + global.gpio_path+"gpio"+global.gpio_input_pin,
			"ls -al " + global.gpio_path+"gpio"+global.gpio_input_pin,
			"touch " + global.gpio_path+"gpio"+global.gpio_input_pin+"/direction",
			"ls -al " + global.gpio_path+"gpio"+global.gpio_input_pin,
			"echo 'in' > " + global.gpio_path+"gpio"+global.gpio_input_pin+"/direction",
			"cat " + global.gpio_path+"gpio"+global.gpio_input_pin+"/direction",
			"echo 0 > " + global.gpio_path+"gpio"+global.gpio_input_pin+"/value",
			"cat " + global.gpio_path+"gpio"+global.gpio_input_pin+"/value",
			"date; echo done"
			];			
	}
	else
		commands = [
			"sudo echo "+global.gpio_input_pin+" > /sys/class/gpio/unexport",
			"sleep 1",
			"sudo echo "+global.gpio_input_pin+" > /sys/class/gpio/export",
			"sleep 1",
			"sudo echo 'in' > " + global.gpio_path+"gpio"+global.gpio_input_pin+"/direction",
			"sleep 1",
			"date; echo done"
			];

	// daisy chaining the commands to set up the gpio
	global.log ("in smarty_setupGPIO, starting the command daisy chain...");
	( function execCmdInADaisyChain (commands, cmdNr) {
		global.log ("  ... in execCmdInADaisyChain..." + cmdNr + " " + commands.length);
		if (commands.length > ++cmdNr) {
			global.log ("  ... " + commands[cmdNr]);
			exec ( commands[cmdNr], function (error, stdout, stderr) { 
				global.log ("  Step " +cmdNr+": executing: " + commands[cmdNr]);
				global.log('  stdout: ' + stdout);
    			global.log('  stderr: ' + stderr);
    			if (error !== null) {
      				console.log('exec error: ' + error);
      			}
				execCmdInADaisyChain (commands, cmdNr);
			});
		}
		else {
			/* start the smarty */
			global.log('I think setup is done, emitting '+emitEventWhenFinished+' event...');
			global.eE.emit(emitEventWhenFinished);
		}
	})(commands, cmdNr);

	return this; 
}


//
// reads the inpup of the GPIO by polling
// since I didn't get the onchange to run...
//
function smarty_startReader() {
	var fs = require('fs'),
		date = new Date(),
		timestamp,
		gpioFileName = smarty.gpio_path+'gpio'+smarty.gpio_input_pin+'/value',
		message="";

	message += '{';
	message += '"term":"v39.powerConsumption.'+ smarty.gpio_input_pin+'"';


	fs.readFile (gpioFileName, function(err, inputValue) {
		if(err) {
	        console.log(err);
	    } else {
			if (smarty.lastValue+0 != inputValue+0 ) {
	        	//global.log('gpio_input_pin was '+smarty.lastValue+' and changed to: ' + inputValue +': now=' + new Date().getTime());
				smarty.lastValue = inputValue;
				timestamp = date.getTime();

				message += ', "Watt":'+powerConsumption (timestamp, smarty.secondLastTimestamp, inputValue);
				message += ', "timestamp":' + timestamp;
				message += '}';
			
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
		myWatt = 1000* UmdrehungenProh / smarty.UmdrehungenProKWh ;
	
	global.log("in powerConsumption (" 
		+ (t1-t2)/1000 +"s passed, "+ inputValue + "), "
		+"UmdrehungenProh="+Math.round(1000*UmdrehungenProh)/1000 +", "
		+"Watt="+myWatt);
	return myWatt;
}


/*
 * The main bit... smarty is a nice name for smatrmeter...
 */
smarty
	.init ()
	.setupGPIO ('readyForMeasurement')

	//
	// register an event 'pinChange' and an event on initDone
	//
global.eE
		.on('readyForMeasurement', smarty.startReader)
		.on('pinChange', smarty.writeLog)	;






