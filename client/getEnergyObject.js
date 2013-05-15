/**
	Johannes Mainusch
	20130329
	instanciate an Energy Object and calculate consumption
*/

function energyObject () {
	var objref = this,
	    gotDataEvent = "gotData";	
		
	this.summaryTableDiv = "summaryTableDiv1234";
	this.meterPlotDiv = "meterPlotDiv1234";
	$('body').append ('<div id="'+this.summaryTableDiv+'"></div> <div id="'+this.meterPlotDiv+'"></div>');

	this.setDomain = function (URL) { this.domain = URL; return this; };
	this.setURL = function (URL) { this.URL = URL; return this; };
	this.setTitle = function (title) { this.title = title; return this; };
	this.setMyData = function (d) { this.myData = d; return this; };
	this.setMeterPlotDiv = function (d) { this.meterPlotDiv = d; return this; }
	this.setSummaryTableDiv = function (d) { this.summaryTableDiv = d; return this; }
	
	this.listenOnGotDataEvent = function () {
		$(objref).on (gotDataEvent, this.GotDataEventCallback);
		return objref;
	};
	
	this.GotDataEventCallback = function (event) {
		console.log( 'gotData!!!, #datapoints=' , event);
		this.calculate (this.myData);
		this.tableSummary(this.myData);
		plotN (this.myData, this.meterPlotDiv, this.title);
				
		this.listenOnWebSocket ();
		
		return this;
	};

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
		console.log('in listenOnWebSocket', this.domain);
		var socket = io.connect(this.domain);
	  		socket.on('got new data', function (d) {
	    		console.log('WebSocket speaks:',  d);
	    		//socket.emit('my other event', { my: 'data' });	
				// pop the first array entry and put the new data on the end
				objref.myData.push(d);
				objref.myData.shift();
				objref.tableSummary(objref.myData);				
				plotN (objref.myData, objref.meterPlotDiv, objref.title);
	  		});
		return this;
	};
	
	// render some calculation on the data
	this.calculate = function (data) {
		var t1=data[0].timestamp,
		    t2=data[data.length-1].timestamp,
			tdiff = t2 - t1;
		console.log ("in calculate, myobj.mydata.length:" + data.length);
		console.log ("in calculate, mydata:" + new Date (data[0].timestamp));
		console.log ("in calculate, mydata:" + new Date (data[data.length-1].timestamp) );	
		console.log ("in calculate, tdiff[s]=" + tdiff/1000);
		console.log ("in calculate, KW/h per day=" + (data.length/75) * (86400*1000)/tdiff );
		console.log ("in calculate, KW/h per year=" + 365*(data.length/75) * (86400*1000)/tdiff );
		return this;		
	};

	// render some calculation on the data
	this.tableSummary = function (data) {
		console.log ("in tableSummary..." + data[0].timestamp );
		var t1=data[0].timestamp,
		    t2=data[data.length-1].timestamp,
			tdiff = t2 - t1;
		$('#'+this.summaryTableDiv)
			//.appendTo('body')
			.html('<table id="summaryTable" class="center"/>');
		$('#summaryTable').append( $('<tr/>')
				.append( $('<td/>').append('selected entries: ') )
				.append( $('<td/>').append(data.length + ", last at: "+new Date (data[data.length-1].timestamp)) )
			)
			.append( $('<tr/>')
				.append( $('<td/>').append('measuring time: ') )
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

	return this;
}

