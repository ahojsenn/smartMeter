var gpio = require('rpi-gpio');

var pin   = process.argv[2],
    delay = 1000,
    count = 0,
    max   = 10;

console.log('blinking pin '+pin);

gpio.on('change', function(channel, value) {
    console.log('Channel ' + channel + ' value is now ' + value);
});
gpio.setup(pin, gpio.DIR_OUT, on);

function on() {
    if (count >= max) {
        gpio.destroy(function() {
            console.log('Closed pins, now exit');
            return process.exit(0);
        });
        return;
    }

    setTimeout(function() {
        gpio.write(pin, 1, off);
        console.log('pin '+pin+' off');
        count += 1;
    }, delay);
}

function off() {
    setTimeout(function() {
        gpio.write(pin, 0, on);
        console.log('pin '+pin+' on');
    }, delay);
}
