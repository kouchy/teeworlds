//main
$(function() {
	var currentTime = new Date();
	var month = currentTime.getMonth() +1;
	var day = currentTime.getDate();
	var year = currentTime.getFullYear();
	var filename = "stats_" + year + (month < 10 ? "0" : "") + month + (day < 10 ? "0" : "") + day;
	draw_online_players(root_dir + "/daily/" + filename, true);
	setInterval(function() { draw_online_players(root_dir + "/daily/" + filename, false); }, 5000);

	var dir = root_dir + "/daily";
	var fileextension = ".json";
	$.ajax({
		//This will retrieve the contents of the folder if the folder is configured as 'browsable'
		url: dir,
		success: function (data) {
			// List all json file names in the page
			$(data).find("a:contains(" + fileextension + ")").each(function () {
				var filename = this.href.replace(window.location.host, "").replace("http:///", "");
				var id = filename.replace(/\.[^/.]+$/, "");
				var date = id.replace(/stats_/g, "");
				date = date.slice(0, 4) + "-" + date.slice(4, 6) + "-" + date.slice(6, 8);
				$("#history_list").append($("<a href=\"#\" class=\"list-group-item list-group-item-action\" id=\""+ id +"\">" + date + "</a>"));

				$("#"+id).click(function() {
					$("#"+id).addClass("active");
					$("#title").empty();
					$("#title").append("<br/><h1>" + date + "</h1>");
					draw_dashboard(root_dir + "/daily/" + filename);
				});
			});
	    }
	});
});
