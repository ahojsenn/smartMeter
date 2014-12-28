var assert = require("assert"),
	global = require ("../../main/global/global.js").init("Test"),
	smr = require ("../../main/meter/smartMeter.js"),
	simulator,
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
		for (var i=0; i<global.gpio_input_pin; i++ ) {
			console.log (global.gpio_input_pin[i]	);
			assert(global.gpio_input_pin[i]>0);
		}
	})

	/* datafile is there */
	it ('should have datafilename ', function () {
		assert (fs.existsSync(global.datafilename));
	})

	/* GPIO is set up */
	it ('should create gpio device at **/direction', function () {
		for (var i=0; i<global.gpio_input_pin; i++ ) {
			assert (
			fs.existsSync(global.gpio_path+"gpio"+global.gpio_input_pin+"/direction")
		);
			assert.equal (
				fs.readFileSync(global.gpio_path+"gpio"+global.gpio_input_pin+"/direction")
				, "in\n");
		}
	})

	/* it should calculate correct Watts */
	it ('should calculate correct Watts', function () {
		assert (smr.powerConsumption (6834,0, 1) > 0);
	})

})