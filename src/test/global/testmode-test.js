var testmode = require("../../main/global/testmode.js").setOn(),
    assert = require("assert"),
    fs = require("fs");



describe ('the testmode object...', function () {		
	/* initializes */
  it ('it is invoked', function (done) {
    assert (typeof testmode == "object")
    done ();
  })

  it ('has a function testmode.setOn(callback)', function (done) {
    assert (typeof testmode.setOn == 'function')
    done();
  })

  it ('has a function testmode.setOff(callback)', function (done) {
    assert (typeof testmode.setOff == 'function')
    done();
  })

  it ('has a function testmode.isSwitchedOn(callback)', function (done) {
    assert (typeof testmode.isSwitchedOn == 'function')
    done();
  })

  it ('switches to testmode with testmode.setOn()', function (done) {
    testmode.setOn ();
    assert( testmode.isSwitchedOn() == true);
    done();
  })

  it ('has testmode.isSwitchedOn() false after testmode.setOff', function (done) {
    testmode.setOff ();
    assert( testmode.isSwitchedOn() != true);
    done();
  })


});





  