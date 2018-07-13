//main
$(document).ready(function() {
	var currentTime = new Date();
	var month = currentTime.getMonth() +1;
	var day = currentTime.getDate();
	var year = currentTime.getFullYear();
	var filename = "stats_" + year + (month < 10 ? "0" : "") + month + (day < 10 ? "0" : "") + day;
	draw_dashboard(root_dir + "/total/" + filename);
	draw_online_players(root_dir + "/daily/" + filename, true);
	setInterval(function() { draw_online_players(root_dir + "/daily/" + filename, false); }, 5000);
});