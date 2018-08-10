var lock = false;
var firstTimeCall = true;
function lock_buttons()
{
	$('.btn').attr('disabled','disabled');
	$("fieldset").attr('disabled','disabled');
}

function unlock_buttons()
{
	$("#btnRename").removeAttr('disabled','disabled');
	$("#btnMerge").removeAttr('disabled','disabled');
	$("fieldset").removeAttr('disabled','disabled');
}

var all_players = [];
function draw_form(path)
{
	if (firstTimeCall)
		$("form").submit(function() { return false; });

	$.getJSON(path, function( data )
	{
		all_players.forEach(function(pseudo,i){
			$(".custom-select option[value='"+i+"']").remove();
		});

		all_players = Object.keys(data);

		all_players.forEach(function(pseudo,i) {
			$('.custom-select').append($('<option>', {
				value: i,
				text : pseudo
			}));
		});

		if (firstTimeCall) {
			firstTimeCall=false;

			$.get("admin.php", {command: "status"}, function( data ) {
				$("#option_server_"+((data == 0)?"on":"off")).addClass("active");
				$("#option_server_"+((data == 0)?"off":"on")).removeClass("active");

				if (data == 0)
					lock_buttons();
				else
					unlock_buttons();

				$("#option_server_on").click(function(){
					if (!lock) {
						lock = true;
						lock_buttons();
						$.get("admin.php", {command: "start"}, function( data ) {
							lock = false;
						});
					}
				});

				$("#option_server_off").click(function(){
					if (!lock) {
						lock = true;
						lock_buttons();
						$.get("admin.php", {command: "stop"}, function( data ) {
							unlock_buttons();
							lock = false;
						});
					}
				});

				$("#btnRename").click(function(){
					let pseudoOld=$("#renamePseudoOld option:selected").text();
					let pseudoNew=$("#renamePseudoNew").val();
					if (!lock && pseudoOld != "" && pseudoNew != "" && $.inArray(pseudoNew, all_players) == -1) {
						lock = true;
						lock_buttons();
						$("#small-loader-rename").show();
						$.get("admin.php", {command: "rename", pseudoOld: encodeURIComponent(pseudoOld), pseudoNew: encodeURIComponent(pseudoNew)}, function( data ) {
							$("#small-loader-rename").hide();
							draw_form(path);
							$("#renamePseudoNew").val('');
							unlock_buttons();
							lock = false;
						});
					}
				});

				$("#btnMerge").click(function(){
					let pseudoFrom=$("#mergePseudoFrom option:selected").text();
					let pseudoTo=$("#mergePseudoTo option:selected").text();
					if (!lock && pseudoFrom != "" && pseudoTo != "" && pseudoFrom != pseudoTo) {
						lock = true;
						lock_buttons();
						$("#small-loader-merge").show();
						$.get("admin.php", {command: "merge", pseudoFrom: encodeURIComponent(pseudoFrom), pseudoTo: encodeURIComponent(pseudoTo)}, function( data ) {
							$("#small-loader-merge").hide();
							draw_form(path);
							unlock_buttons();
							lock = false;
						});
					}
				});

				$("#btnRemove").click(function(){
					let pseudo=$("#removePseudo option:selected").text();
					let pseudoConfirm=$("#removePseudoConfirm").val();
					if (!lock && $("#removePseudo").val() != "" && pseudo == pseudoConfirm) {
						lock = true;
						lock_buttons();
						console.log("pseudo="+pseudo);
						console.log("pseudoConfirm="+pseudoConfirm);
						console.log("encodeURIComponent(pseudo)="+encodeURIComponent(pseudo));
						$("#small-loader-remove").show();
						$.get("admin.php", {command: "remove", pseudo: encodeURIComponent(pseudo)}, function( data ) {
							$("#small-loader-remove").hide();
							draw_form(path);
							$("#removePseudoConfirm").val('');
							unlock_buttons();
							lock = false;
						});
					}
				});

				$("#renamePseudoNew").change(function(){
					let pseudoNew=$("#renamePseudoNew").val();
					if ($.inArray(pseudoNew, all_players) == -1 && data == 1)
						$("#btnRename").removeAttr('disabled');
					else
						$('#btnRename').attr('disabled','disabled');
				});

				$("#mergePseudoFrom").change(function(){
					let pseudoFrom=$("#mergePseudoFrom option:selected").text();
					let pseudoTo=$("#mergePseudoTo option:selected").text();
					if (pseudoFrom != pseudoTo && data == 1)
						$("#btnMerge").removeAttr('disabled');
					else
						$('#btnMerge').attr('disabled','disabled');
				});

				$("#mergePseudoTo").change(function(){
					let pseudoFrom=$("#mergePseudoFrom option:selected").text();
					let pseudoTo=$("#mergePseudoTo option:selected").text();
					if (pseudoFrom != pseudoTo && data == 1)
						$("#btnMerge").removeAttr('disabled');
					else
						$('#btnMerge').attr('disabled','disabled');
				});

				$("#removePseudoConfirm").change(function(){
					let pseudo=$("#removePseudo option:selected").text();
					let pseudoConfirm=$("#removePseudoConfirm").val();
					if ($("#removePseudo").val() != "" && pseudo == pseudoConfirm && data == 1)
						$("#btnRemove").removeAttr('disabled');
					else
						$('#btnRemove').attr('disabled','disabled');
				});
			});
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
	draw_form("../" + g_root_dir + "/total/" + path);
	draw_online_players("../" + g_root_dir + "/daily/" + path, true);
	setInterval(function() { draw_online_players("../" + g_root_dir + "/daily/" + path, false); }, 5000);
});