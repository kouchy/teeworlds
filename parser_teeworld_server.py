#!/usr/bin/env python3

# This program parse the logs of a teeworlds server in real time and return statistics on player in a JSON format.
# Run:  $ python3 parser_teeworld_server.py --act help
# to display the whole story help message.

# =============================================================================
# ==================================================================== PACKAGES
import sys
import signal
import time
import json
import argparse
import datetime
# ==================================================================== PACKAGES
# =============================================================================


# =============================================================================
# =============================================================== GLOBAL VALUES

current_stats = {}
players_in_game = {}
outFile = ""
deletedPlayerName = "__deletedplayer__" # this name is too long for a teeworlds name so nobody can take it

# =============================================================== GLOBAL VALUES
# =============================================================================


# =============================================================================
# =================================================================== FUNCTIONS
def parseArguments():

	parser = argparse.ArgumentParser(prog='parser_teeworld_server', formatter_class=argparse.ArgumentDefaultsHelpFormatter)
	parser.add_argument('--act',  action='store',      dest='action', required=True, choices=["stdin", "log", "json", "rename", "merge", "delete", "help"])
	parser.add_argument('--out',  action='store',      dest='out',    required=True, type=str)
	parser.add_argument('--old',  action='store',      dest='old',    type=str)
	parser.add_argument('--new',  action='store',      dest='new',    type=str)
	parser.add_argument('--arg',  action='store',      dest='arg',    type=str)
	parser.add_argument('--echo', action='store_true', dest='echo')

	return parser.parse_args()


def printHelp():
	print(" This program parse the logs of a teeworlds server in real time and return statistics on player in a JSON format.              ");
	print(" This script can also parse a server's log file to return stats. It can also merge several stats together.                     ");
	print(" To select the action to realize, use the '--act' argument:                                                                    ");
	print("                                                                                                                               ");
	print("    * stdin  : This action parses in real time the server's log. Use a piped '|' command.                                      ");
	print("               In this mode, the parser will create a daily file with a header given in the '--out' argument                   ");
	print("                 $ ./teeworlds_server | python3 parser_teeworld_server.py --act stdin --out stats                              ");
	print("               Then a stats JSON file will be created everyday with such a name 'stats_20180718.json'                          ");
	print("               Output stats file are updated every 0.5 s if anything happens on the server log. So sometimes the JSON          ");
	print("               file may not appear updated even if player actions are took into account. Just do another action after          ");
	print("               this half second.                                                                                               ");
	print("               You can also use given an old JSON stats file to complete with the '--old' argument:                            ");
	print("                 $ ./teeworlds_server | python3 parser_teeworld_server.py --act stdin --out stats.json --old old_stats.json    ");
	print("               In this mode, the parser loads stats from the old file, and completes them with new logs in real time           ");
	print("               from the server, to dump them in the given filename in the '--out' argument (!!not a daily one!!).              ");
	print("               You can also use the '--echo' argument to print the server logs, else they are hidden.                          ");
	print("                                                                                                                               ");
	print("    * log    : This action parses a server log file given through the '--new' argument, and return the stats in the            ");
	print("               file given in the '--out' argument:                                                                             ");
	print("                 $ python3 parser_teeworld_server.py --act log --new new_server_logs_filename --out stats.json                 ");
	print("               You can also add a JSON stats file in the '--old' argument to load them first and complete them with the        ");
	print("               new log. The game time count is deactivated in this mode.                                                       ");
	print("                                                                                                                               ");
	print("    * json   : This action load a JSON stats file given through the '--old' argument, and another through the '--new'          ");
	print("               argument and merge them into a unique JSON stats file given in the '--out' argument:                            ");
	print("                 $ python3 parser_teeworld_server.py --act json --new stats1.json --old stats2.json --out merged_stats.json    ");
	print("                                                                                                                               ");
	print("    * rename : This action load a JSON stats file given through the '--old' argument, to rename a player. The current player   ");
	print("               name is given in the '--arg' argument and its new name is given in the '--new' argument:                        ");
	print("                 $ python3 parser_teeworld_server.py --act rename --old stats.json --out newstats.json --arg oldname --new newname");
	print("               The '--out' argument gives the output filename.                                                                 ");
	print("                                                                                                                               ");
	print("    * merge  : This action load a JSON stats file given through the '--old' argument, to merge two players. The first player   ");
	print("               name that will disappear is given in the '--arg' argument and the second name that will receive those values    ");
	print("               is given in the '--new' argument:                                                                               ");
	print("                 $ python3 parser_teeworld_server.py --act merge --old stats.json --out newstats.json --arg name1 --new name2  ");
	print("               The '--out' argument gives the output filename.                                                                 ");
	print("                                                                                                                               ");
	print("    * delete : This action load a JSON stats file given through the '--old' argument, to delete a player. The player name to   ");
	print("               delete is given in the '--arg' argument:                                                                        ");
	print("                 $ python3 parser_teeworld_server.py --act delete --old stats.json --out newstats.json --arg name              ");
	print("               The '--out' argument gives the output filename. To keep balance in the stats, this player will appear with a    ");
	print("               special name in the other player's stats (__deletedplayer__).                                                   ");
	print("                                                                                                                               ");
	print("    * help : display this help message.                                                                                        ");
	print("                                                                                                                               ");
	print(" Notes on the parsing of server logs:                                                                                          ");
	print("  * When a player is alone in the game, only game time and flag racing/capture time are saved. Game stats are ignored (suicide,");
	print("     flag grap/capture, picked up items, ...)                                                                                  ");
	print("  * When a player is 'spectator' its game time does not increase.                                                              ");


def initPlayer(playerKey, stats):
	if not playerKey in stats.keys():
		stats[playerKey] = {}
		stats[playerKey]['suicide'] = {'number' : 0, 'weapon' : {'world': 0, 'grenade': 0}, 'with_flag': 0}
		stats[playerKey]['kill'   ] = {'number' : 0, 'weapon' : {'laser': 0, 'ninja': 0, 'grenade': 0, 'gun': 0, 'hammer': 0, 'shotgun': 0}, 'player' : {}, 'flag_defense': 0, 'flag_attack': 0}
		stats[playerKey]['death'  ] = {'number' : 0, 'weapon' : {'laser': 0, 'ninja': 0, 'grenade': 0, 'gun': 0, 'hammer': 0, 'shotgun': 0}, 'player' : {}, 'with_flag': 0}
		stats[playerKey]['item'   ] = {'heart': 0, 'armor': 0, 'laser': 0, 'ninja': 0, 'grenade': 0, 'shotgun': 0}
		stats[playerKey]['flag'   ] = {'grab': 0, 'return': 0, 'capture': 0, 'min_time': 0.}
		stats[playerKey]['ratio'  ] = {'kill': None, 'flag': None}
		stats[playerKey]['game'   ] = {'time': 0, 'team': "", 'win': 0, 'lost': 0}


def getWeaponName(weapon):
	if weapon == "-1":
		return 'world'
	elif weapon == "0":
		return 'hammer'
	elif weapon == "1":
		return 'gun'
	elif weapon == "2":
		return 'shotgun'
	elif weapon == "3":
		return 'grenade'
	elif weapon == "4":
		return 'laser'
	elif weapon == "5":
		return 'ninja'
	else: # killed by the server or team change
		return 'server'


def getItemName(item):
	if item == "0":
		return 'heart'
	elif item == "1":
		return 'armor'
	elif item == "2":
		return 'weapon'
	elif item == "3":
		return 'ninja'


def playerEnterTime(playerName):

	enterTime = time.time()

	global players_in_game

	try:
		if players_in_game[playerName] == 0:
			players_in_game[playerName] = enterTime
		# else ignored because already in the game

	except KeyError:
		players_in_game[playerName] = enterTime


def playerLeaveTime(playerName):

	global players_in_game

	try:
		if players_in_game[playerName] == 0:
			return 0
		else:
			game_time = int(time.time() - players_in_game[playerName]); # difference is a float converted to an integer [seconds]
			players_in_game[playerName] = 0
			return game_time

	except KeyError:
		return 0


def countNumPlayersInGame():

	count = 0
	for playerName in players_in_game.keys():
		if players_in_game[playerName] != 0:
			count += 1

	return count


def parseLogLine(logline, stats, countGameTime=True, outFile=""):

	logTitle = logline.split(": ",1)

	if logTitle[0].find("game") != -1 and countNumPlayersInGame() > 1:

		logType = logTitle[1].split(" ",1)

		if logType[0] == "kill":

			killerPosStart = logType[1].find(":") +1
			killerPosEnd   = logType[1].find("\' victim=\'",killerPosStart+1)
			killerName     = logType[1][killerPosStart:killerPosEnd]


			victimPosStart = logType[1].find(":", killerPosEnd + 10) +1
			victimPosEnd   = logType[1].find("\' weapon=",victimPosStart+1)
			victimName     = logType[1][victimPosStart:victimPosEnd]

			weaponPosStart = victimPosEnd + 9
			weaponPosEnd   = logType[1].find(" ",weaponPosStart+1)
			weaponName     = getWeaponName(logType[1][weaponPosStart:weaponPosEnd])

			if weaponName == 'server': # killed by the server or team change so ignore it
				return

			specialPosStart = weaponPosEnd + 9
			specialName     = logType[1][specialPosStart]


			initPlayer(killerName, stats)
			initPlayer(victimName, stats)

			if killerName == victimName: # then a suicide
				stats[killerName]['suicide']['number'] += 1
				stats[killerName]['suicide']['weapon'][weaponName] += 1

				if specialName == "3":
					stats[killerName]['suicide']['with_flag'] += 1
			else:
				stats[killerName]['kill']['number'] += 1
				stats[killerName]['kill']['weapon'][weaponName] += 1

				try:
					stats[killerName]['kill']['player'][victimName] += 1
				except KeyError:
					stats[killerName]['kill']['player'][victimName] = 1


				stats[victimName]['death']['number'] += 1
				stats[victimName]['death']['weapon'][weaponName] += 1

				try:
					stats[victimName]['death']['player'][killerName] += 1
				except KeyError:
					stats[victimName]['death']['player'][killerName] = 1

				if specialName == "3": # the killer and the victim had the flag
					stats[victimName]['death']['with_flag'] += 1
					stats[killerName]['kill' ]['flag_defense'] += 1
					stats[killerName]['kill' ]['flag_attack'] += 1

				elif specialName == "2": # the killer had the flag
					stats[killerName]['kill' ]['flag_defense'] += 1

				elif specialName == "1": # the victim had the flag
					stats[killerName]['kill' ]['flag_attack'] += 1
					stats[victimName]['death']['with_flag'] += 1

			return

		elif logType[0] == "pickup":

			playerPosStart = logType[1].find(":") +1
			playerPosEnd   = logType[1].find("\' item=",playerPosStart+1)
			playerName     = logType[1][playerPosStart:playerPosEnd]

			initPlayer(playerName, stats)

			itemName = getItemName(logType[1][playerPosEnd + 7])

			if itemName == 'weapon':
				weaponName = getWeaponName(logType[1][playerPosEnd + 9])
				stats[playerName]['item'][weaponName] += 1
			else:
				stats[playerName]['item'][itemName] += 1

			return

		elif logType[0].find("flag") == 0:
			if len(logType) == 1: # == "flag_return\n" -> flag returned automatically
				return

			playerPosStart = logType[1].find(":") +1
			playerPosEnd   = logType[1].find("\'\n",playerPosStart+1)
			playerName     = logType[1][playerPosStart:playerPosEnd]

			initPlayer(playerName, stats)

			if logType[0] == "flag_grab":
				stats[playerName]['flag']['grab'] += 1
			elif logType[0] == "flag_capture":
				stats[playerName]['flag']['capture'] += 1
			elif logType[0]== "flag_return":
				stats[playerName]['flag']['return'] += 1

			return

	elif logTitle[0].find("chat") != -1:

		message = logTitle[1]

		if message.find("flag was captured") != -1: # [5b4622aa][chat]: *** The red flag was captured by 'Badmom' (9.56 seconds)

			playerPosStart = message.find("\'") +1
			playerPosEnd   = message.find("\' (", playerPosStart+1)
			playerName     = message[playerPosStart:playerPosEnd]

			timePosStart = message.find("(", playerPosEnd+1) +1
			if timePosStart == 0:
				return;

			timePosEnd = message.find(" seconds)", timePosStart+1)
			flagTime   = message[timePosStart:timePosEnd]

			initPlayer(playerName, stats)

			flagTime = float(flagTime)

			if stats[playerName]['flag']['min_time'] == 0.:
				stats[playerName]['flag']['min_time'] = flagTime
			else:
				m = min(stats[playerName]['flag']['min_time'], flagTime)
				stats[playerName]['flag']['min_time'] = m

			return;

		elif message.find("joined the ") != -1: # [5b4621d5][chat]: *** 'Badmom' joined the blue team
			playerPosStart = message.find("\'") +1
			playerPosEnd   = message.find("\' ", playerPosStart+1)
			playerName     = message[playerPosStart:playerPosEnd]

			initPlayer(playerName, stats)

			if countGameTime:
				stats[playerName]['game']['time'] += playerLeaveTime(playerName)

			teamName = ""

			if message.find("spectators", playerPosEnd+1) != -1: # [5b4627ba][chat]: *** 'Badmom' joined the spectators
				teamName = "spectators"

			elif message.find("team", playerPosEnd+1) != -1: # [5b4621d5][chat]: *** 'Badmom' entered and joined the blue team
				playerEnterTime(playerName)

				teamPosStart = message.find("joined the ", playerPosStart+1) + 11
				teamPosEnd   = message.find(" team", teamPosStart+1)
				teamName     = message[teamPosStart:teamPosEnd]

			elif message.find("game", playerPosEnd+1) != -1: # [5b4621c7][chat]: *** 'Badmom' entered and joined the game
				playerEnterTime(playerName)
				teamName = "online"

			else:
				teamName = "online"


			stats[playerName]['game']['team'] = teamName

			return

		elif message.find("has left the game") != -1: # [5b461feb][chat]: *** 'Badmom' has left the game
			playerPosStart = message.find("\'") +1
			playerPosEnd   = message.find("\' has", playerPosStart+1)
			playerName     = message[playerPosStart:playerPosEnd]

			initPlayer(playerName, stats)

			if countGameTime:
				stats[playerName]['game']['time'] += playerLeaveTime(playerName)

			stats[playerName]['game']['team'] = ""

			dumpStats(stats) # dump the stats to prevent the case where the last player left then the server returns nothing else

			return


def recursiveMerge(oldDict, newDict):
	for k, v in newDict.items():
		if isinstance(v, dict):
			recursiveMerge(oldDict[k], newDict[k])
		else:
			try:
				oldDict[k] += newDict[k]
			except KeyError:
				oldDict[k] = newDict[k]


def mergeStats(stats, newStats):
	for playerName in newStats.keys():
		if not playerName in stats.keys():
			stats[playerName] = newStats[playerName]

		else:
			# manage the min flag time
			oldflagT =    stats[playerName]['flag']['min_time']
			newflagT = newStats[playerName]['flag']['min_time']
			saveFlagT = 0

			if oldflagT == 0:
				saveFlagT = newflagT
			elif newflagT == 0 :
				saveFlagT = oldflagT
			else:
				saveFlagT = min(newflagT, oldflagT)

			recursiveMerge(stats[playerName], newStats[playerName])


			stats[playerName]['flag']['min_time'] = saveFlagT


def deletePlayer(stats, oldName):
	if not oldName in stats.keys():
		print("Warning, given player name to delete '" + oldName + "' has not been found in the given stats.")
		return

	del stats[oldName]

	for playerName in stats.keys():
		if oldName in stats[playerName]['kill']['player']:
			try:
				stats[playerName]['kill']['player'][deletedPlayerName] += stats[playerName]['kill']['player'][oldName]
			except KeyError:
				stats[playerName]['kill']['player'][deletedPlayerName] = stats[playerName]['kill']['player'][oldName]

			del stats[playerName]['kill']['player'][oldName]

		if oldName in stats[playerName]['death']['player']:
			try:
				stats[playerName]['death']['player'][deletedPlayerName] += stats[playerName]['death']['player'][oldName]
			except KeyError:
				stats[playerName]['death']['player'][deletedPlayerName] = stats[playerName]['death']['player'][oldName]

			del stats[playerName]['death']['player'][oldName]


def mergePlayer(stats, oldName, newName):
	if not oldName in stats.keys():
		print("Error, given player name 1 to merge '" + oldName + "' has not been found in the given stats.")
		return

	if not newName in stats.keys():
		print("Error, given player name 2 to merge '" + newName + "' has not been found in the given stats.")
		return

	tempstats = {}
	tempstats[newName] = stats[oldName]

	del stats[oldName]

	mergeStats(stats, tempstats)


	for playerName in stats.keys():
		if oldName in stats[playerName]['kill']['player']:
			try:
				stats[playerName]['kill']['player'][newName] += stats[playerName]['kill']['player'][oldName]
			except KeyError:
				stats[playerName]['kill']['player'][newName] = stats[playerName]['kill']['player'][oldName]

			del stats[playerName]['kill']['player'][oldName]

		if oldName in stats[playerName]['death']['player']:
			try:
				stats[playerName]['death']['player'][newName] += stats[playerName]['death']['player'][oldName]
			except KeyError:
				stats[playerName]['death']['player'][newName] = stats[playerName]['death']['player'][oldName]

			del stats[playerName]['death']['player'][oldName]


def renamePlayer(stats, oldName, newName):
	if not oldName in stats.keys():
		print("Error, given current player name '" + oldName + "' has not been found in the given stats.")
		return

	if newName in stats.keys():
		print("Error, given new player name '" + newName + "' already exists.")
		return

	stats[newName] = stats[oldName]
	del stats[oldName]

	for playerName in stats.keys():
		if oldName in stats[playerName]['kill']['player']:
			stats[playerName]['kill']['player'][newName] = stats[playerName]['kill']['player'][oldName]
			del stats[playerName]['kill']['player'][oldName]

		if oldName in stats[playerName]['death']['player']:
			stats[playerName]['death']['player'][newName] = stats[playerName]['death']['player'][oldName]
			del stats[playerName]['death']['player'][oldName]


def computeRatios(stats):
	for playerName in stats.keys():
		total_death = (stats[playerName]['death']['number'] + stats[playerName]['suicide']['number'])
		if total_death != 0:
			stats[playerName]['ratio']['kill'] = stats[playerName]['kill']['number' ] * 1.0 / total_death
		else:
			stats[playerName]['ratio']['kill'] = None

		if stats[playerName]['flag']['grab'] != 0:
			stats[playerName]['ratio']['flag'] = stats[playerName]['flag']['capture'] * 1.0 / stats[playerName]['flag']['grab']
		else:
			stats[playerName]['ratio']['flag'] = None


def dumpStats(stats):
	computeRatios(stats)

	with open(outFile, 'w') as outStatsFile:
	    json.dump(stats, outStatsFile, indent=4, sort_keys=True)


def signal_handler(sig, frame):
	dumpStats(current_stats)
	sys.exit(0)


def getOutFileName(header, date):
	return header + "_" + ('%04d' % date.year) + ('%02d' % date.month) + ('%02d' % date.day) + ".json"

# =================================================================== FUNCTIONS
# =============================================================================

def run(args):

	print('Teeworld server parser')
	print('------------')
	print('')
	print('Parameters:')
	print('action         =', args.action)
	print('new stats file =', args.new   )
	print('old stats file =', args.old   )
	print('output path    =', args.out   )
	print('echo           =', args.echo  )
	print('')

	global outFile
	global current_stats

	outFile = args.out


	signal.signal(signal.SIGINT, signal_handler)


	# get old stats
	if args.old is not None:
		with open(args.old) as oldStatsFile:
			current_stats = json.load(oldStatsFile)

	create_dayly_file = args.old is None;


	if args.action == "stdin":
		dump_time = time.time()

		if create_dayly_file:
			current_date = datetime.date.today()
			outFile = getOutFileName(args.out, current_date)

			try :
				with open(outFile) as oldStatsFile:
					current_stats = json.load(oldStatsFile)

				print("parser: load today stats: " + outFile)

			except IOError:
				print("parser: new output filename: " + outFile)


		# read standard input
		for log in map(str.rstrip, sys.stdin):
			if args.echo:
				print("server: " + log)

			parseLogLine(log, current_stats, True, args.out)

			if (dump_time + 0.5) < time.time():
				if create_dayly_file and current_date != datetime.date.today(): # the day changed
					dumpStats(current_stats) # save correctly the old stats before changing of file name
					current_date = datetime.date.today()
					outFile = getOutFileName(args.out, current_date)
					print("parser: new output filename: " + outFile)
					current_stats = {}

				dumpStats(current_stats)
				dump_time = time.time()


	elif args.action == "log":
		# read server log file
		with open(args.new) as logFile:
			for log in logFile:
				parseLogLine(log, current_stats, False, "")


	elif args.action == "json":
		with open(args.new) as newStatsFile:
			mergeStats(current_stats, json.load(newStatsFile))


	elif args.action == "rename":
		renamePlayer(current_stats, args.arg, args.new)


	elif args.action == "merge":
		mergePlayer(current_stats, args.arg, args.new)


	elif args.action == "delete":
		deletePlayer(current_stats, args.arg)


	else:
		raise ValueError('args.action is unknown.')

	dumpStats(current_stats)



if __name__ == '__main__':

	args = parseArguments()

	if args.action == "help" :
		printHelp()

	else:
		run(args)