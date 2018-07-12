var weapons = ["hammer", "gun", "shotgun", "grenade", "laser", "ninja"];
var items = ['heart', 'armor', 'shotgun', 'grenade', 'laser', 'ninja'];
var player_stats = ['kill', 'death', 'suicide'];
var flag_stats = ['capture', 'grab', 'return', 'min_time'];
// only 'armor' is not simply capitalized
var items_names = { 'armor': 'Shield' }

function capitalize(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

// Create a new empty stat object to hold the stats
function get_new_empty_stats() {
	let schema = {
		kill: { number: [], weapon: {}, },
		death: { number: [], weapon: {}, },
		suicide: { number: [], },
		item: {},
		flag: {},
		game: { time: [], },
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
};

function draw_dashboard(filename, update = false)
{
	if (!update) {
		$("#loader").show();
		["kill_death_suicide", "chrono", "kill_weapon", "death_weapon", "item", "flag", "time", "raw_json"].forEach(e => $(`#${e}`).empty());
		$("#error").hide();
	}

	$.getJSON( filename, function( data ) {
		let all_players = Object.keys(data);
		let all_stats_by_type = get_new_empty_stats();

		// Recursively browse the json and accumulate data
		all_players.forEach(pseudo => reduce_stat(data[pseudo], all_stats_by_type));
		// Convert times to minute
		all_stats_by_type.game.time = all_stats_by_type.game.time.map(t => Math.round(t/60.0));
		// Get and filter out non positive flag time
		let chronos = to_object(all_players, all_stats_by_type.flag.min_time, time => time > 0);

		let player_statuses = { "red": [], "blue": [], "online": [], "spectators": [], "offline": [] };
		all_players.forEach(pseudo => player_statuses[data[pseudo].game.team || "offline"].push(pseudo));
		let n_online = 0;
		let online_statuses = {
			red: { class: "danger", title: "In-game (red team)" },
			blue: { class: "primary", title: "In-game (blue team)" },
			online: { class: "warning", title: "In-game" },
			spectators: { class: "secondary", title: "Spectator" },
		};
		Object.keys(online_statuses).forEach(status => n_online += player_statuses[status].length);

		$("#online").empty();
		if (n_online) {
			$("#online").append(`${n_online} player${n_online > 1 ? "s" : ""} online: `);
			Object.entries(online_statuses).forEach(entry => {
				player_statuses[entry[0]].forEach(player => {
					$("#online").append(`<span class="badge badge-${entry[1].class}"><abbr title="${entry[1].title}">${player}</abbr></span>&nbsp;`);
				});
			});
		}

		if (!update)
			$("#loader").hide();

		plots = [
			{
				elem: 'kill_death_suicide', title: 'Kills, deaths and suicides', stats: player_stats,
				create_stat: stat => ({ x: all_players, y: all_stats_by_type[stat].number, name: capitalize(stat), type: 'bar' }),
			},
			{
				elem: 'kill_weapon', title: 'Kills by weapons', stats: weapons,
				create_stat: weapon => ({ x: all_players, y: all_stats_by_type.kill.weapon[weapon], name: capitalize(weapon), type: 'bar' }),
			},
			{
				elem: 'death_weapon', title: 'Deaths by weapons', stats: weapons,
				create_stat: weapon => ({ x: all_players, y: all_stats_by_type.death.weapon[weapon], name: capitalize(weapon), type: 'bar' }),
			},
			{
				elem: 'chrono', title: 'Chrono (shortest flag time in seconds)', stats: [0],
				create_stat: () => ({ x: Object.keys(chronos), y: Object.values(chronos), name: 'Flag time (sec)', type: 'bar' }),
			},
			{
				elem: 'item', title: 'Items count', stats: items,
				create_stat: item => ({ x: all_players, y: all_stats_by_type.item[item], name: items_names[item] || capitalize(item), type: 'bar' }),
			},
			{
				elem: 'flag', title: 'Flag actions', stats: flag_stats,
				create_stat: action => ({ x: all_players, y: all_stats_by_type.flag[action], name: capitalize(action), type: 'bar' }),
			},
			{
				elem: 'time', title: 'Time spent (in minutes)', stats: [0],
				create_stat: () => ({ x: all_players, y: all_stats_by_type.game.time, name: 'Time (sec)', type: 'bar' }),
			},
		];

		plots.forEach(plot_data => Plotly.newPlot(plot_data.elem, plot_data.stats.map(s => plot_data.create_stat(s)), { barmode: 'group', title: plot_data.title, autorange: true }));

		if (!update)
			$("#raw_json").append(`<a href="${filename}" class="btn btn-primary" role="button" target="_blank">Raw JSON data file</a>`);
	});
}

var root_dir = "stats"

$.ajaxSetup({
	"error":function() {
		$("#loader").hide();
		$("#error").show();
	}
});
$.ajaxSetup({ cache: false });
