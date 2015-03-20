var assert = require("assert"),
	global = global || 	require ("../../main/global/global.js").init("Test"),
	smartMeter = require ("../../main/meter/smartMeter.js"),
	simulators,
	measurements = new Array(),
	fs = require("fs"),
  	exec = require('child_process').exec
	;


/* init the smartMeter */
before(function(done){
	this.timeout(11042);
//	global.datafilename = "/tmp/testData.json";
	// wait for the smr initialization to be done...
	global.eventEmitter.on('readyForMeasurement', function() {
		simulators = require ("../../main/meter/smartMeterSimulator.js");
		done();
	});
})

after (function (done) {
	for (var i in simulators)
		simulators[i].stopSimulator();
	global.log ("Stopped all simulators");
	done ();
})

describe ('smartMeter', function () {
  this.timeout(3542);

	/* init */
	it ('should init() without error', function (){
		for (var i in global.measurements ) {
			assert(global.measurements[i].gpioInputPin>0);
		}
	})

	/* datafile is there */
	it ('should have datafilename ', function () {
		assert (fs.existsSync(global.datafilename));
	})

	/* GPIO is set up */
	it ('should create gpio device at **/direction', function () {
		for (var i in global.measurements ) {
			assert (
			fs.existsSync(global.gpio_path+"gpio"+global.measurements[i].gpioInputPin+"/direction")
		);
			assert.equal (
				fs.readFileSync(global.gpio_path+"gpio"+global.measurements[i].gpioInputPin+"/direction")
				, "in\n");
		}
	})

	/* it should calculate correct Watts */
	it ('should calculate correct Watts', function () {
		var sm = new smartMeter();
		sm.init(0);
		assert (sm.powerConsumption (6834,0, 1) > 0);
	})

})