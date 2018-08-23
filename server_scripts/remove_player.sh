#!/bin/bash

# hack to work when called by the PHP...
if [ -z "$HOME" ]
then
	export HOME="/home/teeworlds"
fi

STATUS=$($HOME/scripts/teeworlds_server.sh status)
if [ "$STATUS" == "Running" ]
then
	exit 1
fi

player_name=$1

(
	flock -n 9 || exit 1

	# ... commands executed under lock ...
	while IFS= read -d $'\0' -r file ; do
		if [ -f $file ]; then
	        python3 $HOME/teeworlds_repo/parser_teeworld_server.py --act delete --old $file --out $file --arg "$player_name"
	    fi
	done < <(find $HOME/stats/ -print0)

) 9>/tmp/.lock_teeworlds_remove_player