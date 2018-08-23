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

oldplayer_name=$1
newplayer_name=$2

(
	flock -n 9 || exit 1

	# ... commands executed under lock ...
	while IFS= read -d $'\0' -r file ; do
		if [ -f $file ]; then
			python3 $HOME/teeworlds_repo/parser_teeworld_server.py --act rename --old $file --out $file --arg "$oldplayer_name" --new "$newplayer_name"
		fi
	done < <(find $HOME/stats/ -print0)

) 9>/tmp/.lock_teeworlds_rename_player
