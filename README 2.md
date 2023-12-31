## Synopsis

This is my smartMeter Project.
This is contains some documentation on how to build your own smartmeter and contains the code to run it. Its based on node.js and raspberry pi.

## Code Example

1. Reads energy consumption in meter and stores the readings on local file.
2. Has a little webServer in 'WebServer' that renders the results
3. some HTML client software for a nice graph, done with protovis (d3 is still a plan)

## Motivation

The smartMeter project will help you, to build your own smart energy meter based on raspberry pi and some electronics. This here contains the software to run the thing and in the doc directory some information on how to build the hardware.

Why? Because I love to measure things and I like to improve my IT-skills and also, because I like to share things.
:-)

I gave some brief talks on the issue, look here:
https://www.youtube.com/watch?v=6IkVaIex_b0
or here: https://www.youtube.com/watch?v=97bwN2U9SIQ#t=1164

## Installation

There will be more here in future. To install it on Raspberry Pi do the following:
- install node
- install socket.io
- install the smartmeter with the help of the ./deploy script
  like: "./deploy xkrukas.dyn.amicdns.de"
- npm install mocha --save-dev
- goto http://serverurl:42080/smartMeter/client/index.html

On Mac OS x you can testrun and simulate the smartMEter by running './testmode on' and then goto http://localhost:42080/smartMeter/client/index.html with your favorite web browser.

## API Reference
I use the following libraries:
jquery
protovis (I plan to do that wich d3 later)
node.js with modules mocha

## Tests
Still very scetchy, but checkout and run
cd src; mocha --recursive

## Contributors
Johannes Mainusch

## License
(The MIT License), see LICENSE file.