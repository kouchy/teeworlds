var selected_date;
var available_dates = [];
var disabled_dates = [];
var first_time = true;

function findGetParameter(parameterName) {
	let result = null,
	tmp = [];
	window.location.search
		.substr(1)
		.split("&")
		.forEach(function (item) {
			tmp = item.split("=");
			if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
		});
	return result;
}

function render(path)
{
	let date = path.replace(/.*stats_([0-9]*)\.json/g, "$1");
	date = date.slice(6, 8) + "/" + date.slice(4, 6) + "/" + date.slice(0, 4);
	let type = path.replace(/.*\/(.*)\/stats_[0-9]*\.json/g, "$1");

	$("#datepicker").val(date);

	$.ajax({
		url: path,
		type:'HEAD',
		error: function()
		{
			$("#title").empty();
			$("#dashboard").hide();
			$("#history_error_date").empty();
			$("#history_error_date").append(date);
			$("#history_error").show();
		},
		success: function()
		{
			let uri = "/history.html?file=" + encodeURIComponent(path);
			window.history.replaceState({},"teeworlds.potionmagic.eu",uri);

			$("#dashboard").show();
			$("#history_error").hide();
			$("#title").empty();
			$("#title").append("<br/><h1> History from the " + date + " (" + type + ")</h1>");
			draw_dashboard(path);
		}
	});
}

//main
$(document).ready(function() {
	let currentTime = new Date();
	let month = currentTime.getMonth() +1;
	let day = currentTime.getDate();
	let year = currentTime.getFullYear();
	let filename = "stats_" + year + (month < 10 ? "0" : "") + month + (day < 10 ? "0" : "") + day;
	draw_online_players(root_dir + "/daily/" + filename, true);
	setInterval(function() { draw_online_players(root_dir + "/daily/" + filename, false); }, 5000);

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
				let obj = {
					year: parseInt(date.slice(0, 4)),
					month: parseInt(date.slice(4, 6)),
					day: parseInt(date.slice(6, 8))
				}

				$.getJSON(dir+"/"+filename, function(json){
					if ($.isEmptyObject(json) == false)
						available_dates.push(new Date(obj.year, obj.month -1, obj.day, 0, 0, 0, 0));
				});
			});
	    }
	});

	$(document).ajaxStop(function () {
		if (first_time)
		{
			first_time = false;
			let today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

			let path = findGetParameter("file")
			let get_date = "";
			if (path != undefined)
			{
				get_date = path.replace(/.*stats_([0-9]*)\.json/g, "$1");
				get_date = get_date.slice(6, 8) + "/" + get_date.slice(4, 6) + "/" + get_date.slice(0, 4);
				selected_date = get_date;
			}

			$('#datepicker').datepicker({
				format: 'dd/mm/yyyy',
				value: get_date,
				uiLibrary: 'bootstrap4',
				minDate: '10/07/2018',
				maxDate: today,
				disableDates: function (date) {
					for (let i = 0; i < available_dates.length; i++)
						if (available_dates[i].getTime() == date.getTime())
							return true;
					return false;
				}
			});

			if (path != undefined)
				render(path);

			$("#datepicker").change(function() {
				new_date = $("#datepicker").val();
				if (new_date != selected_date)
				{
					let split = new_date.split("/");
					let year = split[2];
					let month = split[1];
					let day = split[0];
					selected_date = new_date;
					let filename = "stats_" + year+month+day + ".json";

					render(root_dir + "/daily/" + filename);
				}
			});
		}
	});
});
