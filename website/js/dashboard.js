var weapons = ["hammer", "gun", "shotgun", "grenade", "laser", "ninja"];
var items = ['heart', 'armor', 'shotgun', 'grenade', 'laser', 'ninja'];
var player_stats = ['kill', 'death', 'suicide'];
var player_ratio = ['kill', 'flag'];
var flag_stats = ['capture', 'grab', 'return'];
var game_win = ['victory', 'defeat'];
// only 'armor' is not simply capitalized
var items_names = { 'armor': 'Shield' };
// 'return' is aliased to 'Bring back'
var flag_stats_names = { 'return': 'Bring back' };
var player_ratio_names = { 'kill': 'Kill' };

var g_root_dir = "stats";
var g_map = "csn7"

let capitalize = string => string.charAt(0).toUpperCase() + string.slice(1);

let diff = (a, b) => a.filter(i => b.indexOf(i) < 0);

function get_type_from_path(path)
{
	let type = path.replace(/.*\/(.*)\/stats_[0-9]*_.*\.json/g, "$1");
	return type;
}

function get_date_from_path(path)
{
	let date = path.replace(/.*stats_([0-9]*)_.*\.json/g, "$1");
	date = date.slice(6, 8) + "/" + date.slice(4, 6) + "/" + date.slice(0, 4);
	return date;
}

function get_map_from_path(path)
{
	let map = path.replace(/.*stats_[0-9]*_(.*)\.json/g, "$1");
	return map;
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
		game: { time: [], victory: [], defeat: [] },
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

function draw_dashboard_daily(all_players, all_stats_by_type, keys_sorted_chronos, vals_sorted_chronos, player_kills, death_coords, update = false)
{
	plots = [
		{
			elem: 'plot1', title: 'Kills, deaths and suicides', stats: player_stats, xaxis: { title: 'Pseudo', type: 'none', autorange: true }, yaxis: { title: 'Amount', type: 'none', autorange: true },
			create_stat: stat => ({ x: all_players, y: all_stats_by_type[stat].number, name: capitalize(stat), type: 'bar' }),
		},
		{
			elem: 'plot2', title: 'Chrono (shortest flag capture)', stats: [0], xaxis: { title: 'Pseudo', type: 'none', autorange: true }, yaxis: { title: 'Time (in seconds)', type: 'log', autorange: true },
			create_stat: () => ({ x: keys_sorted_chronos, y: vals_sorted_chronos, name: 'Flag time (sec)', type: 'bar' }),
		},
		{
			elem: 'plot3', title: 'Kills by weapons', stats: weapons, xaxis: { title: 'Pseudo', type: 'none', autorange: true }, yaxis: { title: 'Amount', type: 'none', autorange: true },
			create_stat: weapon => ({ x: all_players, y: all_stats_by_type.kill.weapon[weapon], name: capitalize(weapon), type: 'bar' }),
		},
		{
			elem: 'plot4', title: 'Deaths by weapons', stats: weapons, xaxis: { title: 'Pseudo', type: 'none', autorange: true }, yaxis: { title: 'Amount', type: 'none', autorange: true },
			create_stat: weapon => ({ x: all_players, y: all_stats_by_type.death.weapon[weapon], name: capitalize(weapon), type: 'bar' }),
		},
		{
			elem: 'plot5', title: 'Collected items', stats: items, xaxis: { title: 'Pseudo', type: 'none', autorange: true }, yaxis: { title: 'Amount', type: 'none', autorange: true },
			create_stat: item => ({ x: all_players, y: all_stats_by_type.item[item], name: items_names[item] || capitalize(item), type: 'bar' }),
		},
		{
			elem: 'plot6', title: 'Flag actions', stats: flag_stats, xaxis: { title: 'Pseudo', type: 'none', autorange: true }, yaxis: { title: 'Amount', type: 'none', autorange: true },
			create_stat: action => ({ x: all_players, y: all_stats_by_type.flag[action], name: flag_stats_names[action] || capitalize(action), type: 'bar' }),
		},
		{
			elem: 'plot7', title: 'Victories and defeats', stats: game_win, xaxis: { title: 'Pseudo', type: 'none', autorange: true }, yaxis: { title: 'Amount', type: 'none', autorange: true },
			create_stat: victory => ({ x: all_players, y: all_stats_by_type.game[victory], name: capitalize(victory), type: 'bar' }),
		},
		{
			elem: 'plot10', title: 'Time spent', stats: [0], xaxis: { title: 'Pseudo', type: 'none', autorange: true }, yaxis: { title: 'Time (in minutes)', type: 'none', autorange: true },
			create_stat: () => ({ x: all_players, y: all_stats_by_type.game.time, name: 'Play time', type: 'bar' }),
		},
	];

	if (update)
		plots.forEach(plot_data => Plotly.react(plot_data.elem, plot_data.stats.map(s => plot_data.create_stat(s)), { barmode: 'group', title: plot_data.title, autorange: true, xaxis: plot_data.xaxis, yaxis: plot_data.yaxis }));
	else
		plots.forEach(plot_data => Plotly.newPlot(plot_data.elem, plot_data.stats.map(s => plot_data.create_stat(s)), { barmode: 'group', title: plot_data.title, autorange: true, xaxis: plot_data.xaxis, yaxis: plot_data.yaxis }));

	let kill_data = [
		{
			x: all_players,
			y: all_players,
			z: player_kills,
			type: 'heatmap',
			colorscale: [
				[0, '#ffffff'],
				[.5, '#ff0000'],
				[1,   '#000000'],
			]
		}
	];
	let kill_layout = {
		title: 'Killer/killed by weapons heatmap',
		xaxis: {title: 'Killer pseudo'},
		yaxis: {title: 'Killed pseudo'},
	};

	if (update)
		Plotly.react('plot8', kill_data, kill_layout);
	else
		Plotly.newPlot('plot8', kill_data, kill_layout);

	if (death_coords.length)
	{
		let death_coords_data = []
		all_players.forEach(function(pseudo,i){
			death_coords_data.push({
				x: death_coords[i].x,
				y: death_coords[i].y,
				mode: 'markers',
				marker: { size: 4 },
				type: 'scatter',
				name: pseudo
			})
		})

		let death_coords_layout = {
			xaxis: {
				range:  [-1000, 9000],
				domain: [-1000, 9000],
				showgrid: false,
				zeroline: false,
				title: "x",
			},
			yaxis: {
				range:  [5300, 1200],
				domain: [7000, 0],
				showgrid: false,
				zeroline: false,
				title: "y",
			},
			images: [{
				source: 'images/hd-map.png',
				xref: 'x',
				yref: 'y',

				//// values for small map:
				//x: -100,
				//y: -1100,
				//sizex: 9000,
				//sizey: 8000,

				// HD map, corners coords in tiles :
				// x1=17, y1=60, x2=252, y2=140 (139?)
				x: 544, // 16*32
				y: 1920, // 60*32
				sizex: 7520, // (252-17)*32
				sizey: 2560, // (140-60)*32

				xanchor: 'left',
				yanchor: 'top',
				sizing: 'stretch',
				layer: 'below',
				opacity: '0.5'
			}],
			// height: 700,
			// width:  1000,
			title: 'Death coordinates'
		}
		if (update)
			Plotly.react('plot9', death_coords_data, death_coords_layout);
		else
			Plotly.newPlot('plot9', death_coords_data, death_coords_layout);
	}
}

function draw_dashboard_total(all_players, all_stats_by_type, keys_sorted_chronos, vals_sorted_chronos, player_kill_ratio)
{
	for (let p = 0; p < all_players.length; p++) {
		weapons.forEach(w => {
			all_stats_by_type.kill.weapon[w][p] = Math.round((all_stats_by_type.kill.weapon[w][p] / all_stats_by_type.kill.number[p])*10000)/100;
			all_stats_by_type.death.weapon[w][p] = Math.round((all_stats_by_type.death.weapon[w][p] / all_stats_by_type.death.number[p])*10000)/100;
		});
	}

	for (let p = 0; p < all_players.length; p++) {
		if (all_stats_by_type.game.victory[p] && all_stats_by_type.game.defeat[p])
			all_stats_by_type.game.victory[p] = Math.round((all_stats_by_type.game.victory[p] / all_stats_by_type.game.defeat[p])*100)/100;
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

	let ratios = [];
	ratios.push(all_stats_by_type.ratio.kill);
	ratios.push(all_stats_by_type.ratio.flag);
	ratios.push(all_stats_by_type.game.victory);

	let ratios_legend = [];
	ratios_legend.push(capitalize(player_ratio[0]));
	ratios_legend.push(capitalize(player_ratio[1]));
	ratios_legend.push(capitalize(game_win[0]));

	plots = [
		{
			elem: 'plot1', title: 'Ratios', stats: [0,1,2], barmode: 'group', xaxis: { title: 'Pseudo', type: 'none', autorange: true }, yaxis: { title: 'Ratio', type: 'none', autorange: true },
			create_stat: ratio => ({ x: all_players, y: ratios[ratio], name: ratios_legend[ratio], type: 'bar' }),
		},
		{
			elem: 'plot2', title: 'Chrono (shortest flag capture)', stats: [0], barmode: 'group', xaxis: { title: 'Pseudo', type: 'none', autorange: true }, yaxis: { title: 'Time (in seconds)', type: 'log', autorange: true },
			create_stat: () => ({ x: keys_sorted_chronos, y: vals_sorted_chronos, name: 'Flag time (sec)', type: 'bar' }),
		},
		{
			elem: 'plot3', title: 'Kills by weapons', stats: weapons, barmode: 'stack', xaxis: { title: 'Pseudo', type: 'none', autorange: true }, yaxis: { title: 'Percentage %', type: 'none', autorange: true },
			create_stat: weapon => ({ x: all_players, y: all_stats_by_type.kill.weapon[weapon], name: capitalize(weapon), type: 'bar' }),
		},
		{
			elem: 'plot4', title: 'Deaths by weapons', stats: weapons, barmode: 'stack', xaxis: { title: 'Pseudo', type: 'none', autorange: true }, yaxis: { title: 'Percentage %', type: 'none', autorange: true },
			create_stat: weapon => ({ x: all_players, y: all_stats_by_type.death.weapon[weapon], name: capitalize(weapon), type: 'bar' }),
		},
		{
			elem: 'plot5', title: 'Collected items', stats: items, barmode: 'group', xaxis: { title: 'Pseudo', type: 'none', autorange: true }, yaxis: { title: 'Percentage %', type: 'log', autorange: true },
			create_stat: item => ({ x: all_players, y: all_stats_by_type.item[item], name: items_names[item] || capitalize(item), type: 'bar' }),
		},
		{
			elem: 'plot6', title: 'Flag actions', stats: flag_stats, barmode: 'stack', xaxis: { title: 'Pseudo', type: 'none', autorange: true }, yaxis: { title: 'Percentage %', type: 'none', autorange: true },
			create_stat: action => ({ x: all_players, y: all_stats_by_type.flag[action], name: flag_stats_names[action] || capitalize(action), type: 'bar' }),
		},
		{
			elem: 'plot8', title: 'Time spent', stats: [0], barmode: 'group', xaxis: { title: 'Pseudo', type: 'none', autorange: true }, yaxis: { title: 'Tim (in minutes)', type: 'none', autorange: true },
			create_stat: () => ({ x: all_players, y: all_stats_by_type.game.time, name: 'Play time', type: 'bar' }),
		},
	];

	plots.forEach(plot_data => Plotly.newPlot(plot_data.elem, plot_data.stats.map(s => plot_data.create_stat(s)), { barmode: plot_data.barmode, title: plot_data.title, autorange: true, xaxis: plot_data.xaxis, yaxis: plot_data.yaxis}));

	let max_kill_ratio = Math.max.apply(null,[].concat.apply([],player_kill_ratio).filter(ratio => !!(ratio/ratio) ));
	let kill_data = [
		{
			x: all_players,
			y: all_players,
			z: player_kill_ratio,
			type: 'heatmap',
			colorscale: [
				[0, '#8080ff'],
				[0.9999/max_kill_ratio, '#80ffff'],
				[1/max_kill_ratio,       '#808080'],
				[1.0001/max_kill_ratio, '#ffaaaa'],
				[0.5,   '#ff0000'],
				[1,   '#000000'],
			]
		}
	];
	let kill_layout = {
		title: 'Killer/killed by weapons ratio heatmap',
		xaxis: {title: 'Killer pseudo'},
		yaxis: {title: 'Killed pseudo'},
	};
	Plotly.newPlot('plot7', kill_data, kill_layout);
}


function draw_dashboard(path, update = false)
{
	if (!update) {
		$("#loader").show();
		["plot1", "plot2", "plot3", "plot4", "plot5", "plot6", "plot7", "plot8", "plot9", "plot10", "raw_json"].forEach(e => $(`#${e}`).empty());
		$("#error").hide();
	}

	$.getJSON( path, function( data ) {
		let all_players = Object.keys(data);
		let all_stats_by_type = get_new_empty_stats();

		// Get player kill matrix
		let player_kills = [];
		all_players.forEach(function(pseudo,i){
			player_kills.push([]);
			all_players.forEach( function(pseudo2,j){
				player_kills[i].push(
					// without suicides
					// i == j ? -1 : data[pseudo].death.player[pseudo2] ? data[pseudo].death.player[pseudo2] : 0);
					// with suicides
					i == j ? data[pseudo].suicide.weapon.grenade : data[pseudo].death.player[pseudo2] ? data[pseudo].death.player[pseudo2] : 0);
			})
		});

		// Get player kill ratio matrix
		// TODO: handle the few Infinity cases
		let player_kill_ratio = player_kills.map(function(line){return line.slice();});
		player_kill_ratio.forEach(function(line,i){
			line.forEach(function(elt,j){player_kill_ratio[i][j] = elt/player_kills[j][i]});
		});

		// Get death coords
		let death_coords = [];
		all_players.forEach(function(pseudo){
			if (data[pseudo].death.coords)
			{
				let player_coords = { x:[], y:[] }
				data[pseudo].death.coords.forEach(function(coords){
					player_coords.x.push(coords[0]);
					player_coords.y.push(coords[1] > 5250 ? 5250 : coords[1] < 1250 ? 1250 : coords[1]);
				})
				death_coords.push(player_coords)
			}
		})

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
		if (type == "daily") draw_dashboard_daily(all_players, all_stats_by_type, keys_sorted_chronos, vals_sorted_chronos, player_kills, death_coords, update);
		if (type == "total") draw_dashboard_total(all_players, all_stats_by_type, keys_sorted_chronos, vals_sorted_chronos, player_kill_ratio);

		if (!update)
		{
			$("#loader").hide();
			$("#raw_json").append(`<a href="${path}" class="btn btn-primary" role="button" style="margin-top:40px;" target="_blank">Raw JSON data file</a>`);
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
