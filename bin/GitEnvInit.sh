#!/bin/bash

cd /home/${USER}
for gitEnvDotfile in ${PWD}/gitenv/dotfiles/.*;
do
    echo "Found ${gitEnvDotfile}"
    dotfileBasename="$(basename ${gitEnvDotfile})"
    if [ ${dotfileBasename} = "." ] || [ ${dotfileBasename} = ".." ]; then
       continue
    fi
    if [ -L ${dotfileBasename} ]; then
        echo "..Deleting existing symlink ${PWD}/${dotfileBasename}"
        rm ${dotfileBasename}
    elif [ -f ${dotfileBasename} ]; then
        echo "..Renaming existing ${PWD}/${dotfileBasename} to ${PWD}/${dotfileBasename}.factory"
        mv ${dotfileBasename} ${dotfileBasename}.factory
    fi
    echo "..Creating ${PWD}/${dotfileBasename} (symbolic link to ${gitEnvDotfile})"
    ln -s ${gitEnvDotfile} ./${dotfileBasename}
done
