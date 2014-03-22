/**
	Johannes Mainusch
	20130329
	instanciate an Energy Object and calculate consumption
*/

function energyObject(params) {
	var objref = this,
	    gotDataEvent = "gotData",
	    $el,
	    mouseDown = 0,
	    UpKWH = 75,
	    scaleFactor = 1;

	console.log ("in energyObject definition");

	// check if mouse is down to lock refresh
	document.body.onmousedown = function() { 
		++mouseDown;
	}
	document.body.onmouseup = function() {
  		--mouseDown;
	}


	// Simple constructor
	if (params && Object.keys && Object.keys(params).length >= 1) {
		Object.keys(params).forEach(function(param) {
			objref[param] = params[param];
		})
	}

	this.summaryTableDiv = "summaryTableDiv1234";
	this.meterPlotDiv = "meterPlotDiv1234";
	this.titleDiv = "titleDiv1234";
	this.UpKWH = UpKWH;
	this.scaleFactor = scaleFactor;

	// Introduce a wrapper div to match jQuery style
	this.$el = $el = $([
		'<div>',
			'<div id="'+this.titleDiv+'"></div>',
			'<div id="'+this.summaryTableDiv+'"></div>',
			'<div id="'+this.meterPlotDiv+'"></div>',
		'</div>'
	].join(' '));

	this.setDomain = function (URL) { this.webSocketDomain = URL; return this; };
	this.setURL = function (URL) { this.URL = URL; return this; };
	this.setMyData = function (d) { this.myData = d; return this; };

	this.listenOnGotDataEvent = function () {
		$(objref).on (gotDataEvent, this.GotDataEventCallback);
		return objref;
	};

	this.GotDataEventCallback = function (event) {
		console.log( 'gotData!!!, #datapoints=' , event);
		this.myTitle (this.title);		
		this.calculate (this.myData);
		this.tableSummary(this.myData);
		plotN (this.myData, this.meterPlotDiv, this.title);

		this.listenOnWebSocket ();

		return this;
	};


	// some more refactoring needed here...

	this.getData = function (nolines) {
		$.ajax ({
			url: this.URL+'/get?'+'nolines='+nolines,
			cache : false,
			dataType: 'jsonp',
			crossDomain: true,
			success:
				function (data) { // this little closure will preserve the object reference of this (energyObject)
					console.log ("got called back with data ...", data[data.length-1] );
					objref.setMyData( data );
					$(objref).trigger( gotDataEvent, [data]);
					return objref;
				}
		});
		return this;
	};

	this.listenOnWebSocket = function () {
		console.log('in listenOnWebSocket', this.webSocketDomain);
		var socket = io.connect(this.webSocketDomain);
	  		socket.on('got new data', function (d) {
	    		console.log('WebSocket speaks:',  d);
				$('h1').addClass('redFlash');
				setTimeout( "$('h1').removeClass('redFlash');",2000 );
	    		//socket.emit('my other event', { my: 'data' });
				// pop the first array entry and put the new data on the end
				objref.myData.push(d);
				objref.myData.shift();
				objref.tableSummary(objref.myData);
				if(!mouseDown) plotN (objref.myData, objref.meterPlotDiv, objref.title);
	  		});
		return this;
	};

	// render some calculation on the data
	this.calculate = function (data) {
		var t1=data[0].timestamp,
		    t2=data[data.length-1].timestamp,
		    watt = data[data.length-1].Watt,
			tdiff = t2 - t1;
		console.log ("in calculate, myobj.mydata.length:" + data.length);
		console.log ("in calculate, Watt:" + watt);
		console.log ("in calculate, mydata:" + new Date (data[0].timestamp));
		console.log ("in calculate, mydata:" + new Date (data[data.length-1].timestamp) );
		console.log ("in calculate, tdiff[s]=" + tdiff/1000);
		console.log ("in calculate, KW/h per day=" + (data.length*scaleFactor/UpKWH) * (86400*1000)/tdiff );
		console.log ("in calculate, KW/h per year=" + 365*(data.length*scaleFactor/UpKWH) * (86400*1000)/tdiff );
		return this;
	};

	// render some calculation on the data
	this.tableSummary = function (data) {
		console.log ("in tableSummary..." + data[0].timestamp );

		var t1 = data[0].timestamp,
				t2 = data[data.length-1].timestamp,
				watt = data[data.length-1].Watt,
				tdiff = t2 - t1;

		// Let's not work on the DOM
		$summaryTable = $('<table id="summaryTable" class="center"/>');

		$summaryTable.append( $('<tr/>')
				.append( $('<td/>').append('selected entries: ') )
				.append( $('<td/>').append(data.length + ", last at: "+new Date (data[data.length-1].timestamp)) )
			)
			.append( $('<tr/>')
				.append( $('<td/>').append('current consumption: ') )
				.append( $('<td/>').append(  Math.round( 100*watt)/100 +" Watt	" ) )
			)
			.append( $('<tr/>')
				.append( $('<td/>').append('KW/h per day: ') )
				.append( $('<td/>').append( Math.round( 100*(data.length*scaleFactor/UpKWH) * (86400*1000)/tdiff) /100) )
			)
			.append( $('<tr/>')
				.append( $('<td/>').append('KW/h per year: ') )
				.append( $('<td/>').append( Math.round( 10*365*(data.length*scaleFactor/UpKWH) * (86400*1000)/tdiff) /10 ) )
			);

		$('#'+this.summaryTableDiv, $el).html($summaryTable);

	};

	// render a title
	this.myTitle = function (title) {
		console.log ("in myTitle..." );

		$myTitle = $('<h1/>')
			.append(title);

		$('#'+this.titleDiv, $el).html($myTitle);
	};


	// call append only once on DOM for better performance
	$('body').append($el);


	return this;
}

