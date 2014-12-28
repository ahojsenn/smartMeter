/**
	Johannes Mainusch
	20141130
	read the globals from url:port/smartMeter/globals.json
*/

function getGlobals(eventName) {
	console.log("\n\n\n\n\n\n\nin getGlobals()...");

	// get the global object from the server
	// it it we'll find things like the name of the energy meter and some specs
	// concerning the number of red flashed per Kw/h and so on...
	$.ajax ({
		url: '/smartMeter/getglobals',
		cache : false,
		dataType: 'jsonp',
		crossDomain: true,
		success:
			function (data) { // this little closure will preserve the object reference of this (energyObject)
				console.log ("got called back with globalData ...", data );
				global = data;
				console.log ("in callback, returning data now..." );
				$(document).trigger(eventName);
				return data;
			}
	});


}

