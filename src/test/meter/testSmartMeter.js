const assert = require('assert')
const fs = require('fs')
const global = require('../../main/global/global.js').init('Test')
const SmartMeter = require('../../main/meter/smartMeter.js')
let simulators

/* init the smartMeter */
before(function (done) {
  this.timeout(11042)
  //	global.datafilename = "/tmp/testData.json";
  // wait for the smr initialization to be done...
  global.eventEmitter.on('readyForMeasurement', function () {
    simulators = require('../../main/meter/smartMeterSimulator.js')
    done()
  })
})

after(function (done) {
  console.log('after: stop all simulators')
  for (const i in simulators) simulators[i].stopSimulator()
  global.log('Stopped all simulators', simulators)
  done()
})

describe('smartMeter', function () {
  this.timeout(10542)

  /* init */
  it('should init() without error', function () {
    for (const i in global.measurements) {
      assert(global.measurements[i].gpioInputPin > 0)
    }
  })

  /* datafile is there */
  it('should have datafilename ', function () {
    assert(fs.existsSync(global.datafilename))
  })

  /* GPIO is set up */
  it('should create gpio device at **/direction', function () {
    for (const i in global.measurements) {
      assert(
        fs.existsSync(
          global.gpio_path +
            'gpio' +
            global.measurements[i].gpioInputPin +
            '/direction'
        )
      )
      assert.equal(
        fs.readFileSync(
          global.gpio_path +
            'gpio' +
            global.measurements[i].gpioInputPin +
            '/direction'
        ),
        'in\n'
      )
    }
  })

  /* it should calculate correct Watts */
  it('should calculate correct Watts', function () {
    const sm = new SmartMeter()
    sm.init(0)
    assert(sm.powerConsumption(6834, 0, 1) > 0)
  })

  it('should measure some - at least simulated - data', function (done) {
    const spawn = require('child_process').spawn
    const tail = spawn('tail', ['-fn0', global.datafilename])
    console.log('tail pid: ', tail.pid, ' started on ', global.datafilename)
    tail.stdout.on('data', function () {
      tail.kill()
      done()
      console.log('tail killed')
    })
    console.log('tail killed 2')
    done()
  })
})
