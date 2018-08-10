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

	// http://teeworlds.potionmagic.eu/status.php?command=status
	if ($command == "status") // ------------------------------------------------------------------------------- STATUS
	{
		$output;
		$lastline = exec("$scriptsRoot/teeworlds_server.sh status", $output, $retval);

		// DEBUG
		// echo "command='status' - output='".$output[0]."' - retval='".$retval."'";

		echo ($output[0] == "Running") ? 0 : 1;

		exit();
	}

	echo "unknown or incomplete command";
}

?>
