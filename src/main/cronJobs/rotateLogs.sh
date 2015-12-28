#!/bin/bash
#
# 20150636: Johannes Mainusch
# rotate logs
#
cd /home/pi/production/smartMeter/data
ds=`date -d "yesterday" +%Y-%m-%d`
if [ -a data.$ds ]
	then
	# echo "file data.$ds is already there, I will exit 0"
	exit 0
fi

# grep yesterdays data into file data.$ds
grep $ds gotResults.json > data.$ds

# now truncate the gotResults.json file
sed -i -n '/'$ds'/,$p' gotResults.json

# rsync the data files to server 'freudnluis'
# ...
cd /home/pi/production/smartMeter/data
#
json="["
sep=""
for file in *; do
    file=${file//\\/\\\\}
    file=${file//\"/\\\"}  
    printf -v json '%s%s"%s"' "$json" "$sep" "$file"
    sep=,
done
json+="]"
echo $json > ls.json
#
TARGET_SSH_PORT=22
TARGETSERVER=krukas.dyn.amicdns.de
rsync -R -ave 'ssh -p '$TARGET_SSH_PORT . pi@$TARGETSERVER:public_html/smartMeter/data/.
