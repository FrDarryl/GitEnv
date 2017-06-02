#!/bin/bash

usage() { echo "Usage: $0 -e (optionally use Eclim) -c|g|q (curses|gtk|qt) -s (standalone editor - no client/server editing) -f (must be last) file1 file2 ... filen" 1>&2; exit 1; }

useEclim="n"
useServer="n"
vim_bin="vim"

while true; do
    case $1 in
        -c)
            vim_bin="vim"
            shift
            ;;
        -e)
            useEclim="y"
            echo "Using eclimd Daemon"
            shift
            ;;
        -g)
            vim_bin="gvim"
            shift
            ;;
        -h)
            usage
            ;;
        -q)
            vim_bin="qvim"
            shift
            ;;
        -s)
            useServer="n"
            echo "Not using ${vim_bin} server VIM"
            shift
            ;;
        -*)
            usage
            ;;
        *)
            #Trailing filename(s) assumed
            break
            ;;
    esac
done

if [ "${useEclim}" == "y" ]; then
    if [ ! `which Xvfb` ]; then
        echo "No Xvfb binary found. cygwin: apt-cyg install xorg-server-extra, Ubuntu: apt-get install Xvfb"
        exit 1
    fi
    if [ ! `pgrep Xvfb` ]; then
        echo "Starting X11 Virtual Frame Buffer (Xvfb) daemon..."
        Xvfb :1 -screen 0 1024x768x24 &
        sleep 5
    else
        echo "X11 Virtual Frame Buffer (Xvfb) daemon is already running..."
    fi
    if [ ! `which eclimd` ]; then
        echo "No eclim binary found. Try wget http://downloads.sourceforge.net/project/eclim/eclim/2.4.0/eclim_2.4.0.jar && java -Dvim.files=$HOME/.vim -Declipse.home=$HOME/eclipse/eclipse_luna -jar eclim_2.4.0.jar install"
        exit 1
    fi
    if [ ! `pgrep eclimd` ]; then
        echo "Starting eclimd daemon..."
        DISPLAY=:1 eclimd -b
        sleep 5
    else
        echo "eclimd server is already running..."
    fi
fi

if [ "${useServer}" == "y" ]; then
    if [ ! `pgrep -f "${vim_bin} --servername VIM"` ]; then
        echo "Starting vim server (procname VIM)..."
        ${vim_bin} --servername VIM
        sleep 5
    else
        echo "Vim server (procname VIM) already running..."
    fi
    if [ $1 ]; then
#       echo "Editing ${@}."
        ${vim_bin} --servername VIM --remote-tab "${@}"
    fi
else
    ${vim_bin} "${@}"
fi
