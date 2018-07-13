var online_players = [];

function notify_new_player(player, status, left=false) {
	var title = "Teeworlds Inria/IMS";
	var options = {
		body: `${player} ${ left ? "left the game!" : "joined the " + status + " team!" }`,
		icon: "images/tee_small.png"
	}

	// Let's check if the browser supports notifications
	if (!("Notification" in window)) {
		console.log("This browser does not support desktop notification");
	} else if (Notification.permission === "granted") {
		// Let's check whether notification permissions have already been granted
		// If it's okay let's create a notification
		new Notification(title, options);
	} else if (Notification.permission !== 'denied' || Notification.permission === "default") {
		// Otherwise, we need to ask the user for permission
		Notification.requestPermission(function (permission) {
			// If the user accepts, let's create a notification
			if (permission === "granted") {
				new Notification(title, options);
			}
		});
	}

	// At last, if the user has denied notifications, and you
	// want to be respectful there is no need to bother them any more.
}

function draw_online_players(filename, first = true)
{
	$.getJSON( filename, function( data ) {
		let all_players = Object.keys(data);

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
		let current_online_players = diff(all_players, player_statuses["offline"]);
		if (first == false)
		{
			// newly online players
			diff(current_online_players, online_players).forEach(p => notify_new_player(p, data[p].game.team));
			// newly offline players
			diff(online_players, current_online_players).forEach(p => notify_new_player(p, data[p].game.team, true));
		}
		online_players = current_online_players;

		$("#online").empty();
		if (n_online) {
			$("#online").append(`${n_online} player${n_online > 1 ? "s" : ""} online: `);
			Object.entries(online_statuses).forEach(entry => {
				player_statuses[entry[0]].forEach(player => {
					$("#online").append(`<span class="badge badge-${entry[1].class}"><abbr title="${entry[1].title}">${player}</abbr></span>&nbsp;`);
				});
			});
		}
	});
}