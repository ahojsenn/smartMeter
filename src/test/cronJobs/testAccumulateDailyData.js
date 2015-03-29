/*
	Test for akkumulateDailyData
	Idea: akkumulate dayly data and save ist in a separate file
*/
var assert = require("assert"),
    global = global || require ("../../main/global/global.js").init("Test"),
    fs = require("fs"),
   	DataBase =  require ("../../main/dataBase/dataBase.js"),
	dataBase = new DataBase ({"dataFileName" : global.datafilename}),
	accuData = new DataBase ({"dataFileName" : global.accumulatedDataFileName}),
	TESTFILTER= "test";


/* connect to the 'dataBase' and prepare everything */
before(function(done){
  this.timeout(5042);
  // write some stuff to the datafile for  further testing
  for (var i=0; i< 1500; i++) {
    dataBase
      .streamString(
        '{"term" : "brabbel1", "Watt" : '+i+'.1, "timestamp": '+(1419989114000+i*120000)/1+'}\n'
        +'{"term" : "'+TESTFILTER+'", "Watt" : '+i+'.2, "timestamp": '+(1419989114000+i*120000)/1+'}\n'
        +'{"term" : "'+TESTFILTER+'", "Watt" : '+i+'.3, "timestamp": '+(1419989114000+i*120000)/1+'}\n'
        +'{"term" : "hugo", "Watt" : '+i+'.4, "timestamp": '+(1419989114000+i*120000)/1+'}\n')
      .pipe(dataBase.appendDB());
  }
  done();
})


after (function (done) {
	dataBase.removeDB();
  	done();
})

// the dataBase ist there
describe ('the dataBase', function () {
   this.timeout(5042);
 	/* initializes */
  	it('returns the datafile name', function (done) {
    	assert.equal (global.datafilename, dataBase.dataFileName);
    	assert.equal (accuData.datafilename, dataBase.accumulatedDataFileName);
    	done();
  	})


 	it ('has a getDaysData method that returns the data of one day', function (done) {
 		var timestamp 	= 1419989114000,  // sometime at 31.12.2014
 			date 		= new Date (timestamp),
 			startOfDay 	= new Date (date.getFullYear(), date.getMonth(), date.getDate() ).toISOString(),
 			endOfDay 	= new Date (date.getFullYear(), date.getMonth(), date.getDate() +1).toISOString(),
 			result 		= "";
		dataBase
			.getDaysData (timestamp)
		    .on('data', function (data) { result += data; })
      		.on('end', function () {
			    var lines = result.toString().split('\n');  // sometimes tail takes two lines at a time...
      			for (i in lines) {
        			if (lines [i] == 0) break;
      				var ts = JSON.parse(lines[i]).timestamp;
	        		assert (IsJsonString (lines [i]));
        			assert ( ts > startOfDay );
        			assert ( ts < endOfDay );
      				}
      			if (i>-10) done ();
			    });
 	})
})



// =========
function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        global.log ("this aint no json, str="+str);
        return false;
    }
    return true;
}

