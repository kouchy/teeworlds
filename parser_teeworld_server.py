#!/usr/bin/env python3


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
# ================================================================== PARAMETERS

parser = argparse.ArgumentParser(prog='aff3ct-test-regression', formatter_class=argparse.ArgumentDefaultsHelpFormatter)
parser.add_argument('--act', action='store', dest='action',     choices=["stdin", "log", "json"], default="stdin", help="Action to execute during the merge with old stats (from server log given in standard input, a server log file, or another json stats file.")
parser.add_argument('--new', action='store', dest='newStats',   type=str,                                          help="Path to the new stats/log file to add to the old stats file (merge).")
parser.add_argument('--old', action='store', dest='oldStats',   type=str,                                          help="Path to the old stats file (if furnished, then do not create a stats file per day in 'stdin' action mode.")
parser.add_argument('--out', action='store', dest='outPath',    type=str,  default="stats",                        help="Path to the generated stats files (full name when act == 'log' or 'json', and only header when 'stdin'.")
parser.add_argument('--echo', action='store_true', dest='echo',                                                    help="Print the received standard input.")

args = parser.parse_args()

# ================================================================== PARAMETERS
# =============================================================================


# =============================================================================
# =============================================================== GLOBAL VALUES

current_stats = {}
dump_time = time.time()
outFile = args.outPath

players_in_game = {}


# =============================================================== GLOBAL VALUES
# =============================================================================


# =============================================================================
# =================================================================== FUNCTIONS

def initPlayer(playerKey, stats):
	if not playerKey in stats.keys():
		stats[playerKey] = {}
		stats[playerKey]['suicide'] = {'number' : 0, 'weapon' : {'world': 0, 'grenade': 0}, 'with_flag': 0}
		stats[playerKey]['kill'   ] = {'number' : 0, 'weapon' : {'laser': 0, 'ninja': 0, 'grenade': 0, 'gun': 0, 'hammer': 0, 'shotgun': 0}, 'player' : {}, 'flag_defense': 0, 'flag_attack': 0}
		stats[playerKey]['death'  ] = {'number' : 0, 'weapon' : {'laser': 0, 'ninja': 0, 'grenade': 0, 'gun': 0, 'hammer': 0, 'shotgun': 0}, 'player' : {}, 'with_flag': 0}
		stats[playerKey]['item'   ] = {'heart': 0, 'armor': 0, 'laser': 0, 'ninja': 0, 'grenade': 0, 'shotgun': 0}
		stats[playerKey]['flag'   ] = {'grab': 0, 'return': 0, 'capture': 0, 'min_time': 0.}
		stats[playerKey]['ratio'  ] = {'kill': 0, 'flag': 0}
		stats[playerKey]['game'   ] = {'time': 0, 'team': ""}


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

	try:
		if players_in_game[playerName] == 0:
			players_in_game[playerName] = enterTime
		# else ignored because already in the game

	except KeyError:
		players_in_game[playerName] = enterTime


def playerLeaveTime(playerName):

	try:
		if players_in_game[playerName] == 0:
			return 0
		else:
			game_time = int(time.time() - players_in_game[playerName]); # difference is a float converted to an integer [seconds]
			players_in_game[playerName] = 0
			return game_time

	except KeyError:
		return 0


def parseLogLine(logline, stats):

	logTitle = logline.split(": ",1)

	if logTitle[0].find("game") != -1:

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
			specialPosEnd   = logType[1].find("\n",specialPosStart+1)
			specialName     = logType[1][specialPosStart:specialPosEnd]


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

			stats[playerName]['game']['time'] += playerLeaveTime(playerName)
			stats[playerName]['game']['team'] = ""

			dumpStats(current_stats) # dump the stats in the case where the last player left then the server returns nothing else

			return


def merge_iterator(oldDict, newDict):
	for k, v in newDict.items():
		if isinstance(v, dict):
			merge_iterator(oldDict[k], newDict[k])
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
			merge_iterator(stats[playerName], newStats[playerName])

			# manage the min flag time
			oldflagT =    stats[playerName]['flag']['min_time']
			newflagT = newStats[playerName]['flag']['min_time']

			if oldflagT == 0.:
				stats[playerName]['flag']['min_time'] = newflagT
			elif newflagT != 0. :
				stats[playerName]['flag']['min_time'] = min(newflagT, oldflagT)

def computeRatios(stats):
	for playerName in stats.keys():
		total_death = (stats[playerName]['death']['number'] + stats[playerName]['suicide']['number'])
		if total_death != 0:
			stats[playerName]['ratio']['kill'] = stats[playerName]['kill']['number' ] * 1.0 / total_death

		if stats[playerName]['flag']['grab'] != 0:
			stats[playerName]['ratio']['flag'] = stats[playerName]['flag']['capture'] * 1.0 / stats[playerName]['flag']['grab']

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

if __name__ == '__main__':

	print('Teeworld server parser')
	print('------------')
	print('')
	print('Parameters:')
	print('action         =', args.action  )
	print('new stats file =', args.newStats)
	print('old stats file =', args.oldStats)
	print('output path    =', args.outPath )
	print('echo           =', args.echo    )
	print('')


	signal.signal(signal.SIGINT, signal_handler)


	# get old stats
	if args.oldStats is not None:
		with open(args.oldStats) as oldStatsFile:
			current_stats = json.load(oldStatsFile)

	create_dayly_file = args.oldStats is None;


	if args.action == "stdin":

		if create_dayly_file:
			current_date = datetime.date.today()
			outFile = getOutFileName(args.outPath, current_date)

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

			parseLogLine(log, current_stats)

			if (dump_time + 0.5) < time.time():
				if create_dayly_file and current_date != datetime.date.today(): # the day changed
					dumpStats(current_stats) # save correctly the old stats before changing of file name
					current_date = datetime.date.today()
					outFile = getOutFileName(args.outPath, current_date)
					print("parser: new output filename: " + outFile)
					current_stats = {}

				dumpStats(current_stats)
				dump_time = time.time()


	elif args.action == "log":
		# read server log file
		with open(args.logFile) as logFile:
			for log in logFile:
				parseLogLine(log, current_stats)


	elif args.action == "json":
		with open(args.newStats) as newStatsFile:
			mergeStats(current_stats, json.load(newStatsFile))

	else:
		raise ValueError('args.action is unknown.')

	dumpStats(current_stats)
