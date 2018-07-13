//main
$(document).ready(function() {
	var currentTime = new Date();
	var month = currentTime.getMonth() +1;
	var day = currentTime.getDate();
	var year = currentTime.getFullYear();
	var filename = "stats_" + year + (month < 10 ? "0" : "") + month + (day < 10 ? "0" : "") + day + ".json";
	draw_dashboard(root_dir + "/daily/" + filename);
	setInterval(function() { draw_dashboard(root_dir + "/daily/" + filename, true); }, 15000);
	draw_online_players(root_dir + "/daily/" + filename, true);
	setInterval(function() { draw_online_players(root_dir + "/daily/" + filename, false); }, 5000);
});
