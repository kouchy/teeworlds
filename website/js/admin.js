var lock = false;
function lock_buttons()
{
	// $('.btn-group').attr('disabled','disabled');
	$('.btn').attr('disabled','disabled');
}

function unlock_buttons()
{
	// $('.btn-group').removeAttr('disabled');
	// $('.btn').removeAttr('disabled');
	$("#btnRename").removeAttr('disabled','disabled');
	$("#btnMerge").removeAttr('disabled','disabled');
}

function draw_form(path)
{
	$("form").submit(function() { return false; });

	$.get("admin.php?command=status", function( data ) {
		$("#option_server_"+((data == 0)?"on":"off")).addClass("active");
		$("#option_server_"+((data == 0)?"off":"on")).removeClass("active");

		if (data == 0)
			lock_buttons();
		else
			unlock_buttons()

		$("#option_server_on").click(function(){
			if (!lock) {
				lock = true;
				lock_buttons();
				let uri = "command=start";
				$.get("admin.php?"+uri, function( data ) {
					lock = false;
				});
			}
		});

		$("#option_server_off").click(function(){
			if (!lock) {
				lock = true;
				lock_buttons();
				let uri = "command=stop";
				$.get("admin.php?"+uri, function( data ) {
					unlock_buttons();
					lock = false;
				});
			}
		});

		$("#btnRename").click(function(){
			let pseudoOld=$("#renamePseudoOld").val();
			let pseudoNew=$("#renamePseudoNew").val();
			if (!lock && pseudoOld != "" && pseudoNew != "") {
				lock = true;
				lock_buttons();
				let uri = "command=rename&pseudoOld="+pseudoOld+"&pseudoNew="+pseudoNew;
				$.get("admin.php?"+uri, function( data ) {
					unlock_buttons();
					lock = false;
				});
			}
		});

		$("#btnMerge").click(function(){
			let pseudoFrom=$("#mergePseudoFrom").val();
			let pseudoTo=$("#mergePseudoTo").val();
			if (!lock && pseudoFrom != "" && pseudoTo != "") {
				lock = true;
				lock_buttons();
				let uri = "command=merge&pseudoFrom="+pseudoFrom+"&pseudoTo="+pseudoTo;
				$.get("admin.php?"+uri, function( data ) {
					unlock_buttons();
					lock = false;
				});
			}
		});

		$("#btnRemove").click(function(){
			let pseudo=$("#removePseudo").val();
			let pseudoConfirm=$("#removePseudoConfirm").val();
			if (!lock && pseudo != "" && pseudo == pseudoConfirm) {
				lock = true;
				lock_buttons();
				let uri = "command=remove&pseudo="+pseudo;
				$.get("admin.php?"+uri, function( data ) {
					unlock_buttons();
					lock = false;
				});
			}
		});

		$("#removePseudoConfirm").change(function(){
			let pseudo=$("#removePseudo").val();
			let pseudoConfirm=$("#removePseudoConfirm").val();
			if (pseudo != "" && pseudo == pseudoConfirm)
				$("#btnRemove").removeAttr('disabled');
			else
				$('#btnRemove').attr('disabled','disabled');
		});

	});

	$.getJSON( path, function( data )
	{
		let all_players = Object.keys(data);
		console.log(all_players);

		all_players.forEach(function(pseudo,i){
			$('.custom-select').append($('<option>', {
				value: pseudo,
				text : pseudo
			}));
		});
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