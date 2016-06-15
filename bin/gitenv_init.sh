#!/bin/bash

cd /home/${USER}

gitenvDir="${PWD}/gitenv"

if [ -L bin ]; then
    echo "Deleting existing symlink ${PWD}/bin"
    rm bin
fi

echo "Creating ${PWD}/bin (symbolic link to ${gitenvDir}/bin)"
ln -s ${gitenvDir}/bin ./

for gitenvDotfile in ${gitenvDir}/dotfiles/.*;
do
    echo "Found ${gitenvDotfile}"
    dotfileBasename="$(basename ${gitenvDotfile})"
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
    echo "..Creating ${PWD}/${dotfileBasename} (symbolic link to ${gitenvDotfile})"
    ln -s ${gitenvDotfile} ./${dotfileBasename}
done
