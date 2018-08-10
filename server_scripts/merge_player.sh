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

player_name1=$1 # name of the player to merge into the other
player_name2=$2

while IFS= read -d $'\0' -r file ; do
	if [ -f $file ]; then
        python3 $HOME/teeworlds_repo/parser_teeworld_server.py --act merge --old $file --out $file --arg "$player_name1" --new "$player_name2"
        python3 $HOME/teeworlds_repo/parser_teeworld_server.py --act rename --old $file --out $file --arg "$player_name1" --new "$player_name2"
    fi
done < <(find $HOME/stats/ -print0)
