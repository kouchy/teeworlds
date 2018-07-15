var weapons = ["hammer", "gun", "shotgun", "grenade", "laser", "ninja"];
var items = ['heart', 'armor', 'shotgun', 'grenade', 'laser', 'ninja'];
var player_stats = ['kill', 'death', 'suicide'];
var player_ratio = ['kill', 'flag'];
var flag_stats = ['capture', 'grab', 'return'];
// only 'armor' is not simply capitalized
var items_names = { 'armor': 'Shield' };
// 'return' is aliased to 'Bring back'
var flag_stats_names = { 'return': 'Bring back' };
var player_ratio_names = { 'kill': 'Kill' };
var root_dir = "stats";

let capitalize = string => string.charAt(0).toUpperCase() + string.slice(1);

let diff = (a, b) => a.filter(i => b.indexOf(i) < 0);

function get_type_from_path(path)
{
	let type = path.replace(/.*\/(.*)\/stats_[0-9]*\.json/g, "$1");
	return type;
}

function get_date_from_path(path)
{
	let date = path.replace(/.*stats_([0-9]*)\.json/g, "$1");
	date = date.slice(6, 8) + "/" + date.slice(4, 6) + "/" + date.slice(0, 4);
	return date;
}

function get_year_from_date(date)
{
	let tmp = date.split("/");
	return tmp[2];
}

function get_month_from_date(date)
{
	let tmp = date.split("/");
	return tmp[1];
}

function get_day_from_date(date)
{
	let tmp = date.split("/");
	return tmp[0];
}

// Create a new empty stat object to hold the stats
function get_new_empty_stats() {
	let schema = {
		kill: { number: [], weapon: {} },
		death: { number: [], weapon: {} },
		suicide: { number: [] },
		item: {},
		flag: { min_time: [] },
		game: { time: [] },
		ratio: { flag: [], kill: [] },
	};
	// Fill up with info about stats
	weapons.forEach(w => {
		schema.kill.weapon[w] = [];
		schema.death.weapon[w] = [];
	})
	items.forEach(i => schema.item[i] = []);
	flag_stats.forEach(f => schema.flag[f] = []);
	return schema;
}

function reduce_stat(data, element, stat_paths = []) {
	// Recursively accumulate each stat.
	// At the end of all this, each stat will be a vector matching the players' vector
	Object.keys(element).forEach(substat => {
		if (Array.isArray(element[substat])) {
			let new_stat = data;
			stat_paths.forEach(path => new_stat = new_stat[path]);
			element[substat].push(new_stat[substat]);
		} else {
			reduce_stat(data, element[substat], stat_paths.concat(substat));
		}
	});
}

// Combines two arrays of matching sizes 'keys' and 'values' into an object, applying 'filter_func' on each value.
function to_object(keys, values, filter_func = () => true) {
	let object = {};
	for (let i = 0; i < keys.length; i++)
 		if (filter_func(values[i]))
			object[keys[i]] = values[i];
	return object;
}

function draw_dashboard_daily(all_players, all_stats_by_type, keys_sorted_chronos, vals_sorted_chronos)
{
	plots = [
		{
			elem: 'plot1', title: 'Kills, deaths and suicides', stats: player_stats,
			create_stat: stat => ({ x: all_players, y: all_stats_by_type[stat].number, name: capitalize(stat), type: 'bar' }),
		},
		{
			elem: 'plot2', title: 'Chrono (shortest flag time in seconds)', stats: [0],
			create_stat: () => ({ x: keys_sorted_chronos, y: vals_sorted_chronos, name: 'Flag time (sec)', type: 'bar' }),
		},
		{
			elem: 'plot3', title: 'Kills by weapons', stats: weapons,
			create_stat: weapon => ({ x: all_players, y: all_stats_by_type.kill.weapon[weapon], name: capitalize(weapon), type: 'bar' }),
		},
		{
			elem: 'plot4', title: 'Deaths by weapons', stats: weapons,
			create_stat: weapon => ({ x: all_players, y: all_stats_by_type.death.weapon[weapon], name: capitalize(weapon), type: 'bar' }),
		},
		{
			elem: 'plot5', title: 'Collected items', stats: items,
			create_stat: item => ({ x: all_players, y: all_stats_by_type.item[item], name: items_names[item] || capitalize(item), type: 'bar' }),
		},
		{
			elem: 'plot6', title: 'Flag actions', stats: flag_stats,
			create_stat: action => ({ x: all_players, y: all_stats_by_type.flag[action], name: flag_stats_names[action] || capitalize(action), type: 'bar' }),
		},
		{
			elem: 'plot7', title: 'Time spent (in minutes)', stats: [0],
			create_stat: () => ({ x: all_players, y: all_stats_by_type.game.time, name: 'Time (sec)', type: 'bar' }),
		},
	];

	plots.forEach(plot_data => Plotly.newPlot(plot_data.elem, plot_data.stats.map(s => plot_data.create_stat(s)), { barmode: 'group', title: plot_data.title, autorange: true }));
}

function draw_dashboard_total(all_players, all_stats_by_type, keys_sorted_chronos, vals_sorted_chronos)
{
	for (let p = 0; p < all_players.length; p++) {
		weapons.forEach(w => {
			all_stats_by_type.kill.weapon[w][p] = Math.round((all_stats_by_type.kill.weapon[w][p] / all_stats_by_type.kill.number[p])*10000)/100;
			all_stats_by_type.death.weapon[w][p] = Math.round((all_stats_by_type.death.weapon[w][p] / all_stats_by_type.death.number[p])*10000)/100;
		});
	}

	for (let p = 0; p < all_players.length; p++) {
		let total_items = 0;
		items.forEach(i => {
			total_items += all_stats_by_type.item[i][p];
		});
		items.forEach(i => {
			all_stats_by_type.item[i][p] = Math.round((all_stats_by_type.item[i][p] / total_items)*10000)/100;
		});
	}

	for (let p = 0; p < all_players.length; p++) {
		let total_flag_stats = 0;
		flag_stats.forEach(f => {
			total_flag_stats += all_stats_by_type.flag[f][p];
		});
		flag_stats.forEach(f => {
			all_stats_by_type.flag[f][p] = Math.round((all_stats_by_type.flag[f][p] / total_flag_stats)*10000)/100;
		});
	}

	plots = [
		{
			elem: 'plot1', title: 'Ratio kill and flag', stats: player_ratio, barmode: 'group', yaxis_type: 'none',
			create_stat: ratio => ({ x: all_players, y: all_stats_by_type.ratio[ratio], name:  player_ratio_names[ratio] || capitalize(ratio), type: 'bar' }),
		},
		{
			elem: 'plot2', title: 'Chrono (shortest flag time in seconds)', stats: [0], barmode: 'group', yaxis_type: 'log',
			create_stat: () => ({ x: keys_sorted_chronos, y: vals_sorted_chronos, name: 'Flag time (sec)', type: 'bar' }),
		},
		{
			elem: 'plot3', title: 'Percentage of kills by weapons', stats: weapons, barmode: 'stack', yaxis_type: 'none',
			create_stat: weapon => ({ x: all_players, y: all_stats_by_type.kill.weapon[weapon], name: capitalize(weapon), type: 'bar' }),
		},
		{
			elem: 'plot4', title: 'Percentage of deaths by weapons', stats: weapons, barmode: 'stack', yaxis_type: 'none',
			create_stat: weapon => ({ x: all_players, y: all_stats_by_type.death.weapon[weapon], name: capitalize(weapon), type: 'bar' }),
		},
		{
			elem: 'plot5', title: 'Percentage of collected items', stats: items, barmode: 'group', yaxis_type: 'log',
			create_stat: item => ({ x: all_players, y: all_stats_by_type.item[item], name: items_names[item] || capitalize(item), type: 'bar' }),
		},
		{
			elem: 'plot6', title: 'Percentage of flag actions', stats: flag_stats, barmode: 'stack', yaxis_type: 'none',
			create_stat: action => ({ x: all_players, y: all_stats_by_type.flag[action], name: flag_stats_names[action] || capitalize(action), type: 'bar' }),
		},
		{
			elem: 'plot7', title: 'Time spent (in minutes)', stats: [0], barmode: 'group', yaxis_type: 'none',
			create_stat: () => ({ x: all_players, y: all_stats_by_type.game.time, name: 'Time (sec)', type: 'bar' }),
		},
	];

	plots.forEach(plot_data => Plotly.newPlot(plot_data.elem, plot_data.stats.map(s => plot_data.create_stat(s)), { barmode: plot_data.barmode, title: plot_data.title, autorange: true, yaxis: { type: plot_data.yaxis_type, autorange: true}}));
}


function draw_dashboard(path, update = false)
{
	if (!update) {
		$("#loader").show();
		["plot1", "plot2", "plot3", "plot4", "plot5", "plot6", "plot7", "raw_json"].forEach(e => $(`#${e}`).empty());
		$("#error").hide();
	}

	$.getJSON( path, function( data ) {
		let all_players = Object.keys(data);
		let all_stats_by_type = get_new_empty_stats();

		// Recursively browse the json and accumulate data
		all_players.forEach(pseudo => reduce_stat(data[pseudo], all_stats_by_type));
		// Convert times to minute
		all_stats_by_type.game.time = all_stats_by_type.game.time.map(t => Math.round(t/60.0));
		// Get and filter out non positive flag time
		let chronos = to_object(all_players, all_stats_by_type.flag.min_time, time => time > 0);
		// We don't need it anymore
		delete all_stats_by_type.flag.min_time;
		// Sort chronos in ascending order
		let keys_sorted_chronos = Object.keys(chronos).sort(function(a,b){return chronos[a]-chronos[b]});
		let vals_sorted_chronos = [];
		for (let i = 0; i < keys_sorted_chronos.length; i++)
			vals_sorted_chronos[i] = chronos[keys_sorted_chronos[i]];

		let type = get_type_from_path(path);
		if (type == "daily") draw_dashboard_daily(all_players, all_stats_by_type, keys_sorted_chronos, vals_sorted_chronos);
		if (type == "total") draw_dashboard_total(all_players, all_stats_by_type, keys_sorted_chronos, vals_sorted_chronos);

		if (!update)
		{
			$("#loader").hide();
			$("#raw_json").append(`<a href="${path}" class="btn btn-primary" role="button" target="_blank">Raw JSON data file</a>`);
		}

		$("#error").hide();
	});
}

$.ajaxSetup({
	cache: false,
	"error":function() {
		$("#loader").hide();
		$("#error").show();
	}
});