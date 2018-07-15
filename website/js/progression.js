var players_data = [];
var players_dates = [];
var first_time = true;

//main
$(document).ready(function() {
	let currentTime = new Date();
	let month = currentTime.getMonth() +1;
	let day = currentTime.getDate();
	let year = currentTime.getFullYear();
	let path = "stats_" + year + (month < 10 ? "0" : "") + month + (day < 10 ? "0" : "") + day + ".json";
	draw_online_players(root_dir + "/daily/" + path, true);
	setInterval(function() { draw_online_players(root_dir + "/daily/" + path, false); }, 5000);

	let dir = root_dir + "/daily";
	let fileextension = ".json";
	$.ajax({
		//This will retrieve the contents of the folder if the folder is configured as 'browsable'
		url: dir,
		success: function (data) {
			// List all json file names in the page
			$(data).find("a:contains(" + fileextension + ")").each(function () {
				let filename = this.href.replace(window.location.host, "").replace("http:///", "");
				let id = filename.replace(/\.[^/.]+$/, "");
				let date = id.replace(/stats_/g, "");
				let obj_date = {
					year: parseInt(date.slice(0, 4)),
					month: parseInt(date.slice(4, 6)),
					day: parseInt(date.slice(6, 8))
				}

				$.getJSON(dir+"/"+filename, function(json){
					if ($.isEmptyObject(json) == false)
					{
						Object.keys(json).forEach(pseudo => {
							let	stats = (players_data[pseudo] == undefined) ? get_new_empty_stats() : players_data[pseudo];
							// Recursively browse the json and accumulate data
							reduce_stat(json[pseudo], stats);
							players_data[pseudo] = stats;

							if (players_dates[pseudo] == undefined)
								players_dates[pseudo] = [];
							players_dates[pseudo].push(new Date(obj_date.year, obj_date.month -1, obj_date.day));
						});
					}
				});
			});
	    }
	});

	$(document).ajaxStop(function () {
		if (first_time)
		{
			first_time = false;

			$("#loader").hide();

			let all_players = Object.keys(players_data);
			console.log(players_data);

			// Convert times to minute
			all_players.forEach(p => {
				players_data[p].game.time = players_data[p].game.time.map(t => Math.round(t/60.0));
			});

			plots = [
				{
					elem: 'plot1', title: 'Ratio kills/deaths over time', stats: player_ratio, yaxis_type: 'none',
					create_stat: pseudo => ({ x: players_dates[pseudo], y: players_data[pseudo].ratio.kill, name: pseudo, type: 'scatter' }),
				},
				{
					elem: 'plot2', title: 'Ratio flag over time', stats: player_ratio, yaxis_type: 'none',
					create_stat: pseudo => ({ x: players_dates[pseudo], y: players_data[pseudo].ratio.flag, name: pseudo, type: 'scatter' }),
				},
				{
					elem: 'plot3', title: 'Kills over time', stats: player_ratio, yaxis_type: 'none',
					create_stat: pseudo => ({ x: players_dates[pseudo], y: players_data[pseudo].kill.number, name: pseudo, type: 'scatter' }),
				},
				{
					elem: 'plot4', title: 'Deaths over time', stats: player_ratio, yaxis_type: 'none',
					create_stat: pseudo => ({ x: players_dates[pseudo], y: players_data[pseudo].death.number, name: pseudo, type: 'scatter' }),
				},
				{
					elem: 'plot5', title: 'Suicides over time', stats: player_ratio, yaxis_type: 'none',
					create_stat: pseudo => ({ x: players_dates[pseudo], y: players_data[pseudo].suicide.number, name: pseudo, type: 'scatter' }),
				},
				{
					elem: 'plot6', title: 'Time spent (in minutes) over time', stats: player_ratio, yaxis_type: 'none',
					create_stat: pseudo => ({ x: players_dates[pseudo], y: players_data[pseudo].game.time, name: pseudo, type: 'scatter' }),
				},
			];

			plots.forEach(plot_data => Plotly.newPlot(plot_data.elem, all_players.map(pseudo => plot_data.create_stat(pseudo)), { title: plot_data.title, autorange: true, yaxis: { type: plot_data.yaxis_type, autorange: true}}));
		}
	});
});