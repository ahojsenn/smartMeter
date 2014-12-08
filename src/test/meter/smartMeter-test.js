var assert = require("assert"),
	global = require ("../../main/global/global.js").init("Test"),
	smr = require ("../../main/meter/smartMeter.js"),
	simulator,
	fs = require("fs"),
  	exec = require('child_process').exec
	;


/* init the smartMeter */
before(function(done){
	this.timeout(20000);
	global.datafilename = "/tmp/testData.json";
	// wait for the smr initialization to be done...
	global.eventEmitter.on('readyForMeasurement', function() {
		simulator = require ("../../main/meter/smartMeterSimulator.js");
		done();
	});
})


describe ('smartMeter', function () {

	/* init */
	it ('should init() without error', function (){
		console.log (global.gpio_input_pin	);
		assert(global.gpio_input_pin>0);
	})

	/* datafile is there */
	it ('should have datafilename ', function () {
		assert (fs.existsSync(global.datafilename));
	})

	/* GPIO is set up */
	it ('should create gpio device at **/direction', function () {
		assert (
			fs.existsSync(global.gpio_path+"gpio"+global.gpio_input_pin+"/direction")
		);
		assert.equal (
			fs.readFileSync(global.gpio_path+"gpio"+global.gpio_input_pin+"/direction")
			, "in\n");
	})

	/* it should calculate correct Watts */
	it ('should calculate correct Watts', function () {
		assert (smr.powerConsumption (6834,0, 1) > 0);
	})

})