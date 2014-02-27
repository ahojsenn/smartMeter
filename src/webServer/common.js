Common = {
  	DEBUG: true,
	mode: 'prod',
	serverPort: 42080,
	exitEventString: 'close',
	datafilename : '/home/pi/production/smartMeter/data/gotResults.json',
	logdebug: function logdebug (mystring) { if (Common.DEBUG==true) console.log(mystring); }
};

module.exports = Common;
