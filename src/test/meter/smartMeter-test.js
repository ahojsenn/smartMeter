var assert = require("assert"),
	global = require ("../../main/global/global.js").init("Test"),
	smartMeter = require ("../../main/meter/smartMeter.js"),
	simulator,
	measurements = new Array(),
	fs = require("fs"),
  	exec = require('child_process').exec
	;


/* init the smartMeter */
before(function(done){
	this.timeout(12042);
//	global.datafilename = "/tmp/testData.json";
	// wait for the smr initialization to be done...
	global.eventEmitter.on('readyForMeasurement', function() {
		simulator = require ("../../main/meter/smartMeterSimulator.js");

		done();
	});
})


describe ('smartMeter', function () {

	/* init */
	it ('should init() without error', function (){
		for (var i in global.measurements ) {
			console.log (global.measurements[i].gpioInputPin	);
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