#!/bin/bash

# GPIO Test script
# Set up GPIO 4 and set to output

clear
if [ $# -eq 0 ]
  then
    echo "usage: sudo ./test-gpio <input-pin>"
    exit 0
fi

echo "setting pin #"$1" to input"

# Set up GPIO $1 and set to input
# mkdir -p /sys/class/gpio/gpio$1
echo $1 > /sys/class/gpio/unexport
echo $1 > /sys/class/gpio/export
echo "in" > /sys/class/gpio/gpio$1/direction


# Read from input
cat /sys/class/gpio/gpio$1/value 

done=0
while [ "x${done}" = x0 ]; do
  echo "gpio $1 has value: " `cat /sys/class/gpio/gpio$1/value` 

  echo -n "Would you like to quit? [q/Q]: "  
  read  answer 
  if [ "x${answer}" = xq ] || [ "x${answer}" = xQ ]; then
    done=1
  else
    clear
    echo `date +%H%M%S%N`": one more time..."
  fi
done



# Clean up
echo $1 > /sys/class/gpio/unexport

echo " "
echo " "
echo " "
exit 0