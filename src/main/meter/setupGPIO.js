// setupGPIO
// 20140324: sets up the GPIO for raspberry pi and mocks it for darwin and testpurpose
// Johannes Mainusch
//
var global = require ('../global/global.js'),
	testmode = require ('../global/testmode.js');


function setupGPIO (emitEventWhenFinished) {
	var exec = require('child_process').exec,
		commands = new Array(),
		cmdNr = 0;

	// create gpio device and moch it on non raspi hardware //
	global.log ("in smarty_setupGPIO");
	if (process.platform == 'darwin' || testmode.isSwitchedOn() ) {
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

module.exports = setupGPIO;
