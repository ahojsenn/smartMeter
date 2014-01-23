var assert = require("assert"),
	smr = require ("../smartMeter.js"),
	fs = require("fs");
	
/* init the smartMeter */ 
before(function(done){
	// wait for the smr initialization to be done...
	eventEmitter.on('readyForMeasurement', function() {
		done();
	});
})

describe ('smartMeter', function () {	
	
	/* init */
	it ('should  init() without error', function (done){
		assert.equal (smr.gpio_input_pin, 3);
		done();
	})

	/* logfile is there */
	it ('should create logfile ', function (done) {
		assert (fs.existsSync(smr.logPath + smr.logFile));
		done();
	})

	/* GPIO is set up */
	it ('should create gpio device at **/direction', function (done) {
		assert (
			fs.existsSync(smr.gpio_path+"gpio"+smr.gpio_input_pin+"/direction")
		);
		done();
	})

	/* it should calculate correct Watts */
	it ('should calculate correct Watts', function () {
		assert.equal (smr.powerConsumption (0, 6834, 1), -7023.705004389815);
	})

})