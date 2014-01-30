#!/bin/bash
#
if [ -e /etc/profile.d/raspi-config.sh ]; then
    rm -f /etc/profile.d/raspi-config.sh
    sed -i /etc/inittab \
      -e "s/^#\(.*\)#\s*RPICFG_TO_ENABLE\s*/\1/" \
      -e "/#\s*RPICFG_TO_DISABLE/d"
    telinit q
fi
  
exit 0