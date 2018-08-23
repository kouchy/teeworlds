#!/bin/bash

# hack to work when called by the PHP...
if [ -z "$HOME" ]
then
	export HOME="/home/teeworlds"
fi

STATUS=$($HOME/scripts/teeworlds_server.sh status)
if [ "$STATUS" == "Stopped" ]
then
	exit 1
fi

TODAY=`date +%Y%m%d`
YESTERDAY=`date +%Y%m%d -d "yesterday"`

maps=( "csn7" "log1" )

(
	flock -n 9 || exit 1

	# ... commands executed under lock ...
	for map in "${maps[@]}"
	do
		python3 $HOME/teeworlds_repo/parser_teeworld_server.py --act json --new $HOME/stats/daily/stats_${TODAY}_${map}.json --old $HOME/stats/total/stats_${YESTERDAY}_${map}.json --out $HOME/stats/total/stats_${TODAY}_${map}.json
	done

) 9>/tmp/.lock_teeworlds_update_total_stats