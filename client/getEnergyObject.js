/**
	Johannes Mainusch
	20130329
	instanciate an Energy Object and calculate consumption
*/

<<<<<<< HEAD
function energyObject () {
	var objref=this,
		gotDataEvent = "gotData";	
		
	this.summaryTableDiv = "summaryTableDiv1234";
	this.meterPlotDiv = "meterPlotDiv1234";
	$('body').append ('<div id="'+this.summaryTableDiv+'"></div>');
	$('body').append ('<div id="'+this.meterPlotDiv+'"></div>');
=======
function energyObject(params) {
	var objref = this,
	    gotDataEvent = "gotData",
	    $el;

	// Simple constructor
	if (params && Object.keys && Object.keys(params).length >= 1) {
		Object.keys(params).forEach(function(param) {
			objref[param] = params[param];
		})
	}

	this.summaryTableDiv = "summaryTableDiv1234";
	this.meterPlotDiv = "meterPlotDiv1234";

	// Introduce a wrapper div to match jQuery style
	this.$el = $el = $([
		'<div>',
			'<div id="'+this.summaryTableDiv+'"></div>',
			'<div id="'+this.meterPlotDiv+'"></div>',
		'</div>'
	].join(' '));
>>>>>>> 0a33f59c605aa3eccc90a0d9982c1fae2aa198b2

	this.setDomain = function (URL) { this.domain = URL; return this; };
	this.setURL = function (URL) { this.URL = URL; return this; };
	this.setTitle = function (title) { this.title = title; return this; };
	this.setMyData = function (d) { this.myData = d; return this; };
	this.setMeterPlotDiv = function (d) { this.meterPlotDiv = d; return this; }
	this.setSummaryTableDiv = function (d) { this.summaryTableDiv = d; return this; }
<<<<<<< HEAD
	
=======

>>>>>>> 0a33f59c605aa3eccc90a0d9982c1fae2aa198b2
	this.listenOnGotDataEvent = function () {
		$(objref).on (gotDataEvent, this.GotDataEventCallback);
		return objref;
	};
<<<<<<< HEAD
	
=======

>>>>>>> 0a33f59c605aa3eccc90a0d9982c1fae2aa198b2
	this.GotDataEventCallback = function (event) {
		console.log( 'gotData!!!, #datapoints=' , event);
		this.calculate (this.myData);
		this.tableSummary(this.myData);
<<<<<<< HEAD
		
		plotN (this.myData, this.meterPlotDiv, this.title);
				
		this.listenOnWebSocket ();
		
=======
		plotN (this.myData, this.meterPlotDiv, this.title);

		this.listenOnWebSocket ();

>>>>>>> 0a33f59c605aa3eccc90a0d9982c1fae2aa198b2
		return this;
	};

	this.getData = function (nolines) {
		$.ajax ({
			url: this.URL+'/get?'+'nolines='+nolines,
			cache : false,
			dataType: 'jsonp',
			crossDomain: true,
<<<<<<< HEAD
			success: 
				function (data) { // this little closure will preserve the object reference of this (energyObject) 
=======
			success:
				function (data) { // this little closure will preserve the object reference of this (energyObject)
>>>>>>> 0a33f59c605aa3eccc90a0d9982c1fae2aa198b2
					console.log ("got called back with data ...", data[data.length-1] );
					objref.setMyData( data );
					$(objref).trigger( gotDataEvent, [data]);
					return objref;
				}
<<<<<<< HEAD
		});	
		return this;		
	};
	
=======
		});
		return this;
	};

>>>>>>> 0a33f59c605aa3eccc90a0d9982c1fae2aa198b2
	this.listenOnWebSocket = function () {
		console.log('in listenOnWebSocket', this.domain);
		var socket = io.connect(this.domain);
	  		socket.on('got new data', function (d) {
	    		console.log('WebSocket speaks:',  d);
<<<<<<< HEAD
	    		//socket.emit('my other event', { my: 'data' });	
				// pop the first array entry and put the new data on the end
				objref.myData.push(d);
				objref.myData.shift();
=======
	    		//socket.emit('my other event', { my: 'data' });
				// pop the first array entry and put the new data on the end
				objref.myData.push(d);
				objref.myData.shift();
				objref.tableSummary(objref.myData);
>>>>>>> 0a33f59c605aa3eccc90a0d9982c1fae2aa198b2
				plotN (objref.myData, objref.meterPlotDiv, objref.title);
	  		});
		return this;
	};
<<<<<<< HEAD
	
=======

>>>>>>> 0a33f59c605aa3eccc90a0d9982c1fae2aa198b2
	// render some calculation on the data
	this.calculate = function (data) {
		var t1=data[0].timestamp,
		    t2=data[data.length-1].timestamp,
			tdiff = t2 - t1;
		console.log ("in calculate, myobj.mydata.length:" + data.length);
		console.log ("in calculate, mydata:" + new Date (data[0].timestamp));
<<<<<<< HEAD
		console.log ("in calculate, mydata:" + new Date (data[data.length-1].timestamp) );	
		console.log ("in calculate, tdiff[s]=" + tdiff/1000);
		console.log ("in calculate, KW/h per day=" + (data.length/75) * (86400*1000)/tdiff );
		console.log ("in calculate, KW/h per year=" + 365*(data.length/75) * (86400*1000)/tdiff );
		return this;		
=======
		console.log ("in calculate, mydata:" + new Date (data[data.length-1].timestamp) );
		console.log ("in calculate, tdiff[s]=" + tdiff/1000);
		console.log ("in calculate, KW/h per day=" + (data.length/75) * (86400*1000)/tdiff );
		console.log ("in calculate, KW/h per year=" + 365*(data.length/75) * (86400*1000)/tdiff );
		return this;
>>>>>>> 0a33f59c605aa3eccc90a0d9982c1fae2aa198b2
	};

	// render some calculation on the data
	this.tableSummary = function (data) {
		console.log ("in tableSummary..." + data[0].timestamp );
<<<<<<< HEAD
		var t1=data[0].timestamp,
		    t2=data[data.length-1].timestamp,
			tdiff = t2 - t1;
		$('#'+this.summaryTableDiv)
			//.appendTo('body')
			.html('<table id="summaryTable" class="center"/>');
		$('#summaryTable').append( $('<tr/>')
=======

		var t1 = data[0].timestamp,
				t2 = data[data.length-1].timestamp,
				tdiff = t2 - t1;

		// Let's not work on the DOM
		$summaryTable = $('<table id="summaryTable" class="center"/>');

		$summaryTable.append( $('<tr/>')
>>>>>>> 0a33f59c605aa3eccc90a0d9982c1fae2aa198b2
				.append( $('<td/>').append('selected entries: ') )
				.append( $('<td/>').append(data.length + ", last at: "+new Date (data[data.length-1].timestamp)) )
			)
			.append( $('<tr/>')
				.append( $('<td/>').append('measuring time: ') )
<<<<<<< HEAD
				.append( $('<td/>').append(  Math.round( tdiff/(100*60*60*24) )/10 +" Tage	" ) )	
			)
			.append( $('<tr/>')
				.append( $('<td/>').append('KW/h per day: ') )
				.append( $('<td/>').append( Math.round( 100*(data.length/75) * (86400*1000)/tdiff) /100) )	
			)			
			.append( $('<tr/>')
				.append( $('<td/>').append('KW/h per year: ') )
				.append( $('<td/>').append( Math.round( 10*365*(data.length/75) * (86400*1000)/tdiff) /10 ) )	
			);		

	};

=======
				.append( $('<td/>').append(  Math.round( tdiff/(100*60*60*24) )/10 +" Tage	" ) )
			)
			.append( $('<tr/>')
				.append( $('<td/>').append('KW/h per day: ') )
				.append( $('<td/>').append( Math.round( 100*(data.length/75) * (86400*1000)/tdiff) /100) )
			)
			.append( $('<tr/>')
				.append( $('<td/>').append('KW/h per year: ') )
				.append( $('<td/>').append( Math.round( 10*365*(data.length/75) * (86400*1000)/tdiff) /10 ) )
			);

		$('#'+this.summaryTableDiv, $el).html($summaryTable);

	};

	// call append only once on DOM for better performance
	$('body').append($el);

>>>>>>> 0a33f59c605aa3eccc90a0d9982c1fae2aa198b2
	return this;
}

