var testmode = require("../../main/global/testmode.js").on(),
    assert = require("assert"),
    fs = require("fs"),
    testmode = require("../../main/global/testmode.js");



describe ('the testmode object...', function () {		
	/* initializes */
  it ('it is invoked', function (done) {
    assert (typeof testmode == "object")
    done ();
  })

  it ('has a function testmode.on(callback)', function (done) {
    assert (typeof testmode.on == 'function')
    testmode.on (done);
  })

  it ('testmode.isSwitchedOn() now', function (done) {
    assert( testmode.isSwitchedOn() == true);
    done();
  })


  it ('has a function testmode.off(callback)', function (done) {
    testmode.off (done);
  })

  it ('testmode.isSwitchedOn() now is false', function (done) {
    assert( testmode.isSwitchedOn() != true);
    done();
  })


});





  