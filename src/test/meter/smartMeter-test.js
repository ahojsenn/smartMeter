var assert = require("assert"),
	smr = require ("../../main/meter/smartMeter.js"),
	simulator,
	global = require ("../../main/global/global.js"),
	fs = require("fs")
	;


/* init the smartMeter */ 
before(function(done){
	this.timeout(5000);
	global.datafilename = "/tmp/testData.json";
	// wait for the smr initialization to be done...
	global.eE.on('readyForMeasurement', function() {
		simulator = require ("../../main/meter/smartMeterSimulator.js");
		done();
	});
})

describe ('smartMeter', function () {	
	
	/* init */
	it ('should init() without error', function (){
		console.log (smr.gpio_input_pin	);
		assert(smr.gpio_input_pin>0);
	})

	/* datafile is there */
	it ('should have datafilename ', function () {
		assert (fs.existsSync(global.datafilename));
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