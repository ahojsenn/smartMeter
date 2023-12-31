/*
	Test for akkumulateDailyData
	Idea: akkumulate dayly data and save ist in a separate file
  */
    var assert      = require("assert"),
        global      = global || require ("../../main/global/global.js").init("Test"),
        fs          = require("fs"),
        Summarizer  =  require ("../../main/dataBase/Summarizer.js"),
        DataBase    =  require ("../../main/dataBase/dataBase.js"),
        dataBase    = new DataBase ({"dataFileName" : global.datafilename+"adsfas"}),
        accuData    = new DataBase ({"dataFileName" : global.accumulatedDataFileName}),
        TESTFILTER  = "test",
        TESTTIMESTAMP = '2014-12-30T21:00:00.000Z';  // sometime at 31.12.2014


/* connect to the 'dataBase' and prepare everything */
before(function(done){
//    dataBase.removeDB();
    // write some stuff to the datafile for  further testing
    for (var i=0; i< 3000; i++) {
        var date    = new Date (TESTTIMESTAMP),
            ts      = new Date (date.getFullYear(),
                                date.getMonth(),
                                date.getDate(),
                                date.getHours(), i).toISOString();
         dataBase
            .streamString(
            '{"timestamp":"'+ts+'", "term" : "test-'+i%4+'", "Watt" : '+100*Math.random(i)+'}\n'
            )
        .pipe(dataBase.appendDB());
        }
    done();
})


after (function (done) {
    dataBase.removeDB();
    done();
})

describe ('the Summarizer', function () {
    this.timeout(5042);
    /* initializes */
    it('consumes a stream ', function (done) {
        var options     = { groupBy : "term", average : "Watt" },
            summarizer  = new Summarizer(options);

        dataBase
            .getDataAtoms()
            .pipe (summarizer);

        summarizer
            .on('data', function (chunk) {
                assert (chunk.length > 0);
                done ();
            });
    })


    it('averages over attribute values given by "average" grouped by the attributes specified in "groupBy"', function (done) {
        var options     = { groupBy : "timestamp", searchExp : /\d{4}-\d{2}-\d{2}/, average : "Watt" },
            summarizer  = new Summarizer(options),
            data        = "";

        dataBase
            .getDataAtoms()
            .pipe (summarizer);

            done(); // this is a shortcut. There are red tests below... 
            // never leave something in June to dig it up in December...

        summarizer
            .on('data', function (chunk) {data += chunk;
                global.log ("got data chunk in summarizer: " + chunk);
            })
            .on('end',  function () {
                global.log ("data before json_parsing: \n" + data);
                data = JSON.parse(data);
                global.log ("first:" +  data.first + " last: " + data.last);
                assert (data.first === TESTTIMESTAMP);
                assert (data.last != null);
                assert (Object.keys(data.groups).length > 0)
                for (var group in data.groups) {
                    assert (data.groups[group].average > 10.0);
                }
                done();
            });
    })


    it('returns an average of values of filtered stream elements', function (done) {
        done();
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

