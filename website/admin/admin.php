<?php

$scriptsRoot="/home/teeworlds/scripts/";

$retval=0;
$outputWhoami;
$latsline = exec('whoami', $outputWhoami, $retval);
if ($outputWhoami[0] != "teeworlds")
{
	echo "bad user ('".$outputWhoami[0]."')";
	exit();
}

if (isset($_GET["command"]))
{
	$command = $_GET["command"];

	// http://teeworlds.potionmagic.eu/admin/admin.php?command=status
	if ($command == "status") // ------------------------------------------------------------------------------- STATUS
	{
		$output;
		$lastline = exec("$scriptsRoot/teeworlds_server.sh status", $output, $retval);

		// DEBUG
		// echo "command='status' - output='".$output[0]."' - retval='".$retval."'";

		echo ($output[0] == "Running") ? 0 : 1;

		exit();
	}
	// http://teeworlds.potionmagic.eu/admin/admin.php?command=start
	else if ($command == "start") // ---------------------------------------------------------------------------- START
	{
		$output;
		$lastline = exec("$scriptsRoot/teeworlds_server.sh start", $output, $retval);

		// DEBUG
		// echo "command='start' - output='".$output[0]."' - retval='".$retval."'";

		echo $retval;

		exit();
	}
	// http://teeworlds.potionmagic.eu/admin/admin.php?command=stop
	else if ($command == "stop") // ------------------------------------------------------------------------------ STOP
	{
		$output;
		$lastline = exec("$scriptsRoot/teeworlds_server.sh stop", $output, $retval);

		// DEBUG
		// echo "command='stop' - output='".$output[0]."' - retval='".$retval."'";

		echo $retval;

		exit();
	}
	// http://teeworlds.potionmagic.eu/admin/admin.php?command=rename&pseudoOld=toto&pseudoNew=titi
	else if ($command == "rename") // -------------------------------------------------------------------------- RENAME
	{
		if (isset($_GET["pseudoOld"]) && isset($_GET["pseudoNew"]))
		{
			$pseudoOld = escapeshellarg(rawurldecode($_GET["pseudoOld"]));
			$pseudoNew = escapeshellarg(rawurldecode($_GET["pseudoNew"]));

			$output;
			$lastline = exec("$scriptsRoot/rename_player.sh $pseudoOld $pseudoNew", $output, $retval);

			// DEBUG
			// echo "command='rename' - pseudoOld='".$pseudoOld."' - pseudoNew='".$pseudoNew."'";

			echo $retval;

			exit();
		}
	}
	// http://teeworlds.potionmagic.eu/admin/admin.php?command=merge&pseudoFrom=toto&pseudoTo=titi
	else if ($command == "merge") // ---------------------------------------------------------------------------- MERGE
	{
		if (isset($_GET["pseudoFrom"]) && isset($_GET["pseudoTo"]))
		{
			$pseudoFrom = escapeshellarg(rawurldecode($_GET["pseudoFrom"]));
			$pseudoTo   = escapeshellarg(rawurldecode($_GET["pseudoTo"  ]));

			$output;
			$lastline = exec("$scriptsRoot/merge_player.sh $pseudoFrom $pseudoTo", $output, $retval);

			// DEBUG
			// echo "command='rename' - pseudoFrom='".$pseudoFrom."' - pseudoTo='".$pseudoTo."'";

			echo $retval;

			exit();
		}
	}
	// http://teeworlds.potionmagic.eu/admin/admin.php?command=remove&pseudo=toto
	else if ($command == "remove") // -------------------------------------------------------------------------- REMOVE
	{
		if (isset($_GET["pseudo"]))
		{
			$pseudo = escapeshellarg(rawurldecode($_GET["pseudo"]));

			$output;
			$lastline = exec("$scriptsRoot/remove_player.sh $pseudo", $output, $retval);

			// DEBUG
			// echo "command='remove' - pseudo='".$pseudo."'";

			echo $retval;

			exit();
		}
	}

	echo "unknown or incomplete command";
}

?>
