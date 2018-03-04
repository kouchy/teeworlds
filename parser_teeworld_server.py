#!/usr/bin/env python3

# =============================================================================
# ==================================================================== PACKAGES

import json
import argparse

# ==================================================================== PACKAGES
# =============================================================================

# =============================================================================
# ================================================================== PARAMETERS

parser = argparse.ArgumentParser(prog='aff3ct-test-regression', formatter_class=argparse.ArgumentDefaultsHelpFormatter)
parser.add_argument('--log', action='store', dest='logFile',  type=str, default="tw.log",    help='Path to the new log file.'        )
parser.add_argument('--old', action='store', dest='oldStats', type=str, default="old_stats", help='Path to the old stats file.'      )
parser.add_argument('--out', action='store', dest='outFile',  type=str, default="new_stats", help='Path to the generated stats file.')

args = parser.parse_args()

# ================================================================== PARAMETERS
# =============================================================================

stats = {}

# =============================================================================
# =============================================================== GET OLD STATS

with open(args.oldStats) as oldStatsFile:
	try :
		stats = json.load(oldStatsFile)
	except ValueError:
		pass


# =============================================================== GET OLD STATS
# =============================================================================



# =============================================================================
# =================================================================== FUNCTIONS

def initPlayer(playerKey, stats):
	if not playerKey in stats.keys():
		stats[playerKey] = {}
		stats[playerKey]['suicide'] = {'number' : 0, 'weapon' : {'world': 0, 'grenade': 0}, 'with_flag': 0}
		stats[playerKey]['kill'   ] = {'number' : 0, 'weapon' : {'laser': 0, 'ninja': 0, 'grenade': 0, 'gun': 0, 'hammer': 0, 'pump': 0}, 'player' : {}, 'flag_defense': 0, 'flag_attack': 0}
		stats[playerKey]['death'  ] = {'number' : 0, 'weapon' : {'laser': 0, 'ninja': 0, 'grenade': 0, 'gun': 0, 'hammer': 0, 'pump': 0}, 'player' : {}, 'with_flag': 0}
		stats[playerKey]['item'   ] = {'heart': 0, 'armor': 0, 'laser': 0, 'ninja': 0, 'grenade': 0, 'pump': 0}
		stats[playerKey]['flag'   ] = {'grab': 0, 'return': 0, 'capture': 0}
		stats[playerKey]['ratio'  ] = {'kill': 0, 'flag': 0}


def getWeaponName(weapon):
	if weapon == "-1":
		return 'world'
	elif weapon == "0":
		return 'hammer'
	elif weapon == "1":
		return 'gun'
	elif weapon == "2":
		return 'pump'
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


# =================================================================== FUNCTIONS
# =============================================================================



# =============================================================================
# =============================================================== PARSE NEW LOG

with open(args.logFile) as logFile:
	for logline in logFile:
		log = logline.split(": ",1)


		if log[0].find("game") == -1:
			continue

		logType = log[1].split(" ",1)

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
				continue

			specialPosStart = weaponPosEnd + 9
			specialPosEnd   = logType[1].find("\n",specialPosStart+1)
			specialName     = logType[1][weaponPosStart:weaponPosEnd]


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

			continue

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

			continue

		elif logType[0].find("flag") == 0:
			if len(logType) == 1: # == "flag_return\n" -> flag returned automatically
				continue

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

			continue
# =============================================================== PARSE NEW LOG
# =============================================================================


# =============================================================================
# =========================================================== COMPUTE NEW RATIO

for playerName in stats.keys():
	stats[playerName]['ratio']['kill'] = stats[playerName]['kill']['number' ] * 1.0 / (stats[playerName]['death']['number'] + stats[playerName]['suicide']['number'])
	stats[playerName]['ratio']['flag'] = stats[playerName]['flag']['capture'] * 1.0 / stats[playerName]['flag']['grab']


# =========================================================== COMPUTE NEW RATIO
# =============================================================================


with open(args.outFile, 'w') as outStatsFile:
    json.dump(stats, outStatsFile, indent=4, sort_keys=True)
