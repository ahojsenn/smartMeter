/**
	Johannes Mainusch
	20141201
*/

function renderSummaryTable(EnergyObject) {
	console.log ("in renderSummaryTable...");
	var data = EnergyObject.myData,
		t1 = data[0].timestamp,
		t2 = data[data.length-1].timestamp,
		watt = data[data.length-1].Watt,
		centProKWh =  global.EuroCentProKWh,
		tdiff = t2 - t1,
		date = new Date (data[data.length-1].timestamp).toLocaleString(),
		firstEntryToday = findFirstEntryAfterMidnight (EnergyObject.myData),
		noEntriesToday = data.length-firstEntryToday;

	// Let's not work on the DOM
	$summaryTable = $('<table id="summaryTable" class="center"/>');

	$summaryTable
		.append( $('<tr/>')
			.append( $('<th colspan="2"/>').append("localhost " + global.location) )
		)
		.append( $('<tr/>')
			.append( $('<td/>').append('data:') )
			.append( $('<td/>').append(data.length + " entries") )
		)
		.append( $('<tr/>')
			.append( $('<td/>').append('last at:') )
			.append( $('<td/>').append(date) )
		)
		.append( $('<tr/>')
			.append( $('<td/>').append('currently: ') )
			.append( $('<td/>').append(  Math.round( 100*watt)/100 +" Watt at 0." + centProKWh +" Euro/KWh") )
		)
		.append( $('<tr/>')
			.append( $('<td/>').append('todays sum: ') )
			.append( $('<td/>').append( noEntriesToday +" entries, "
										+ kWh(data, firstEntryToday, data.length-1) + " KWh, "
										+ Math.round(global.EuroCentProKWh*kWh(data, firstEntryToday, data.length-1))/100
										+ "Euro"
				))
		)
		.append( $('<tr/>')
			.append( $('<td/>').append('average per day: ') )
			.append( $('<td/>').append( kWh(data, 0, data.length-1) + " KWh, "
										+ Math.round(global.EuroCentProKWh*kWh(data, 0, data.length-1))/100
										+ "Euro"
									)
			)
		)
		.append( $('<tr/>')
			.append( $('<td/>').append('av. per year: ') )
			.append( $('<td/>').append( 365*kWh(data, 0, data.length-1) + " KWh, "
										+ Math.round(global.EuroCentProKWh*365*kWh(data, 0, data.length-1))/100
										+ "Euro"
									)
			)
		);

	console.log ("in calculate, t1 :: t2:" + t1 + " :: " + t2);
	console.log ("              myobj.mydata.length:" + data.length);
	console.log ("              Watt:" + watt);
	console.log ("              mydata:" + new Date (data[0].timestamp));
	console.log ("              mydata:" + new Date (data[data.length-1].timestamp) );
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

	return Math.round( 10*((last-first)/global.UmdrehungenProKWh)
				       * (86400*1000)/tdiff) /10

}