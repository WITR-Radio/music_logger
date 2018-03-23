/*** SOCKETS ***/
var socket = io.connect('http://' + document.domain + ':' + location.port);
socket.on('connected', function (tracks) {
    /* Socket hit by the server once it has confirmed the client is connected. */
    JSON.parse(tracks).forEach(add_track_to_top);

    // Set the amount of tracks shown on page
    // used for infinite scrolling
    $('table#tracks').data('n_tracks_shown', 20);

    // Set the 'last search query' to nothing
    // also used for infinite scrolling
    $('table#tracks')
        .data('lsq_date',       '')
        .data('lsq_start_time', '')
        .data('lsq_end_time',   '')
        .data('lsq_artist',     '')
        .data('lsq_song',       '');

    // Unlock scrolling to bottom detection
    $('table#tracks').data('detect_scroll', true);
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
    row.find('.update_btn'    ).parent().show();
    row.find('.delete_btn'    ).parent().show();

    /* Hide 'update mode' columns. */
    row.find('.updating_artist'  ).parent().hide();
    row.find('.updating_title'   ).parent().hide();
    row.find('.updating_time'    ).parent().hide();
    row.find('.submit_update_btn').parent().hide();
    row.find('.cancel_update_btn').parent().hide();
});

socket.on('invalid_update_datetime', function(id) {
    /* Socket hit by the server when it decides the given datetime format
        is invalid. Only applies to 'update track' functionality. */
    add_update_datetime_error(id);
});

socket.on('search_results', function(data) {
    /* Socket hit once the server has our search results and is ready to display them. */
    remove_all_tracks()
    JSON.parse(data['tracks']).forEach(add_track_to_top);
    
    $('table#tracks')
        .data('lsq_date',       data['query']['date'])
        .data('lsq_start_time', data['query']['start'])
        .data('lsq_end_time',   data['query']['end'])
        .data('lsq_artist',     data['query']['artist'])
        .data('lsq_song',       data['query']['title']);
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

socket.on('load_more_results', function(tracks) {
    /* Hit by server once it has retreived 20 new tracks from the database */
    JSON.parse(tracks).forEach(add_track_to_bottom);

    // Increment number of tracks shown on page
    $('table#tracks').data('n_tracks_shown',
        $('table#tracks').data('n_tracks_shown') + 20
    )

    // Unlock scrolling to bottom detection
    $('table#tracks').data('detect_scroll', true);
});
