var selected_date = "";
var available_dates = [];
var disabled_dates = [];
var rendered = false;
var first_time = true;
var stats_type = "daily";

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
	let date = get_date_from_path(path);
	let type = get_type_from_path(path);

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
			rendered = true;
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
	draw_online_players(root_dir + "/" + stats_type + "/" + filename, true);
	setInterval(function() { draw_online_players(root_dir + "/" + stats_type + "/" + filename, false); }, 5000);

	let path = findGetParameter("file");
	if (path != undefined)
	{
		let type = get_type_from_path(path);
		stats_type = type;
		$("#option_"+type).button('toggle');
	}

	$("#option_daily").on('click', function(){
		path = findGetParameter("file");
		if (stats_type != "daily")
		{
			stats_type = "daily";
			if (path != undefined && rendered == true)
				render(path.replace(/total/g, stats_type));
		}
	});

	$("#option_total").on('click', function(){
		path = findGetParameter("file");
		if (stats_type != "total")
		{
			stats_type = "total";
			if (path != undefined && rendered == true)
				render(path.replace(/daily/g, stats_type));
		}
	});

	let dir = root_dir + "/" + stats_type;
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

			if (path != undefined)
				selected_date = get_date_from_path(path);

			$('#datepicker').datepicker({
				format: 'dd/mm/yyyy',
				value: selected_date,
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
					let year = get_year_from_date(new_date);
					let month = get_month_from_date(new_date);
					let day = get_day_from_date(new_date);
					selected_date = new_date;
					let filename = "stats_" + year+month+day + ".json";
					render(root_dir + "/" + stats_type + "/" + filename);
				}
			});
		}
	});
});
