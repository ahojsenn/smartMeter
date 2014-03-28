#!/usr/bin/env node
/*jslint node: true */
/*
 	Johannes Mainusch, 2014-02-25
	the Data Simulator is now in this seperate file...
*/
var global = require ('../global/global.js').init("from smartMEtersimulator");


/*
 * a random data generator which may be used in dev-mode
 *
 */
function simulator () {
	// set timer intervall
	var exec = require('child_process').exec;

	this.writeSimulatedData = function (timeIntervall) {
		var watt=Math.round(86400/(75*timeIntervall/1000)),
			cmd = "echo {'\"'test1'\"' : '\"'simulatedData'\"', '\"'Watt'\"' : "+watt+", '\"'timestamp'\"': `date +%s000`} >> "+ global.datafilename;
		global.log('  createRandomData created 1/75 KW/h after '+ timeIntervall/1000 + 's. Watt= ' + watt);
		global.log('  logged it to: '+ global.datafilename);
		exec (cmd);
	}

	// create an entry in the datafile at random time between 0-10s intervalls
	this.createRandomData = function  () {
		var randomTime = Math.round(1000*Math.random()), // something between 0 and 10 seconds
			objref = this;
		global.log ("in createRandomData...");

		setTimeout(function () {
			objref.writeSimulatedData (randomTime);
			objref.createRandomData();
		}, randomTime);
	};
}


global.log ("starting simulator...");
var mysimulator = new simulator ();
mysimulator.createRandomData();





