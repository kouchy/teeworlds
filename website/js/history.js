//main
$(document).ready(function() {
	var dir = root_dir;
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
				date = date.charAt(0) + date.charAt(1) + date.charAt(2) + date.charAt(3) + "-" + date.charAt(4) + date.charAt(5) + "-" + date.charAt(6) + + date.charAt(7);
				$("#history_list").append($("<a href=\"#\" class=\"list-group-item list-group-item-action\" id=\""+ id +"\">" + date + "</a>"));

				$("#"+id).click(function() {
					$("#"+id).addClass("active");
					$("#title").empty();
					$("#title").append("<br/><h1>" + date + "</h1>");
					draw_dashboard(root_dir + "/" + filename);
				});
			});
	    }
	});
});