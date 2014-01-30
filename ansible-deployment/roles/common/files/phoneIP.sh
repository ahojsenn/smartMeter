#!/bin/sh
# by docjoe, 20130529
#
myWlanIP=`ip a s dev wlan0 | grep 'inet ' | tail -n1 | cut -d" " -f6 | cut -d"/" -f1`
myEth0IP=`ip a s dev eth0  | grep 'inet ' | tail -n1 | cut -d" " -f6 | cut -d"/" -f1`
myDate=`date +"%Y:%m:%d-%T"`
myHostname=`hostname`

echo $myDate $myHostname $myWlanIP $myEth0IP 
echo "I will wget this to as web server via cron"

curl -m 5 "http://krukas.no-ip.org:43080/phoneIP?myHostname=$myHostname&myDate=$myDate&myEth0IP=$myEth0IP&myWlanIP=$myWlanIP"

