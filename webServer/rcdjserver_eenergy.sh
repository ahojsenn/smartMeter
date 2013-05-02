#!/bin/bash
#

WPATH=/home/docjoe/production/meter_eenergy/server/
SERVER=djserver_eenergy.js
SERVERPATH=$WPATH$SERVER
RCDSERVER=rcdjserver_eenergy.sh

case "$1" in
'start')
mypids=$(ps -ef | grep $SERVER | grep -v "grep" | wc -l)
if [ $mypids -gt 0 ] 
then
	echo there is $mypids $SERVER running 
	echo `ps -ef | grep $SERVER | grep -v grep`
else
	node $SERVERPATH 2>&1 > /dev/null &
	apache2ctl restart
	echo started $SERVER
fi
;;

'stop')
for ps in `ps -ef | grep $SERVER | grep -v grep | awk '{print $2}'`
do
	echo 'found $SERVER in process '$ps'. Now kill it...'
	kill -9 $ps
	echo done
done
;;

'restart')
	/etc/init.d/$RCDSERVER stop
	/etc/init.d/$RCDSERVER start	
;;

'rcinstall')
	sudo ln -sf $SERVERPATH /etc/init.d/.
	sudo update-rc.d -f $RCDSERVER start 99 2 3 4 5 .
;;

*)
echo "Usage: $0 { start | stop | restart | rcinstall }"
;;
esac
exit 0