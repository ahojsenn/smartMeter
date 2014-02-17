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
var events = require('events'),
	eventEmitter = new events.EventEmitter;

var smarty = {
	timers: require('timers'),
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
	powerConsumption: powerConsumption,
	log: function (data) {
		if (this.debug) {
			console.log(data);
		}
		return this;
	}
}
	
util = require('util');
console.log('START');
console.log(util.inspect(smarty.eventEmitter, { showHidden: true, depth: null }));


module.exports = smarty;

/*
 * initialize function for the smarty 
 */
function smarty_Init () {
	var objref = this,
		params = require ('./smartMeter.json'),
		fs =  require('fs');

	// Simple constructor, links all parameters in params object to >>this<<
	if (params && Object.keys && Object.keys(params).length >= 1) {
		smarty.log ("initializing this smarty with params");
		Object.keys(params).forEach( function(param) {
			objref[param] = params[param];
			smarty.log ("setting this."+param+"="+ params[param]);
		})
	}

	if (process.platform == 'darwin') {
			this.logPath = "/tmp/"+this.logPath;
		}

	// create logPath and logFile if it does not exist
	if (!fs.existsSync(this.logPath)) {
		fs.mkdirSync(this.logPath);
	}
	if (!fs.existsSync(this.logPath + this.logFile)) {
		fs.openSync(this.logPath+this.logFile, 'a');
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
	if (process.platform == 'darwin') {
		this.gpio_path="/tmp/gpio/"
		commands = [
			"clear",
			"rm -rf " + this.gpio_path,
			"mkdir -p " + this.gpio_path+"gpio"+this.gpio_input_pin,
			"ls -al " + this.gpio_path+"gpio"+this.gpio_input_pin,
			"touch " + this.gpio_path+"gpio"+this.gpio_input_pin+"/direction",
			"ls -al " + this.gpio_path+"gpio"+this.gpio_input_pin,
			"echo 'in' > " + this.gpio_path+"gpio"+this.gpio_input_pin+"/direction",
			"cat " + this.gpio_path+"gpio"+this.gpio_input_pin+"/direction",
			"echo 0 > " + this.gpio_path+"gpio"+this.gpio_input_pin+"/value",
			"cat " + this.gpio_path+"gpio"+this.gpio_input_pin+"/value",
			"date; echo done"
			];			
	}
	else
		commands = [
			"echo "+this.gpio_input_pin+" > /sys/class/gpio/unexport",
			"echo "+this.gpio_input_pin+" > /sys/class/gpio/export",
			"echo 'in' > " + this.gpio_path+"gpio"+this.gpio_input_pin+"/direction",
			"date; echo done"
			];

	// daisy chaining the commands to set up the gpio
	( function execCmdInADaisyChain (commands, cmdNr) {
		if (commands.length > ++cmdNr) {
			exec ( commands[cmdNr], function (error, stdout, stderr) { 
				smarty.log ("Step " +cmdNr+": executing: " + commands[cmdNr]);
				smarty.log('stdout: ' + stdout);
    			smarty.log('stderr: ' + stderr);
    			if (error !== null) {
      				console.log('exec error: ' + error);
      			}
				execCmdInADaisyChain (commands, cmdNr);
			});
		}
		else {
			/* start the smarty */
			smarty.log('I think setup is done, emitting '+emitEventWhenFinished+' event...');
			smarty.eventEmitter.emit(emitEventWhenFinished);
		}
	})(commands, cmdNr);

	return this; 
}


//
// reads the inpup of the GPIO by polling
// since I didn't get the onchange to run...
//
function smarty_startReader() {
	var fs = require('fs');

	fs.readFile (smarty.gpio_path+'gpio'+smarty.gpio_input_pin+'/value', function(err, inputValue) {
		if(err) {
	        console.log(err);
	    } else {
			if (smarty.lastValue+0 != inputValue+0) {
	        	smarty.log('gpio_input_pin was '+smarty.lastValue+' and changed to: ' + inputValue +': now=' + new Date().getTime());
				smarty.lastValue = inputValue;
				var timestamp = new Date().getTime(),
					message = "";
				message += '{';
				message += '"term":"v39.powerConsumption.'+ smarty.gpio_input_pin+'"'
				message += ', "Watt":'+powerConsumption (timestamp, smarty.secondLastTimestamp, inputValue);
				message += ', "timestamp":' + timestamp;
				message += '}';
			
				smarty.eventEmitter.emit('pinChange', message);

				smarty.secondLastTimestamp = smarty.lastTimestamp;
				smarty.lastTimestamp = timestamp;
			}
		}
	});
		
	smarty.timers.setTimeout (smarty_startReader, smarty.polling_intervall);
	return this;
}


function smarty_writeLog (message) {
	var	fs = require('fs');
    
	//Now make sure, the values are logged somewhere, namely in logFile...
	fs.appendFile (smarty.logPath+smarty.logFile,  message +'\n', function(err) {
	    if(err) {
	        console.log(err);
	    } else {
	        smarty.log(smarty.logPath+smarty.logFile + " was appended: " + message);
		}
	});
}


//
// a function to calculate ower consumption of my power meter...
//
function powerConsumption (t1, t2, inputValue) {
	var myWatt = 1,  // set myWatt to 1 rather than 0, that will allow me to have a log scale later...
		UmdrehungenProh = 1000 * 60 * 60 / (t1 - t2);
	
	if (t2 > 0 )
		myWatt = 1000* UmdrehungenProh / smarty.UmdrehungenProKWh ;
	
	smarty.log("in powerConsumption (" 
		+ (t1-t2)/1000 +"s passed, "+ inputValue + "), "
		+"UmdrehungenProh="+Math.round(1000*UmdrehungenProh)/1000 +", "
		+"Watt="+myWatt);
	return myWatt;
}


/*
 * a random data generator which may be used in dev-mode
 *
 */
function simulator () {
	// set timer intervall
	var exec = require('child_process').exec;

	// create an entry in the datafile at random time between 0-10s intervalls
	this.createRandomData = function  () {
		var randomTime = Math.round(1000*Math.random()), // something between 0 and 10 seconds
			objref = this;

		setTimeout(function () {
			var watt=Math.round(86400/(75*randomTime/1000)),
				cmd = "echo {'\"'test1'\"' : '\"'huhuh'\"', '\"'Watt'\"' : "+watt+", '\"'timestamp'\"': `date +%s000`} >> "+ smarty.logPath+smarty.logFile;
			console.log('createRandomData created 1/75 KW/h after '+ randomTime/1000 + 's. Watt= ' + watt);
			exec (cmd);
			objref.createRandomData();
		}, randomTime);
	};
}

// in dev mode I will start a process that fills the 
// data file in n seconds intervall to test the Web-Socket...
function start_testmode (callback) {
	console.log('start_testmode');
	var mysimulator = new simulator ();
	mysimulator.createRandomData();

	if (typeof callback == 'function') { // make sure the callback is a function
        callback.call(this); // brings the scope to the callback
    }
	return this;
}






/*
 * The main bit... smarty is a nice name for smatrmeter...
 */
smarty
	.log("\u001b[2J\u001b[0;0H") /* clear sonsole log screen */ 
	.init ()
	.setupGPIO ('readyForMeasurement');
	//
	// register an event 'pinChange' and an event on initDone
	//
smarty.eventEmitter.on('readyForMeasurement', smarty.startReader);
smarty.eventEmitter.on('pinChange', smarty.writeLog);

// start test mode on darwin systems, i.e. this is now not a rpi...
if (process.platform == 'darwin') {
	smarty.eventEmitter.on('readyForMeasurement', start_testmode );
}




