/**
	Johannes Mainusch
	20141227
*/

function renderDataSelector() {
	console.log ("in renderDataSelector...");
	var myhtml = $('<select>')
			.appendTo('#dataSelectorId')
			.change( handleSelectBoxChange),
		selectedValue = getQueryVariable('filter');

	if ( !(typeof selectedValue === 'string' ) ) selectedValue = 'all';

	$.ajax ({
		url: global.url+'/getXref?'+'nolines='+200+"&column=term",
		cache : false,
		dataType: 'jsonp',
		crossDomain: true,
		success:
			function (data) { // this little closure will preserve the object reference of this (energyObject)
				console.log ("  got called back with data=", data );
				myhtml.append($("<option>").attr('value','all').text('all'));
				for (var i in data) {
					myhtml.append($("<option>").attr('value',data[i]).text(data[i]));
				}
				myhtml.val(selectedValue);
			}
	});
}


function handleSelectBoxChange () {
	var dataSelector = $( "select option:selected" ).text(),
		newUrl;

	newUrl = window.location.protocol+ '//'
		+ window.location.host
		+ window.location.pathname
		+ "?filter="+dataSelector;

	if (dataSelector != 'all')
		localStorage.setItem("dataFilter", dataSelector);
	else
		localStorage.setItem("dataFilter", '');

	window.location.href = newUrl;
}


/**
	Found on the internet
	http://stackoverflow.com/questions/2090551/parse-query-string-in-javascript
*/
function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', variable);
}