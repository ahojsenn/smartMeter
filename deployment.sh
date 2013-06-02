# deployment of $1 to pi@192.168.2.42:production/. and remote execution...
#

TARGETSERVER=krukas.dyndns.org
# TARGETSERVER=192.168.2.42
TARGET_SSH_PORT=42022
TARGET_HTTP_PORT=42080

case "$1" in
	'-devServer' )
	clear
	echo "starting dev environment"
	sudo apachectl stop
	sudo apachectl start

	$NODEJS /Volumes/docdata/johannes.mainusch/docjoe/development/smartMeter/server/djserver_eenergy.js 
	exit 0
	;;

	'-deploySmartMeter' | '-sm' )
	# the smartMeter
    clear
	echo "killing any running smartMeters"
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER "ps aux | grep smartMeter.js | grep -v grep | awk '{ print \$2}' | xargs -t kill > /dev/null 2>&1 "	
	echo "move away any existing smartMeter.log files"
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'if [ -f smartMeter.log ]; then cp smartMeter.log smartMeter.log.last; fi'
    echo "starting the smartMeter"
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'sudo production/smartMeter/meter/smartMeter.js  > /dev/null 2>&1 &'
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'ps -ef | grep nodejs'
	;;
	
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
	
	# the webServer
	# kill any running server	
	echo "killing the currently running server..."
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER "ps aux | grep djserver_eenergy.js | grep -v grep | awk '{ print \$2}' | xargs -t kill > /dev/null 2>&1 "	
	# start the server
	echo "set the server file to executable..."
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'chmod +x production/smartMeter/webServer/djserver_eenergy.js'
	###ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER 'cd production/smartMeter; ./server/djserver_eenergy.js serverport=42080 &'
	echo "start the server..."
	ssh -p $TARGET_SSH_PORT pi@$TARGETSERVER '(cd production/smartMeter; ./webServer/djserver_eenergy.js serverport=42080 ) > djserver_eenergy.log 2>&1 &'

	# test the webServer
	echo "==============================="
	echo "testing the server..."
	echo "curl http://$TARGETSERVER:42080/djserver_eenergy/getnolines"
	sleep 1
	curl http://$TARGETSERVER:$TARGET_HTTP_PORT/djserver_eenergy/getnolines
	sleep 1
	curl http://$TARGETSERVER:$TARGET_HTTP_PORT/djserver_eenergy/getnolines
	sleep 1
	curl http://$TARGETSERVER:$TARGET_HTTP_PORT/djserver_eenergy/getnolines
	echo "done with testing the server..."
	echo "==============================="
	echo " "
	
	# edit the contag entry that limits the number of datasets...
	# 59 23 * * 0  (tail -50000 /home/pi/myMeter.log > test; mv test /home/pi/myMeter.log) > /dev/null 2&>1

	exit 0
	;;

esac

exit 0

