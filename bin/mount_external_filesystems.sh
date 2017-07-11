#!/bin/bash

deviceId=`fdisk -l | grep 16G | cut -f 1 -d' '`
if [ -n "${deviceId}" ]; then
    mount ${deviceId} /media/frdarryl/usb-fd
fi
deviceI=`fdisk -l | grep 149G | cut -f 1 -d' '`
if [ -n "${deviceId}" ]; then
    mount ${deviceId} /media/frdarryl/usb-hd
fi
