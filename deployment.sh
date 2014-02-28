# deployment of $1 to pi@192.168.2.42:production/. and remote execution...
#


case "$#" in
	0 )
    	TARGETSERVER=krukas.no-ip.org
		TARGET_SSH_PORT=42022
	;;
	2 )
	    TARGETSERVER=$1
		TARGET_SSH_PORT=$2
	;;
	*) 
	echo "Usage: ./deployment.sh TARGETSERVER TARGET_SSH_PORT"
	exit 1;
esac

case "$1" in
	
	'-deploy2pi' | * )
	clear
	echo "I will now try to deploy to pi at " $TARGETSERVER
	# copy the files to the pi
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'mkdir -p production/smartMeter';	
	rsync -R -ave 'ssh -p '$TARGET_SSH_PORT . pi@$TARGETSERVER:production/smartMeter/.
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'mkdir -p public_html/smartMeter';	
	rsync -R -ave 'ssh -p '$TARGET_SSH_PORT client pi@$TARGETSERVER:public_html/smartMeter/.

	# link the data file
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'ln -sf ~/myMeter.log production/smartMeter/data/gotResults.json';	
	
	# the smartMeter
	echo "killing any running smartMeters"
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'sudo production/smartMeter/meter/rcdSmartMeter stop'
	echo "testing with mocha and stopping on error"
	set -e
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'cd production/smartMeter; sudo mocha --recursive'	
	echo "move away any existing smartMeter.log files"
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'if [ -f smartMeter.log ]; then cp smartMeter.log smartMeter.log.last; fi'
    echo "installing the smartMeter bootstrap"
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'sudo production/smartMeter/meter/rcdSmartMeter rcinstall'
    echo "starting the smartMeter"
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'sudo production/smartMeter/meter/rcdSmartMeter start'

	# the webServer
	# kill any running server	
	echo "killing the currently running server..."
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'sudo production/smartMeter/webServer/rcdSmartMeterWebServer stop'
	# start the server
	echo "set the server file to executable..."
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'chmod +x production/smartMeter/webServer/djserver_eenergy.js'
	###ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'cd production/smartMeter; ./server/djserver_eenergy.js serverport=42080 &'
	echo "rcinstall the server bootstrap..."
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'sudo production/smartMeter/webServer/rcdSmartMeterWebServer rcinstall'
	echo "start the server..."
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'sudo production/smartMeter/webServer/rcdSmartMeterWebServer start'

	
	# edit the crontab entry that limits the number of datasets...
	# 59 23 * * 0  (tail -50000 /home/pi/myMeter.log > test; mv test /home/pi/myMeter.log) > /dev/null 2&>1

	exit 0
	;;

esac

exit 0

