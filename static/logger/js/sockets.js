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

socket.on('search_results', function(tracks) {
    /* Socket hit once the server has our search results and is ready to display them. */
    remove_all_tracks()
    JSON.parse(tracks).forEach(add_track_to_top);
});

socket.on('removeTrack', function(track) {
    /* Once the server has successfully deleted the track 
        from the database this socket is hit to remove the track
        from the page. */
    $('#' + track).fadeOut();
});