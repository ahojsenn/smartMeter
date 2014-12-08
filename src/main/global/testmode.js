// ...sets a file called testmode and implements a check if mode is testmode
// 20140328
// Johannes Mainusch
//

var testSemaphoreFileName = '/tmp/smartMeterTestModeIsOn',
	fs = require("fs");

var testmode = {
	setOn: function (callback) {
		fs.writeFileSync(testSemaphoreFileName, '');
		return (typeof callback == 'undefined') ? this : callback ();
	},
	setOff: function (callback) {
		fs.unlinkSync(testSemaphoreFileName);
		return (typeof callback == 'undefined') ? this : callback ();
	},
	isSwitchedOn: function () {
		return fs.existsSync(testSemaphoreFileName);
	}
}

module.exports = testmode;