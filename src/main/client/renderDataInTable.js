/**
	Johannes Mainusch
	20141201
*/

var UmdrehungenProKWh,
	EuroCentProKWh;

function renderDataInTable(EnergyObject) {
	console.log ("in renderDataInTable...");
	var data = EnergyObject.myData,
		t1 = data[0].timestamp,
		t2 = data[data.length-1].timestamp,
		watt = data[data.length-1].Watt,
		tdiff = t2 - t1,
		date = new Date (data[data.length-1].timestamp).toLocaleString(),
		firstEntryToday = findFirstEntryAfterMidnight (EnergyObject.myData),
		noEntriesToday = data.length-firstEntryToday,
		filter = getQueryVariable('filter');


	// Let's render the table...
	$summaryTable = $('<table id="summaryTable" class="center"/>');

	$summaryTable
		.append( $('<tr/>')
			.append( $('<th colspan="2"/>').append("localhost " + global.location ) )
		)
		.append( $('<tr/>')
			.append( $('<td/>').append('data:') )
			.append( $('<td/>').append(data.length + " entries" ))
		)
		.append( $('<tr/>')
			.append( $('<td/>').append('last at:') )
			.append( $('<td/>').append(date) )
		);

	if (filter && filter != 'all') {
	 	getSetGlobals();
		$summaryTable
			.append( $('<tr/>')
				.append($('<td/>')
					.append('currently: ') )
				.append( $('<td/>')
					.append(  Math.round( 100*watt)/100
						+" Watt at 0."
						+ EuroCentProKWh
						+" Euro/KWh") )
			)
			.append( $('<tr/>')
				.append($('<td/>')
					.append('todays sum: ') )
				.append( $('<td/>')
					.append( noEntriesToday +" entries, "
							+ kWh(data, firstEntryToday, data.length-1) + " KWh, "
							+ Math.round(EuroCentProKWh*kWh(data, firstEntryToday, data.length-1))/100
							+ "Euro"
				))
			)
			.append( $('<tr/>')
				.append( $('<td/>')
					.append('average per day: ') )
				.append( $('<td/>')
					.append( kWh(data, 0, data.length-1) + " KWh, "
							+ Math.round(EuroCentProKWh*kWh(data, 0, data.length-1))/100
							+ "Euro"
					)
				)
			)
			.append( $('<tr/>')
			.append( $('<td/>')
				.append('av. per year: ') )
			.append( $('<td/>')
				.append( Math.round(365*kWh(data, 0, data.length-1)) + " KWh, "
							+ Math.round(EuroCentProKWh*365*kWh(data, 0, data.length-1))/100
							+ "Euro"
				)
			)
		);
	}
	console.log ("in calculate, t1 :: t2:" + t1 + " :: " + t2);
	console.log ("              myobj.mydata.length:" + data.length);
	console.log ("              Watt:" + watt);
	console.log ("              mydata:" + new Date (data[0].timestamp));
	console.log ("              mydata:" + new Date (data[data.length-1].timestamp) );
	console.log ("              firstEntryToday=" + firstEntryToday);
	console.log ("              noEntriesToday=" + noEntriesToday);
	console.log ("              UmdrehungenProKWh=" + UmdrehungenProKWh);
	console.log ("              EuroCentProKWh=" + EuroCentProKWh);
	console.log ("              tdiff[s]=" + tdiff/1000);
	console.log ("              KW/h per day=" + (data.length/global.UmdrehungenProKWh) * (86400*1000)/tdiff );
	console.log ("              KW/h per year="+ (365*data.length/global.UmdrehungenProKWh) * (86400*1000)/tdiff );

	$('#summaryTableDivId').html($summaryTable);

	return EnergyObject;
};

//
// findFirstEntryAfterMidnight(data)
//
function findFirstEntryAfterMidnight (data) {
	var entryNumber = 0,
		i;
	console.log ("in findFirstEntryAfterMidnight...");

	// loop through data backwards until you hit yesterday...
	// I try to archieve theis with finding a small division rest on 86400
	for (i=data.length-1; i>0; i--) {
		if (data[i].timestamp%86400000 < data[i-1].timestamp%86400000) break;
	}
	console.log("  found first or daybreak at i="+i+ " at " +new Date(data[i].timestamp).toLocaleString());

	return entryNumber;
}

//
// kWh
//
function kWh(data, first, last) {
	var t1 = data[first].timestamp,
		t2 = data[last].timestamp,
		watt = data[last].Watt,
		centProKWh =  global.EuroCentProKWh,
		tdiff = t2 - t1;
	console.log ("kWh: " + last +" "+ (last-first)/UmdrehungenProKWh * (86400*1000)/tdiff ); 
	return Math.round( 10*((last-first)/UmdrehungenProKWh)
				       * (86400*1000)/tdiff) /10
}

/*
 * get the globals from the global data object and calculate
 * var  UmdrehungenProKWh,
 *		EuroCentProKWh;
 */
function getSetGlobals () {
	var measurementsSelector = localStorage.getItem("dataFilter");
	// find selector in global.measurements array and set UmdrehungenProKWh
	for (var i=0; i< global.measurements.length; i++) {
		if (measurementsSelector.indexOf(global.measurements[i].gpioIdentifier) > 0) {
			UmdrehungenProKWh = global.measurements[i].UmdrehungenProKWh;
			EuroCentProKWh	= global.measurements[i].UmdrehungenProKWh;
		}
	}
}