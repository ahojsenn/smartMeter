// setupGPIO
// 20140324: sets up the GPIO for raspberry pi and mocks it for darwin and testpurpose
// Johannes Mainusch
//
var global = require ('../global/global.js'),
	testmode = require ('../global/testmode.js');


function setupGPIO (emitEventWhenFinished, gpioInputPin) {
	var exec = require('child_process').exec,
		commands = new Array(),
		cmdNr = 0;
	global.log ("in setupGPIO...");

	commands = defineSetupCommands(gpioInputPin);
	global.log ("              commands="+commands);


	// daisy chaining the commands to set up the gpio
	( function execCmdInADaisyChain (commands, cmdNr) {
		global.log ("  ... in execCmdInADaisyChain, cmdNr=" + cmdNr + " of" + commands.length);
		if ( cmdNr < commands.length ) {
			exec ( commands[cmdNr], function (error, stdout, stderr) {
				global.log("  Step:   " +cmdNr+": executing: " + commands[cmdNr]);
				global.log("  stdout: " + stdout);
    			global.log("  stderr: " + stderr);
    			if (error !== null) {
      				console.log('exec error: ' + error);
      			}
      			cmdNr++;
      			// recursively myself call with next command...
				execCmdInADaisyChain (commands, cmdNr);
			});
		}
		else {
			/* start the smarty */
			global.log('I think setup is done, emitting '+emitEventWhenFinished+' event...');
			global.eventEmitter.emit(emitEventWhenFinished);
		}
	})(commands, cmdNr);

	return this;
}

//
// function defineSetupCommands
//
function defineSetupCommands (gpioInputPin) {
	var commands = new Array;

	// create gpio devices and mock it on non raspi hardware //
	for (var i=0; i<global.gpio_input_pin.length; i++) {
		gpioInputPin=global.gpio_input_pin[i];
		global.log ("              gpioPin="+gpioInputPin);
	}



	if (process.platform == 'darwin' || testmode.isSwitchedOn() ) {
		global.gpio_path="/tmp/gpio/"
		commands = commands.concat ([
			"clear",
			"rm -rf " + global.gpio_path
			]);
		// create gpio devices and mock it on non raspi hardware //
		for (var i=0; i<global.gpio_input_pin.length; i++) {
			gpioInputPin=global.gpio_input_pin[i];
			global.log ("              gpioPin="+gpioInputPin);
			commands = commands.concat ([
				"mkdir -p " + global.gpio_path+"gpio"+gpioInputPin,
				"ls -al " + global.gpio_path+"gpio"+gpioInputPin,
				"touch " + global.gpio_path+"gpio"+gpioInputPin+"/direction",
				"ls -al " + global.gpio_path+"gpio"+gpioInputPin,
				"echo 'in' > " + global.gpio_path+"gpio"+gpioInputPin+"/direction",
				"cat " + global.gpio_path+"gpio"+gpioInputPin+"/direction",
				"echo 0 > " + global.gpio_path+"gpio"+gpioInputPin+"/value",
				"cat " + global.gpio_path+"gpio"+gpioInputPin+"/value"
				]
			);
		}
		commands = commands.concat ([
			"date; echo done"
			]
		);
	}
	else {
		for (var i=0; i<global.gpio_input_pin.length; i++) {
			gpioInputPin=global.gpio_input_pin[i];
			global.log ("              gpioPin="+gpioInputPin);
			commands = commands.concat ([
				"sudo echo "+gpioInputPin+" > /sys/class/gpio/unexport",
				"sleep 1",
				"sudo echo "+gpioInputPin+" > /sys/class/gpio/export",
				"sleep 1",
				"sudo echo 'in' > " + global.gpio_path+"gpio"+gpioInputPin+"/direction",
				"sleep 1",
				"date; echo done"
				]
			);
		}
	}
	return commands;
}


module.exports = setupGPIO;
