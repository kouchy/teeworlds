function draw_dashboard(filename, update = false)
{
	if (update == false)
	{
		$("#loader").show();
		$("#kill_death_suicide").empty();
		$("#chrono").empty();
		$("#kill_weapon").empty();
		$("#death_weapon").empty();
		$("#item").empty();
		$("#flag").empty();
		$("#time").empty();
		$("#raw_json").empty();
		$("#error").hide();
	}

	$.getJSON( filename, function( data ) {
		var pseudo = [];
		var kill = [];
		var death = [];
		var suicide = [];
		var kill_weapon_hammer = [];
		var kill_weapon_gun    = [];
		var kill_weapon_shotgun = [];
		var kill_weapon_grenade = [];
		var kill_weapon_laser = [];
		var kill_weapon_ninja = [];
		var death_weapon_hammer = [];
		var death_weapon_gun    = [];
		var death_weapon_shotgun = [];
		var death_weapon_grenade = [];
		var death_weapon_laser = [];
		var death_weapon_ninja = [];
		var pseudo_chrono = [];
		var chrono = [];
		var item_heart = [];
		var item_armor = [];
		var item_shotgun = [];
		var item_grenade = [];
		var item_laser = [];
		var item_ninja = [];
		var flag_capture = [];
		var flag_grab = [];
		var flag_return = [];
		var time = [];
		var n_online = 0;
		var pseudo_online = [];
		var pseudo_online_red = [];
		var pseudo_online_blue = [];
		var pseudo_online_spectator = [];
		$.each( data, function( key, val ) {
			pseudo.push(key);
			kill.push(data[key].kill.number);
			death.push(data[key].death.number);
			suicide.push(data[key].suicide.number);
			kill_weapon_hammer.push(data[key].kill.weapon.hammer);
			kill_weapon_gun.push(data[key].kill.weapon.gun);
			kill_weapon_shotgun.push(data[key].kill.weapon.shotgun);
			kill_weapon_grenade.push(data[key].kill.weapon.grenade);
			kill_weapon_laser.push(data[key].kill.weapon.laser);
			kill_weapon_ninja.push(data[key].kill.weapon.ninja);
			death_weapon_hammer.push(data[key].death.weapon.hammer);
			death_weapon_gun.push(data[key].death.weapon.gun);
			death_weapon_shotgun.push(data[key].death.weapon.shotgun);
			death_weapon_grenade.push(data[key].death.weapon.grenade);
			death_weapon_laser.push(data[key].death.weapon.laser);
			death_weapon_ninja.push(data[key].death.weapon.ninja);
			if (data[key].flag.min_time > 0)
			{
				pseudo_chrono.push(key);
				chrono.push(data[key].flag.min_time);
			}
			item_heart.push(data[key].item.heart);
			item_armor.push(data[key].item.armor);
			item_shotgun.push(data[key].item.shotgun);
			item_grenade.push(data[key].item.grenade);
			item_laser.push(data[key].item.laser);
			item_ninja.push(data[key].item.ninja);
			flag_capture.push(data[key].flag.capture);
			flag_grab.push(data[key].flag.grab);
			flag_return.push(data[key].flag.return);
			time.push(Math.round(data[key].game.time/60.0));
			if (data[key].game.team == "red"       ) { pseudo_online_red.push(key);       n_online++; }
			if (data[key].game.team == "blue"      ) { pseudo_online_blue.push(key);      n_online++; }
			if (data[key].game.team == "spectators") { pseudo_online_spectator.push(key); n_online++; }
			if (data[key].game.team == "online"    ) { pseudo_online.push(key);           n_online++; }
		});

		$("#online").empty();
		if (n_online)
			$("#online").append(n_online + " player" + (n_online > 1 ? "s" : "") + " online : ");
		for (var i=0;i<pseudo_online_red.length;i++)
			$("#online").append("<span class=\"badge badge-danger\"><abbr title=\"In-game (red team)\">" + pseudo_online_red[i] + "</abbr></span>&nbsp;");
		for (var i=0;i<pseudo_online_blue.length;i++)
			$("#online").append("<span class=\"badge badge-primary\"><abbr title=\"In-game (blue team)\">" + pseudo_online_blue[i] + "</abbr></span>&nbsp;");
		for (var i=0;i<pseudo_online.length;i++)
			$("#online").append("<span class=\"badge badge-warning\"><abbr title=\"In-game\">" + pseudo_online[i] + "</abbr></span>&nbsp;");
		for (var i=0;i<pseudo_online_spectator.length;i++)
			$("#online").append("<span class=\"badge badge-secondary\"><abbr title=\"Spectator\">" + pseudo_online_spectator[i] + "</abbr></span>&nbsp;");

		if (update == false)
			$("#loader").hide();

		var kill    = { x: pseudo, y: kill,    name: 'Kill',    type: 'bar' };
		var death   = { x: pseudo, y: death,   name: 'Death',   type: 'bar' };
		var suicide = { x: pseudo, y: suicide, name: 'Suicide', type: 'bar' };
		var data_kill_death_suicide = [kill, death, suicide];
		var layout_kill_death_suicide = {barmode: 'group', title: 'Kills, deaths and suicides', autorange: true};
		Plotly.newPlot('kill_death_suicide', data_kill_death_suicide, layout_kill_death_suicide);

		var kill_weapon_hammer  = { x: pseudo, y: kill_weapon_hammer,  name: 'Hammer',  type: 'bar' };
		var kill_weapon_gun     = { x: pseudo, y: kill_weapon_gun,     name: 'Gun',     type: 'bar' };
		var kill_weapon_shotgun = { x: pseudo, y: kill_weapon_shotgun, name: 'Shotgun', type: 'bar' };
		var kill_weapon_grenade = { x: pseudo, y: kill_weapon_grenade, name: 'Grenade', type: 'bar' };
		var kill_weapon_laser   = { x: pseudo, y: kill_weapon_laser,   name: 'Laser',   type: 'bar' };
		var kill_weapon_ninja   = { x: pseudo, y: kill_weapon_ninja,   name: 'Ninja',	  type: 'bar' };
		var data_kill_weapon = [kill_weapon_hammer, kill_weapon_gun, kill_weapon_shotgun, kill_weapon_grenade, kill_weapon_laser, kill_weapon_ninja];
		var layout_kill_weapon = {barmode: 'group', title: 'Kills by weapons'};
		Plotly.newPlot('kill_weapon', data_kill_weapon, layout_kill_weapon);

		var death_weapon_hammer  = { x: pseudo, y: death_weapon_hammer,  name: 'Hammer',  type: 'bar' };
		var death_weapon_gun     = { x: pseudo, y: death_weapon_gun,     name: 'Gun',     type: 'bar' };
		var death_weapon_shotgun = { x: pseudo, y: death_weapon_shotgun, name: 'Shotgun', type: 'bar' };
		var death_weapon_grenade = { x: pseudo, y: death_weapon_grenade, name: 'Grenade', type: 'bar' };
		var death_weapon_laser   = { x: pseudo, y: death_weapon_laser,   name: 'Laser',   type: 'bar' };
		var death_weapon_ninja   = { x: pseudo, y: death_weapon_ninja,   name: 'Ninja',   type: 'bar' };
		var data_death_weapon = [death_weapon_hammer, death_weapon_gun, death_weapon_shotgun, death_weapon_grenade, death_weapon_laser, death_weapon_ninja];
		var layout_death_weapon = {barmode: 'group', title: 'Deaths by weapons'};
		Plotly.newPlot('death_weapon', data_death_weapon, layout_death_weapon);

		var chrono = { x: pseudo_chrono, y: chrono, name: 'Flag time (sec)', type: 'bar' };
		var data_chrono = [chrono];
		var layout_chrono = {barmode: 'group', title: 'Chrono (shortest flag time in seconds)', autorange: true};
		Plotly.newPlot('chrono', data_chrono, layout_chrono);

		var item_heart   = { x: pseudo, y: item_heart,   name: 'Heart',   type: 'bar' };
		var item_armor   = { x: pseudo, y: item_armor,   name: 'Shield',  type: 'bar' };
		var item_shotgun = { x: pseudo, y: item_shotgun, name: 'Shotgun', type: 'bar' };
		var item_grenade = { x: pseudo, y: item_grenade, name: 'Grenade', type: 'bar' };
		var item_laser   = { x: pseudo, y: item_laser,   name: 'Laser',   type: 'bar' };
		var item_ninja   = { x: pseudo, y: item_ninja,   name: 'Ninja',   type: 'bar' };
		var data_item  = [item_heart, item_armor, item_shotgun, item_grenade, item_laser, item_ninja];
		var layout_item = {barmode: 'group', title: 'Items count'};
		Plotly.newPlot('item', data_item, layout_item);

		var flag_capture = { x: pseudo, y: flag_capture,  name: 'Capture', type: 'bar' };
		var flag_grab    = { x: pseudo, y: flag_grab,     name: 'Grab',    type: 'bar' };
		var flag_return  = { x: pseudo, y: flag_return,   name: 'Return',  type: 'bar' };
		var data_flag    = [flag_capture, flag_grab, flag_return];
		var layout_flag  = {barmode: 'group', title: 'Flag actions'};
		Plotly.newPlot('flag', data_flag, layout_flag);

		var time = { x: pseudo, y: time,   name: 'Time (sec)',  type: 'bar' };
		var data_time = [time];
		var layout_time = {barmode: 'group', title: 'Time spent (in minutes)'};
		Plotly.newPlot('time', data_time, layout_time);

		if (update == false)
			$("#raw_json").append("<a href=\"" + filename + "\" class=\"btn btn-primary\" role=\"button\" target=\"_blank\">Raw JSON data file</a>");
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