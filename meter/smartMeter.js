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
var GLOBAL = {
	debug: true,
	daisyChainNumber: 0,
	log: function (data) {if (this.debug) console.log(data)},
}	

	events = require('events'),
	eventEmitter = new events.EventEmitter()
	;

var smr = {
	timers: require('timers'),
	gpio_input_pin: 3,
	lastValue: "start",
	lastTimestamp: 0,
	secondLastTimestamp: 0,
	
	init: smr_Init,
	setupGPIO: smr_setupGPIO,
	startReader: smr_startReader,
	writeLog: smr_writeLog,
	powerConsumption: powerConsumption
}

/*
 * initialize function for the smr 
 */
function smr_Init (params) {
	var objref = this,
		fs =  require('fs');
		
	// Simple constructor, links all parameters in params object to >>this<<
	if (params && Object.keys && Object.keys(params).length >= 1) {
		GLOBAL.log ("initializing this smr with params");
		Object.keys(params).forEach( function(param) {
			objref[param] = params[param];
			GLOBAL.log ("setting this."+param+"="+ params[param]);
		})
	}

	// create logPath and logFile if it does not exist
	if (process.platform == 'darwin') this.logPath = "/tmp/"+this.logPath;
	if (!fs.existsSync(this.logPath)) {
		fs.mkdirSync(this.logPath);
	}
	if (!fs.existsSync(this.logPath + this.logFile)) {
		fs.openSync(this.logPath+this.logFile, 'a');
	}
	return this; 
}



/*
 * GPIO setup function for the smr
 */
function smr_setupGPIO (emitEventWhenFinished) {
	var exec = require('child_process').exec,
		commands = new Array(),
		cmdNr = 0;

	// create gpio device and moch it on non raspi hardware //
	if (process.platform == 'darwin') {
		this.gpio_path="/tmp/gpio/"
		commands = [
			"clear",
			"rm -rf " + this.gpio_path,
			"mkdir -p " + this.gpio_path+"gpio"+this.gpio_input_pin,
			"ls -al " + this.gpio_path+"gpio"+this.gpio_input_pin,
			"touch " + this.gpio_path+"gpio"+this.gpio_input_pin+"/direction",
			"ls -al " + this.gpio_path+"gpio"+this.gpio_input_pin,
			"echo in > " + this.gpio_path+"gpio"+this.gpio_input_pin+"/direction",
			"cat " + this.gpio_path+"gpio"+this.gpio_input_pin+"/direction",
			"echo 0 > " + this.gpio_path+"gpio"+this.gpio_input_pin+"/value",
			"cat " + this.gpio_path+"gpio"+this.gpio_input_pin+"/value",
			"date; echo done"
			];			
	}
	else
		commands = [
			"touch " + this.gpio_path+"gpio"+this.gpio_input_pin+"/direction",
			"echo in > " + this.gpio_path+"gpio"+this.gpio_input_pin+"/direction",
			"date; echo done"
			];

	// daisy chaining the commands to set up the gpio
	( function execCmdInADaisyChain (commands, cmdNr) {
		if (commands.length > ++cmdNr) {
			exec ( commands[cmdNr], function (error, stdout, stderr) { 
				GLOBAL.log ("Step " +cmdNr+": executing: " + commands[cmdNr]);
				GLOBAL.log('stdout: ' + stdout);
    			GLOBAL.log('stderr: ' + stderr);
    			if (error !== null) {
      				console.log('exec error: ' + error);
      			}
				execCmdInADaisyChain (commands, cmdNr);
			});
		}
		else {
			/* start the smr */
			GLOBAL.log('I think setup is done, emitting '+emitEventWhenFinished+' event...');
			eventEmitter.emit(emitEventWhenFinished);
		}
	})(commands, cmdNr);

	return this; 
}


//
// reads the inpup of the GPIO by polling
// since I didn't get the onchange to run...
//
function smr_startReader() {
	var fs = require('fs');

	fs.readFile (smr.gpio_path+'gpio'+smr.gpio_input_pin+'/value', function(err, inputValue) {
		if(err) {
	        console.log(err);
	    } else {
			if (smr.lastValue+0 != inputValue+0) {
	        	GLOBAL.log('gpio_input_pin was '+smr.lastValue+' and changed to: ' + inputValue +': now=' + new Date().getTime());
				smr.lastValue = inputValue;
				var timestamp = new Date().getTime(),
					message = "";
				message += '{';
				message += '"term":"v39.powerConsumption.'+ smr.gpio_input_pin+'"'
				message += ', "Watt":'+powerConsumption (timestamp, smr.secondLastTimestamp, inputValue);
				message += ', "timestamp":' + timestamp;
				message += '}';
			
				eventEmitter.emit('pinChange', message);

				smr.secondLastTimestamp = smr.lastTimestamp;
				smr.lastTimestamp = timestamp;
			}
		}
	});
		
	smr.timers.setTimeout (smr_startReader, smr.polling_intervall);
	return this;
}


function smr_writeLog (message) {
	var	fs = require('fs');
    
	//Now make sure, the values are logged somewhere, namely in logFile...
	fs.appendFile (smr.logPath+smr.logFile,  message +'\n', function(err) {
	    if(err) {
	        console.log(err);
	    } else {
	        GLOBAL.log(smr.logPath+smr.logFile + " was appended: " + message);
		}
	});
}


//
// a function to calculate ower consumption of my power meter...
//
function powerConsumption (t1, t2, inputValue) {
	var myWatt = 1,  // set myWatt to 1 rather than 0, that will allow me to have a log scale later...
		UmdrehungenProKWh = 75,
		UmdrehungenProh = 1000 * 60 * 60 / (t1 - t2);
	
	if (t2 > 0 )
		myWatt = 1000* UmdrehungenProh / UmdrehungenProKWh ;
	
	GLOBAL.log("in powerConsumption (" 
		+ (t1-t2)/1000 +"s passed, "+ inputValue + "), "
		+"UmdrehungenProh="+Math.round(1000*UmdrehungenProh)/1000 +", "
		+"Watt="+myWatt);
	return myWatt;
}
module.exports = smr;



/*
 * The main bit...
 */
GLOBAL.log("\u001b[2J\u001b[0;0H"); /* clear sonsole log screen */ 

smr
	.init ({
		gpio_path: '/sys/class/gpio/',
		gpio_input_pin: 3,
		polling_intervall: 20,
		logPath: "data/",
		logFile: "gotResults.json"
	})
	.setupGPIO ('readyForMeasurement');


//
// register an event 'pinChange' and an event on initDone
//
eventEmitter.on('readyForMeasurement', smr.startReader);
eventEmitter.on('pinChange', smr.writeLog);




