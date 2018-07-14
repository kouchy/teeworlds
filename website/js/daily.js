//main
$(document).ready(function() {
	let currentTime = new Date();
	let month = currentTime.getMonth() +1;
	let day = currentTime.getDate();
	let year = currentTime.getFullYear();
	let path = "stats_" + year + (month < 10 ? "0" : "") + month + (day < 10 ? "0" : "") + day + ".json";
	draw_dashboard(root_dir + "/daily/" + path);
	setInterval(function() { draw_dashboard(root_dir + "/daily/" + path, true); }, 15000);
	draw_online_players(root_dir + "/daily/" + path, true);
	setInterval(function() { draw_online_players(root_dir + "/daily/" + path, false); }, 5000);
});
