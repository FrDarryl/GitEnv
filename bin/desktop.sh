#!/bin/sh
`grep '^Exec' $1 | tail -1 | sed 's/^Exec=//' | sed 's/%.//' | sed 's/^"//g' | sed 's/" *$//g'` &
#https://askubuntu.com/questions/5172/running-a-desktop-file-in-the-terminal
