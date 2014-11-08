	# deployment of $1 to pi@192.168.2.42:production/. and remote execution...
#

TARGETSERVER=192.168.178.23
TARGET_SSH_PORT=42022

case "$#" in
	0 )
    	TARGETSERVER=myserver.no-ip.org
		TARGET_SSH_PORT=42022
	;;

	1 )
    	TARGETSERVER=$1
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

clear
case "$1" in
	
	'-clean' )
	echo "clean deploy now first removes the directory production/smartmeter on the target server...";
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'rm -rf production/smartMeter';	
	;;

	'-deploy2pi' | * )
	echo "I will now try to deploy to pi at " $TARGETSERVER


	# copy the files to the pi
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'mkdir -p production/smartMeter';	
	rsync --exclude ".git" -R -ave 'ssh -p '$TARGET_SSH_PORT . pi@$TARGETSERVER:production/smartMeter/.
#	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'mkdir -p public_html/smartMeter';	
#	rsync -R -ave 'ssh -p '$TARGET_SSH_PORT src/main/client pi@$TARGETSERVER:public_html/smartMeter/.

	
	# the smartMeter
	echo "killing any running smartMeters"
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'sudo production/smartMeter/src/main/meter/rcdSmartMeter stop'
	# the webServer
	# kill any running server	
	echo "killing the currently running server..."
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'sudo production/smartMeter/src/main/webServer/rcdSmartMeterWebServer stop'

	echo "testing with mocha..."
	echo "...and stopping on error"; set -e
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'cd production/smartMeter/src; sudo mocha --recursive'	
	# and removing the /tmp/smartMeterTestModeIsOn if necessary
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'sudo rm -f /tmp/smartMeterTestModeIsOn'	


    echo "installing the smartMeter bootstrap"
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'sudo production/smartMeter/src/main/meter/rcdSmartMeter rcinstall'
    echo "starting the smartMeter"
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'sudo production/smartMeter/src/main/meter/rcdSmartMeter start'

	# start the server
	echo "rcinstall the server bootstrap..."
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'sudo production/smartMeter/src/main/webServer/rcdSmartMeterWebServer rcinstall'
	echo "start the server..."
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'sudo production/smartMeter/src/main/webServer/rcdSmartMeterWebServer start'

	
	# edit the crontab entry that limits the number of datasets...
	# 59 23 * * 0  (tail -50000 /home/pi/myMeter.log > test; mv test /home/pi/myMeter.log) > /dev/null 2&>1

	exit 0
	;;

esac

exit 0

