/*** SOCKETS ***/
var socket = io.connect('http://' + document.domain + ':' + location.port);
socket.on('connected', function (tracks) {
    /* Socket hit by the server once it has confirmed the client is connected. */
    JSON.parse(tracks).forEach(add_track_to_top);
});

socket.on('add_tracks', function (Tracks) {
    /* Socket used to add a track to the currently displayed page. */
    JSON.parse(Tracks).forEach(add_track_to_top);
});

socket.on('update_track', function (data) {
    /* Socket used to update a track on the currently displayed page. */
    var row = $("tr#" + data['id'].toString());
    row.find('.artist_clmn').html(data['new_artist']);
    row.find('.title_clmn').html(data['new_title']);
    row.find('.play_time_clmn').html(data['new_time']);        
});

socket.on('successful_update', function (id) {
    /* Socket hit once the server validates and accepts the datetime format given
        by the client. */

    var row = $("tr#" + id.toString());
    var error_box = get_or_create_error_box(row);
    error_box.parent().parent().remove();

    /* Show non 'update mode' columns. */
    row.find('.artist_clmn'   ).show();
    row.find('.title_clmn'    ).show();
    row.find('.play_time_clmn').show();
    row.find('.update_btn'    ).show();  

    /* Hide 'update mode' columns. */
    row.find('.updating_artist'  ).hide();
    row.find('.updating_title'   ).hide();
    row.find('.updating_time'    ).hide();
    row.find('.submit_update_btn').hide();
    row.find('.cancel_update_btn').hide();
});

socket.on('invalid_update_datetime', function(id) {
    /* Socket hit by the server when it decides the given datetime format
        is invalid. Only applies to 'update track' functionality. */
    add_update_datetime_error(id);
});

socket.on('search_results', function(tracks) {
    /* Socket hit once the server has our search results and is ready to display them. */
    remove_all_tracks()
    JSON.parse(tracks).forEach(add_track_to_top);
});

socket.on('invalid_search_datetime', function() {
    /* Socket hit by the server when it decides the given datetime in the search query
        is invalid. */
    add_search_datetime_error();
});

socket.on('removeTrack', function(track) {
    /* Once the server has successfully deleted the track 
        from the database this socket is hit to remove the track
        from the page. */
    $('#' + track).fadeOut();
});