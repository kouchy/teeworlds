var players_data = [];
var first_time = true;

// Create a new empty stat object to hold the stats
function get_new_empty_stats_date() {
	let schema = {
		kill: { number: { date: [], val: [] }, weapon: {} },
		death: { number: { date: [], val: [] }, weapon: {} },
		suicide: { number: { date: [], val: [] } },
		item: {},
		flag: { min_time: { date: [], val: [] } },
		game: { time: { date: [], val: [] } },
		ratio: { flag: { date: [], val: [] }, kill: { date: [], val: [] } },
	};
	// Fill up with info about stats
	weapons.forEach(w => {
		schema.kill.weapon[w] = { date: [], val: [] };
		schema.death.weapon[w] = { date: [], val: [] };
	})
	items.forEach(i => schema.item[i] = { date: [], val: [] });
	flag_stats.forEach(f => schema.flag[f] = { date: [], val: [] });
	return schema;
}

function sorted_index_date(array, value) {
	var low = 0, high = array.length;

	while (low < high) {
		var mid = low + high >>> 1;
		if (array[mid].getTime() < value.getTime()) low = mid + 1;
		else high = mid;
	}
	return low;
}

function reduce_stat_date(data, element, date, stat_paths = []) {
	// Recursively accumulate each stat.
	// At the end of all this, each stat will be a vector matching the players' vector
	Object.keys(element).forEach(substat => {
		if (Array.isArray(element[substat].date) && Array.isArray(element[substat].val)) {
			let new_stat = data;
			stat_paths.forEach(path => new_stat = new_stat[path]);
			let val = new_stat[substat];
			if (val != 0)
			{
				let pos = sorted_index_date(element[substat].date, date);
				element[substat].val.splice(pos, 0, new_stat[substat]);
				element[substat].date.splice(pos, 0, date);
			}
		} else {
			reduce_stat_date(data, element[substat], date, stat_paths.concat(substat));
		}
	});
}

//main
$(document).ready(function() {
	let currentTime = new Date();
	let month = currentTime.getMonth() +1;
	let day = currentTime.getDate();
	let year = currentTime.getFullYear();
	let path = "stats_" + year + (month < 10 ? "0" : "") + month + (day < 10 ? "0" : "") + day + "_" + g_map + ".json";
	draw_online_players(g_root_dir + "/daily/" + path, true);
	setInterval(function() { draw_online_players(g_root_dir + "/daily/" + path, false); }, 5000);

	let dir = g_root_dir + "/daily";
	let fileextension = ".json";
	$.ajax({
		//This will retrieve the contents of the folder if the folder is configured as 'browsable'
		url: dir,
		success: function (data) {
			// List all json file names in the page
			$(data).find("a:contains(" + fileextension + ")").each(function () {
				let filename = this.href.replace(window.location.host, "").replace("http:///", "");
				if (get_map_from_path(filename) == g_map)
				{
					let id = filename.replace(/\.[^/.]+$/, "");
					let date = id.replace(/stats_/g, "");
					let obj_date = {
						year: parseInt(date.slice(0, 4)),
						month: parseInt(date.slice(4, 6)),
						day: parseInt(date.slice(6, 8))
					}
					let d = new Date(obj_date.year, obj_date.month -1, obj_date.day);
					$.getJSON(dir+"/"+filename, function(json){
						if ($.isEmptyObject(json) == false)
						{
							Object.keys(json).forEach(pseudo => {
								let	stats = (players_data[pseudo] == undefined) ? get_new_empty_stats_date() : players_data[pseudo];
								// Recursively browse the json and accumulate data
								reduce_stat_date(json[pseudo], stats, d);
								players_data[pseudo] = stats;
							});
						}
					});
				}
			});
		}
	});

	$(document).ajaxStop(function () {
		if (first_time)
		{
			first_time = false;

			$("#loader").hide();

			let all_players = Object.keys(players_data);

			// Convert times to minute
			all_players.forEach(p => {
				players_data[p].game.time.val = players_data[p].game.time.val.map(t => Math.round(t/60.0));
			});

			plots = [
				{
					elem: 'plot1', title: 'Kills / (Deaths + Suicides)', stats: player_ratio, xaxis: { title: 'Date', type: 'none', autorange: true }, yaxis: { title: 'Ratio', type: 'none', autorange: true },
					create_stat: pseudo => ({ x: players_data[pseudo].ratio.kill.date, y: players_data[pseudo].ratio.kill.val, name: pseudo, type: 'scatter' }),
				},
				{
					elem: 'plot2', title: 'Flags capture / Flags grabs', stats: player_ratio, xaxis: { title: 'Date', type: 'none', autorange: true }, yaxis: { title: 'Ratio', type: 'none', autorange: true },
					create_stat: pseudo => ({ x: players_data[pseudo].ratio.flag.date, y: players_data[pseudo].ratio.flag.val, name: pseudo, type: 'scatter' }),
				},
				{
					elem: 'plot3', title: 'Kills', stats: player_ratio, xaxis: { title: 'Date', type: 'none', autorange: true }, yaxis: { title: 'Amount', type: 'none', autorange: true },
					create_stat: pseudo => ({ x: players_data[pseudo].kill.number.date, y: players_data[pseudo].kill.number.val, name: pseudo, type: 'scatter' }),
				},
				{
					elem: 'plot4', title: 'Deaths', stats: player_ratio, xaxis: { title: 'Date', type: 'none', autorange: true }, yaxis: { title: 'Amount', type: 'none', autorange: true },
					create_stat: pseudo => ({ x: players_data[pseudo].death.number.date, y: players_data[pseudo].death.number.val, name: pseudo, type: 'scatter' }),
				},
				{
					elem: 'plot5', title: 'Suicides', stats: player_ratio, xaxis: { title: 'Date', type: 'none', autorange: true }, yaxis: { title: 'Amount', type: 'none', autorange: true },
					create_stat: pseudo => ({ x: players_data[pseudo].suicide.number.date, y: players_data[pseudo].suicide.number.val, name: pseudo, type: 'scatter' }),
				},
				{
					elem: 'plot6', title: 'Time spent', stats: player_ratio, xaxis: { title: 'Date', type: 'none', autorange: true }, yaxis: { title: 'Time (in minutes)', type: 'none', autorange: true },
					create_stat: pseudo => ({ x: players_data[pseudo].game.time.date, y: players_data[pseudo].game.time.val, name: pseudo, type: 'scatter' }),
				},
			];

			plots.forEach(plot_data => Plotly.newPlot(plot_data.elem, all_players.map(pseudo => plot_data.create_stat(pseudo)), { title: plot_data.title, autorange: true, xaxis: plot_data.xaxis, yaxis: plot_data.yaxis}));
		}
	});
});