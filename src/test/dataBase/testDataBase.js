var assert = require("assert"),
    global = global || require ("../../main/global/global.js").init("Test"),
    fs = require("fs"),
    TESTFILTER='ycxvyxcvxy',
    DataBase = require ("../../main/dataBase/dataBase.js"),
    dataBase = new DataBase;



/* connect to the 'dataBase' and prepare everything */
before(function(done){
  this.timeout(12042);
  // write some stuff to the datafile for  further testing
  for (var i=0; i< 500; i++) {
    dataBase.writeData(
      '{"term" : "brabbel", "Watt" : '+i+'.1, "timestamp": 1419266113000}\n'
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
  /* initializes */
  it('returns the datafile name', function () {
    assert.equal (global.datafilename, dataBase.dataFileName());
  })

  it ('getNoLines(filter).stream returns the number of lines', function (done) {
    var filter = TESTFILTER;
    dataBase.getNoLines(filter)
      .stream.once('data', function (data) {
      console.log ("=========>>>>>> stream is readable, data=\n"+data);
      assert (JSON.parse(data.toString())[0] >= 2);
      done();
    });
  })

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


  it ('.getNolines with a very unlikely filter returns zero lines', function (done) {
    var filter = "sdafdasfasdfewsfewq0981235rio2qhnvqwerLKJL";
    dataBase.getNoLines(filter, function (noLines) {
      assert (IsJsonString (noLines));
      assert (JSON.parse(noLines)[0] === 0);
      done();
    });
  })

  it ('.getDataCB returns a json array', function (done) {
    var noLines = 2;
    dataBase.getDataCB(noLines, TESTFILTER, function (data) {
      assert (IsJsonString (data));
      done();
    });
  })


  it ('.getData returns a json array', function (done) {
    var noLines = 2000,
        result = "";
    dataBase
      .getData(noLines, TESTFILTER)
      .stream
      .on('data', function (data) {
//        global.log ("in testDataBase, got data="+data);
        result += data; })
      .on('end', function () {
        assert (IsJsonString (result));
        done();
      });
  })


  it ('.getDataCB (noLines=800) returnes the lines...', function (done) {
    var noLines = 800;
    dataBase.getDataCB(noLines, '', function (data) {
      data = JSON.parse(data);
      assert.equal (noLines, data.length);
      done();
    });
  })


  it ('.getData with filter returnes filtered data...', function (done) {
    var noLines = 3;
    dataBase.getDataCB(noLines, TESTFILTER, function (data) {
      data = JSON.parse(data);
      for (var line in data) {
        global.log ('      ...data[line]='+data[line].term);
        assert.equal (TESTFILTER, data[line].term);
      }
      done();
    });
  })

  it ('.getXref returns a json array', function (done) {
    dataBase.getXref(1000, 'term', function (data) {
      assert (IsJsonString (data));
      done();
    });
  })

  it ('.getXref.stream gives a json array', function (done) {
    dataBase.getXref(1000, 'term').stream.on('data', function (data) {
      assert (IsJsonString (data));
      done();
    });
  })

  it ('.getFirst.stream gives a json array', function (done) {
    dataBase.getFirst().stream.on('data', function (data) {
      assert (IsJsonString (data));
      done();
    });
  })

  it ('.getLast.stream gives a json array', function (done) {
    var testData= '{"term" : "ameise", "Watt" : 0.72, "timestamp": 1419266113001}'
    dataBase.writeData(testData);

    dataBase.getLast().stream.once('data', function (data) {
      global.log ("...testing getLast: got data="+data);
      assert (IsJsonString (data));
      done();
    });
  })

})

describe ('the dataBase has a stream', function () {
  it ('.tailDB.stream gives a json array', function (done) {
    var testData= '{"term" : "kaefer", "Watt" : 0.42, "timestamp": 1419266112003}';
    dataBase
      .tailDB()
      .stream
      .once('data', function (data) {
        global.log ("...testing: got data="+data);
        assert (IsJsonString (data));
        global.log ("...testing: that was JSON");
        if (JSON.parse(data).term === 'kaefer') done();
      });
    dataBase.writeData(testData);
  })
})

describe ('the dataBase has a write method', function () {
  this.timeout(2042);
  it ('.writeData appends the database at the end', function (done) {
    var testData= '{"term" : "blattlaus", "Watt" : 0.42, "timestamp": 1419266113001}'
    var dataBase = new DataBase;

    var tail=require('child_process').spawn("tail", ['-fn1', global.datafilename]);

    process.on ('exit', function () {
      tail.kill("SIGHUP");
    });

    tail.stdout.on('data', function (data) {
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
        return false;
    }
    return true;
}