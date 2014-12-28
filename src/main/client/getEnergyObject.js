/**
	Johannes Mainusch
	20130329,
	20141203 refactored the renderin into individual functions...
	instanciate an Energy Object, receive data and issue renderTable and plot...
*/

function getEnergyObject() {
	var EnergyObject = this,
		nrOfLines = 1000,
	    gotInitialDataEvent = "gotInitialDataEvent",
	    gotNewDataEvent = "gotNewDataEvent";
	console.log ("in energyObject definition");

	// Simple constructor, adds all key-value pairs in 'params' to EnergyObject
//	if (params && Object.keys && Object.keys(params).length >= 1) {
//		Object.keys(params).forEach(function(param) {
//			EnergyObject[param] = params[param];
//		})
//	}

	// define an event handler for when data was gotten by getData
	// use jquery event registration for this...
	EnergyObject.onGotInitialData = function (callback) {
		$(EnergyObject).on(gotInitialDataEvent, callback )
		return EnergyObject;
		};

	// and one event handler for when new data was sent via the websocket
	// use jquery event registration for this...
	EnergyObject.onGotNewData = function (callback) {
		$(EnergyObject).on(gotNewDataEvent, callback )
		return EnergyObject;
		};


	// I will store the received Data in myData
	// and then I will update whenever I receive new data
	// fragments from the websocket into myData
	this.setMyData = function (d) { this.myData = d; return this; };



	// now get the data for the first time
	this.getData = function (filter) {
		console.log ("in getData, url=", global.url+'/getData?'+'nolines='+nrOfLines+'&filter='+filter );
		$.ajax ({
			url: global.url+'/getData?'+'nolines='+nrOfLines+"&filter="+filter,
			cache : false,
			dataType: 'jsonp',
			crossDomain: true,
			success:
				function (data) { // this little closure will preserve the object reference of this (energyObject)
					console.log ("got called back with data[data.length-1]=", data[data.length-1] );
					EnergyObject.setMyData( data );
					$(EnergyObject).trigger(gotInitialDataEvent);
					return EnergyObject;
				}
		});
		return EnergyObject;
	};

	// and now listen on the websocket...
	this.listenOnWebSocket = function (webSocketDomain, filter) {
		console.log('in listenOnWebSocket', webSocketDomain);
		var socket = io.connect(webSocketDomain);
	  	socket.on('got new data',
	  		function (d) {
	    		console.log('\nWebSocket speaks:',  JSON.stringify(d) );
	  			// only act, if filter critera is met
	  			if (typeof (filter) === 'string' &&
	  				JSON.stringify(d).indexOf(filter) == -1 )
	  				return;
	    		$(EnergyObject).trigger(gotNewDataEvent);
				$('h1').addClass('redFlash');
				$('th').addClass('redFlash');
				setTimeout( "$('h1').removeClass('redFlash');",2000 );
	    		//socket.emit('my other event', { my: 'data' });
				// pop the first array entry and put the new data on the end
				EnergyObject.myData.push(d);
				// shift() removes the first entry of the data array
				// so I only want to do this if I have more than 'nrOfLines' of data...
				if (EnergyObject.myData.length > nrOfLines) EnergyObject.myData.shift();
	  		});
		return EnergyObject;
	};

	return EnergyObject;
}

