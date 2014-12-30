#!/usr/bin/env node
/*jslint node: true */
/*
	Johannes Mainusch
	Start: 2014-12-21
*/

var	global = (typeof global != 'undefined' ) ?
		global : require ("../../main/global/global.js").init("from dataReader");

// the webServer Object
var dataReader = {
	getData: 	function (noLines, filter, callback) {return getData(noLines, filter, callback)},
	getNoLines: function (filter,callback) {return getNoLines(filter,callback)},
	getFirst: 	function (callback) {return getFirst(callback)},
	getLast:  	function (callback) {return getLast(callback)},
	getNoLines: function (filter,callback) {return getNoLines(filter,callback)},
	dataFileName: function () {return global.datafilename},
	getXref : 	function (noLines, column, callback) {return getXref(noLines, column, callback)},
	writeData : function (message, callback) {return writeData(message, callback)}
};
module.exports = dataReader;


/**
	getnoLines will return the number of lines in the file
	filter: a filter string to grep for
	callback: the callback
*/
function getNoLines (filter, callback) {
	global.log ('in getNoLines');
	var cmd = "cat " + global.datafilename,
		exec = require('child_process').exec,
		responseData="[";

	if (typeof filter === 'string' )
		cmd += " | grep '"+filter+"'";

	cmd += " | wc -l | tr -d ' '";

	exec(cmd, function (error, stdout) {
		// get rid of newlines in data
		var data = stdout.slice(0, stdout.length-1);
		responseData += data+"]";

		global.log ('    getNoLines, cmd='+cmd);
		global.log ('    getNoLines, responseData='+responseData);
		callback (responseData);
	});
}

/**
	getData() will return Data as array of data objects
	filter: a filter string to grep for
	noLines: the number of lines to tail the data...
	callback: the callback
*/
function getData (noLines, filter, callback) {
	var spawn = require('child_process').spawn,
		tail = spawn("tail", [-noLines, global.datafilename]),
		grep = spawn("grep", [filter]),
		responseData="[";

	global.log ('in getData('+noLines+', "'+filter+'", callback() )');

	tail.stdout.on ('data', function (data) {
		global.log ('      ... tail.stdout, data=\n'+ data);
		grep.stdin.write(data);
	});

	tail.stderr.on('data', function (data) {
	  	global.log('        ...tail stderr: ' + data);
	});

	tail.on('close', function (code) {
		if (code !== 0) {
    		console.log('ps process exited with code ' + code);
  		}
  		grep.stdin.end();
	});

	grep.stdout.on ('data', function (data) {
 		global.log ("      ... grep.stdout, data=\n"+ data);
    	responseData += String(data).replace(/\n/g, ',\n');		// replace newlines by ',\n'
	})

	grep.stderr.on ('data', function (data) {
		console.log('grep stderr: ' + data);
	})

	grep.on ('close', function (code) {
		if (code !== 0) {
    		console.log('grep process exited with code ' + code);
  		}
  		responseData = responseData.replace(/,\n$/, '');		// removed the last ,
		responseData += "]";
	  	global.log('           exit with code ' + code + "\n    responseData:" + responseData+'...');
		callback (responseData);
	})
}

/**
	getFirst gets the first data entry
*/
function getFirst (callback) {
	execInShell ('head -1 ', callback);
}

/**
	getLAst gets the first data entry
*/
function getLast (callback) {
	execInShell ('tail -1 ', callback);
}

/**
	execInShell will do a 'cat' on filename and pipe the results on 'cmd'
	and do a tail - noLines on ot at the end...
*/
function execInShell (cmd, callback) {
	var exec = require('child_process').exec,
		data;

	cmd += cmd + " " + global.datafilename;
	global.log ('in execInShell, cmd='+cmd);

	exec(cmd, function (error, data) {
		data = data.replace(/\r?\n|\r/g, ","); // trade newlines to ","
		data = "["+data+"]";					// add [] for array
		data = data.replace(/},]/, '}]');		// removed the last ","
		global.log('callback in execInShell, cmd: ' + cmd + "\n" +data);
		callback( data );
	});
}

/**
	getXref (column, callback) return the cross reference, i.e. all different values in column
 */
function getXref (noLines, column, callback) {
	global.log ("in getXref, column="+column);

	dataReader.getData (noLines, '', function (data) {
		// now find the uniques in the data 'column'
		var unique 	 = {},
			distinct = [];

		data=JSON.parse(data);
		for (var line in data){
			if ( !(data[line][column] in unique) ) {
				global.log ("   ... found unique "+data[line][column]);
				unique[data[line][column]] = true;
				distinct.push (data[line][column]);
			}
		}
		global.log ("	returning JSON.stringify(unique)="+JSON.stringify(distinct)) ;
		callback( JSON.stringify(distinct) );
	});

}

function writeData (message, callback) {
	var	fs = require('fs');

	//Now make sure, the values are logged somewhere, namely in logFile...
	fs.appendFile (global.datafilename,  message +'\n', function(err) {
	    if(err) {
	        console.log(err);
	    } else {
	        global.log(global.datafilename + " was appended: " + message);
		}
	});

	if (typeof callback === 'function' && callback())
		callback ();
	else return;
}
