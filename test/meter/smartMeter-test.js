var assert = require("assert"),
	smr = require ("../../meter/smartMeter.js"),
	simulator = require ("../../meter/smartMeterSimulator.js"),
	global = require ("../../meter/global.js"),
	fs = require("fs")
	;
	
/* init the smartMeter */ 
before(function(done){
	// wait for the smr initialization to be done...
	global.eventEmitter.on('readyForMeasurement', function() {
		done();
	});
})

describe ('smartMeter', function () {	
	
	/* init */
	it ('should  init() without error', function (){
		assert(smr.gpio_input_pin>0);
	})

	/* logfile is there */
	it ('should create logfile ', function () {
		assert (fs.existsSync(smr.datafilename));
	})

	/* GPIO is set up */
	it ('should create gpio device at **/direction', function () {
		assert (
			fs.existsSync(smr.gpio_path+"gpio"+smr.gpio_input_pin+"/direction")
		);
		assert.equal (
			fs.readFileSync(smr.gpio_path+"gpio"+smr.gpio_input_pin+"/direction")
			, "in\n");
	})

	/* it should calculate correct Watts */
	it ('should calculate correct Watts', function () {
		assert.equal (smr.powerConsumption (0, 6834, 1), -7023.705004389815);
	})

})