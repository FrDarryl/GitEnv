#!/bin/bash

set -o noclobber
set -o vi
#set -x

fileArray=(~/.bashrc.envars ~/.bashrc.commands)
for file in ${fileArray[@]}
do
    if [ -f ${file} ]
    then
        . ${file}
    fi
done

[ `type -t setPrompt` == 'function' ] && setPrompt

#http://serverfault.com/questions/485487/use-bashrc-without-breaking-sftp
if [[ $- == *i* ]]; then
#   To see fortunes when this runs, install fortune packages and do a 'touch ~/.fortune'
    [ -f ~/.fortune ] && [ -f /usr/games/fortune ] && /usr/games/fortune -s
fi

[ -f /opt/perl5/etc/bashrc ] && export PERLBREW_ROOT=/opt/perl5 && source /opt/perl5/etc/bashrc

#THIS MUST BE AT THE END OF THE FILE FOR SDKMAN TO WORK!!!
export SDKMAN_DIR="/home/frdarryl/.sdkman"
[[ -s "/home/frdarryl/.sdkman/bin/sdkman-init.sh" ]] && source "/home/frdarryl/.sdkman/bin/sdkman-init.sh"
