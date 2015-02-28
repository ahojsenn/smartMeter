var assert = require("assert"),
    global = global || require ("../../main/global/global.js").init("Test"),
    fs = require("fs"),
    TESTFILTER='ycxvyxcvxy',
    DataBase = require ("../../main/dataBase/dataBase.js");
    dataBase = new DataBase();

global.log ("in testDataBase, dataBase.ObjectID="+dataBase.ObjectID);

/* connect to the 'dataBase' and prepare everything */
before(function(done){
  this.timeout(5042);
  var tail=require('child_process').spawn("tail", ['-fn1', global.datafilename]);

  // write some stuff to the datafile for  further testing
  for (var i=0; i< 500; i++) {
    dataBase.writeData(
      '{"term" : "brabbel1", "Watt" : '+i+'.1, "timestamp": 1419266113000}\n'
      +'{"term" : "'+TESTFILTER+'", "Watt" : '+i+'.2, "timestamp": 1419266113000}\n'
      +'{"term" : "'+TESTFILTER+'", "Watt" : '+i+'.3, "timestamp": 1419266113003}\n'
      +'{"term" : "'+TESTFILTER+'", "Watt" : '+i+'.4, "timestamp": 1419266113005}');
  }
  done();
})


after (function (done) {
  dataBase.removeDB();
  done();
})

// the dataBase ist there
describe ('the dataBase', function () {
  this.timeout(3542);
  /* initializes */
  it('returns the datafile name', function () {
    assert.equal (global.datafilename, dataBase.dataFileName());
  })

  it ('getNoLines(filter) streams the number of lines', function (done) {
    var filter = TESTFILTER;
    var result = "";
    dataBase
      .getNoLines(filter)
      .on('data', function (data) {
        result += data; })
      .on('end', function () {
        console.log ("=========>>>>>> stream is readable, data=\n"+result);
        assert (JSON.parse(result.toString())[0] >= 2);
        done();
      });
    })
/*
  it ('.getNolines(filter,callback) returns the number of lines', function (done) {
    var filter = "";
    dataBase.getNoLines(filter, function (noLines) {
      assert (IsJsonString (noLines));
      console.log ("       ...noLines="+noLines);
      console.log ("       ...noLines[0]="+JSON.parse(noLines)[0]);
      assert (JSON.parse(noLines)[0] > 0);
      done();
    });
  })
*/

  it ('.getNolines with a very unlikely filter returns zero lines', function (done) {
    var filter = "sdafdasfasdfewsfewq0981235rio2qhnvqwerLKJL";
    var result = "";
    dataBase
      .getNoLines(filter)
      .on('data', function (data) {
        result += data; })
      .on('end', function () {
        console.log ("=========>>>>>> stream is readable, data=\n"+result);
        assert (JSON.parse(result.toString())[0] == 0);
        done();
      });
  })

  it ('.getData returns a json array', function (done) {
    var noLines = 2000,
        result = "";
    dataBase
      .getData(noLines, TESTFILTER)
      .on('data', function (data) {
//        global.log ("in testDataBase, got data="+data);
        result += data; })
      .on('end', function () {
        assert (IsJsonString (result));
        done();
      });
  })

  it ('.getXref streams a json array', function (done) {
    var result = "";
    dataBase
      .getXref(1000, 'term')
      .on ('data', function (data) {
        global.log ("...testing..., getXref streams, data="+data);
        result += data;
      })
      .on('end', function () {
        assert (IsJsonString (result));
        done();
      });
  })

  it ('.getFirst streams a json array', function (done) {
    dataBase
      .getFirst()
      .on('data', function (data) {
      assert (IsJsonString (data));
      if (JSON.parse(data)[0].term === 'brabbel1') done();
    });
  })

  it ('.getLast streams a json array', function (done) {
    var testData= '{"term" : "ameisegugu", "Watt" : 0.72, "timestamp": 1419266113001}'

    dataBase
    .getLast( function () {return dataBase.writeData(testData)} )
    .on('data', function (data) {
      global.log ("...testing getLast: got data="+data);
      assert (IsJsonString (data));
      if (
        (JSON.parse(data)[0].term === TESTFILTER) ||
        (JSON.parse(data)[0].term === 'ameisegugu') ||
        (JSON.parse(data)[0].term === 'blupp') )  {// there is a chance of the simuator
                                               // interfering right now
        done();
      }
    })
    dataBase.writeData(testData);
  })

  it ('.tailDB.stream gives a json array', function (done) {
    var testData = '{"term" : "kaeferss", "Watt" : 0.42, "timestamp": 1419266112003}';
    global.log ('...testing, dataBase.ObjectID='+dataBase.ObjectID);
    dataBase.logObjectID();
    global.log ('...testing, dataBase.ObjectID='+dataBase.ObjectID);

    dataBase
      .tailDB()
      .on('data', function (data) {
        global.log ("...testing.tailDB: got data="+data);
        var lines = data.toString().split('\n');
        for (var i in lines ) {
          if (lines [i] == 0) break;
          assert (IsJsonString (lines[i]));
          if (JSON.parse(lines[i]).term === 'kaeferss') {
            done();
          }
        }
      })
      .on('end', function () {global.log ('the end...') });
    dataBase.writeData(testData);
  })

  it ('.writeData appends the database at the end', function (done) {
    var testData= '{"term" : "blattlaus", "Watt" : 0.42, "timestamp": 1419266113001}'
    var tail=require('child_process').spawn("tail", ['-fn1', global.datafilename]);

    process.on ('exit', function () {
      tail.kill("SIGHUP");
    });

    tail.stdout.on  ('data', function (data) {
      global.log ("...testing writeData: got data="+data);
      assert (IsJsonString (data));
      if (JSON.parse(data).term === 'blattlaus') {
        tail.kill('SIGHUP');
        done();
      }
    });
    dataBase.writeData(testData);
  })


});



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