var assert = require("assert"),
    global = global || require ("../../main/global/global.js").init("Test"),
    fs = require("fs"),
    XRef = require ("../../main/dataBase/XRef.js");


/* connect to the 'dataBase' and prepare everything */
before(function(done){
  this.timeout(12042);
  // write some stuff to the datafile for  further testing
  done();
})

after (function (done) {
  done();
})


describe ('xRef is a stream object, and...', function () {
  it ('I can pipe things to xRef...', function (done) {
    var xRef = new XRef();
    var testData= '{"term" : "kaefer", "Watt" : 0.42, "timestamp": 1419266112003}';
    var testData_echo  = require('child_process').spawn("echo", [testData]);
    var result = "";
    var xRef = new XRef("term");

    testData_echo
      .stdout
      .pipe (xRef);

    xRef
      .on('data', function (data) {
        global.log ("...testing: got data="+data);
        result += data;
      });

    xRef
      .on('end', function () {
        global.log ("...testing: got end signal=");
        assert (IsJsonString (result));
        global.log ("...testing: that was JSON, result="+JSON.parse(result).term);
        if (JSON.parse(result)[0] === 'kaefer') done();
      });
  })

  it ('cross references the things piped to it by filter', function (done) {
    var testData  = '{"term" : "Kaefer", "Watt" : 0.42, "timestamp": 1419266112003}\n';
        testData += '{"term" : "Meise", "Watt" : 0.42, "timestamp": 1419266112003}\n';
        testData += '{"term" : "Wurm", "Watt" : 0.42, "timestamp": 1419266112003}\n';
        testData += '{"term" : "Meise", "Watt" : 0.42, "timestamp": 1419266112003}\n';
        testData += '{"term" : "Meise", "Watt" : 0.42, "timestamp": 1419266112003}\n';
        testData += '{"term" : "Wurm", "Watt" : 0.42, "timestamp": 1419266112003}';
    var testData_echo  = require('child_process').spawn("echo", [testData]);
    var result = "",
        filter = "term";
    var xRef = new XRef(filter);

    testData_echo
      .stdout
      .pipe ( xRef );

    xRef
      .on('data', function (data) {
        global.log ("...testing: got data="+data);
        result += data;
      });

    xRef
      .on('end', function () {
        global.log ("...testing: got end signal, result="+result);
        assert (IsJsonString (result));
        global.log ("...testing: that was JSON, result="+JSON.parse(result).term);
        if (result === '["Kaefer","Meise","Wurm"]') done();
      });
  })

})

// =========
function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}