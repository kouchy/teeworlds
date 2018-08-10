#!/bin/bash

# hack to work when called by the PHP...
if [ -z "$HOME" ]
then
	export HOME="/home/teeworlds"
fi

COMMAND=$1
STATUS=$(screen -list | grep Teeworlds)

if [ "$COMMAND" == "start" ]
then
	if [ -z "$STATUS" ]
	then
		screen -S Teeworlds -dm bash -c '$HOME/teeworlds_repo/teeworlds_srv_d -f $HOME/server.cfg | $HOME/teeworlds_repo/parser_teeworld_server.py --echo --out $HOME/stats/daily/stats --act stdin'
		echo "Teeworlds is running."
	else
		echo "You can't start Teeworlds because it is running."
		exit 1
	fi
else
	if [ "$COMMAND" == "stop" ]
	then
		if [ -z "$STATUS" ]
		then
			echo "You can't stop Teeworlds because it is not running."
			exit 1
		else
			$HOME/scripts/update_total_stats.sh
			killall -s INT python3
			killall -s INT teeworlds_srv_d
			screen -S Teeworlds -X quit
			echo "Teeworlds is stopped."
		fi
	else
		if [ "$COMMAND" == "status" ]
		then
			if [ -z "$STATUS" ]
			then
				echo "Stopped"
			else
				echo "Running"
			fi
		else
			echo "Supported options are: start, stop and status."
			exit 1
		fi
	fi
fi
