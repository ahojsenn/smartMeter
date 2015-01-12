var assert = require("assert"),
    global = (typeof global != 'undefined' )
      ? global : require ("../../main/global/global.js").init("Test"),
    fs = require("fs"),
    TESTFILTER='ycxvyxcvxy',
    DataBase = require ("../../main/dataBase/dataBase.js"),
    dataBase = new DataBase;



/* connect to the 'dataBase' and prepare everything */
before(function(done){
  this.timeout(12042);
  // write some stuff to the datafile for  further testing
  dataBase.writeData(
    '{"term" : "brabbel", "Watt" : 302.2, "timestamp": 1419266113000}\n'
    +'{"term" : "'+TESTFILTER+'", "Watt" : 302.2, "timestamp": 1419266113000}\n'
    +'{"term" : "'+TESTFILTER+'", "Watt" : 302.2, "timestamp": 1419266113000}',
    done()
  );
})

// the dataBase ist there
describe ('the dataBase', function () {
  /* initializes */
  it('returns the datafile name', function () {
    assert.equal (global.datafilename, dataBase.dataFileName());
  })

  it ('getNoLines(filter).stream returns the number of lines', function (done) {
    var filter = TESTFILTER;
    dataBase.getNoLines(filter).stream.on('data', function (data) {
      console.log ("=========>>>>>> stream is readable, data="+data);
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

  it ('.getData returns a json array', function (done) {
    var noLines = 2;
    dataBase.getData(noLines, TESTFILTER, function (data) {
      assert (IsJsonString (data));
      done();
    });
  })

  it ('.getData.stream returns a json array', function (done) {
    var noLines = 2;
    dataBase.getData(noLines).stream.on('data', function (data) {
      assert (IsJsonString (data));
      done();
    });
  })


  it ('.getData (noLines=2) returnes 2 lines...', function (done) {
    var noLines = 2;
    dataBase.getData(noLines, '', function (data) {
      data = JSON.parse(data);
      assert.equal (noLines, data.length);
      done();
    });
  })


  it ('.getData with filter returnes filtered data...', function (done) {
    var noLines = 3;
    dataBase.getData(noLines, TESTFILTER, function (data) {
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

  it ('.tailDB.stream gives a json array', function (done) {
    var testData1= '{"term" : "kaefer", "Watt" ';
    var testData2= ': 0.42, "timestamp": 1419266113001}\n';

    dataBase
      .writePartial(testData1);

    dataBase
      .tailDB()
      .stream
      .once('data', function (data) {
        global.log ("...testing: got data="+data);
        assert (IsJsonString (data));
        global.log ("...testing: that was JSON");
        assert (JSON.parse(data).term === 'kaefer');
        assert (JSON.parse(data).Watt === 0.42);
        done();
      });

    setTimeout ( function () {
      dataBase.writePartial(testData2);
      }, 200);
  })

  it ('.writeData appends the database at the end', function (done) {
    var testData= '{"term" : "blattlaus", "Watt" : 0.42, "timestamp": 1419266113001}'
    var dataBase = new DataBase;

    dataBase.writeData(testData);
    var tail=require('child_process').spawn("tail", ['-n1', global.datafilename]);

    tail.stdout.on('data', function (data) {
      global.log ("...testing writeData: got data="+data);
      assert (IsJsonString (data));
      assert (JSON.parse(data).term === 'blattlaus');
      assert (JSON.parse(data).Watt === 0.42);
      done();
    });
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