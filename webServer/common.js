Common = {
  	DEBUG: true,
	mode: 'prod',
	exitEventString: 'close',
<<<<<<< HEAD
	datafilename : '/home/pi/production/meter_eenergy/data/gotResults.json',
=======
	datafilename : '/home/pi/production/smartMeter/data/gotResults.json',
>>>>>>> 0a33f59c605aa3eccc90a0d9982c1fae2aa198b2
	logdebug: function logdebug (mystring) { if (Common.DEBUG==true) console.log(mystring); }
};

module.exports = Common;
