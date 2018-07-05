/*** SOCKETS ***/
var socket = io.connect(null, {port: location.port, rememberTransport: false});

socket.on('connected', function (tracks) {
    /* Socket hit by the server once it has confirmed the client is connected. */
    JSON.parse(tracks).forEach(function(track) {
        add_track($('#column_headers'), 'after', track);
    });

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

    // Allows client to ask server for more tracks.
    $('table#tracks').data('more_results', true);
});

socket.on('add_tracks', function (tracks) {
    /* Socket used to add a track to the currently displayed page. */
    JSON.parse(tracks).forEach(function(track) {
        add_track($('#column_headers'), 'after', track);
    });
});

socket.on('update_track', function (data) {
    /* Socket hit once the server validates and accepts the datetime format
        given by the client. In comparison to the 'successful_update' socket
        also in this file, this socket is emitted to all connected clients and
        updates everybodies track list to reflect the changes in the database. */
    $("tr#" + data['id'].toString()).remove();
    
    insert_based_on_date(data);
});

socket.on('successful_update', function (id) {
    /* Socket hit once the server validates and accepts the datetime format given
        by the client. In comparison to the 'update_track' socket also in this 
        file, this socket is emitted only to the client which submitted the update.*/

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
    row.find('.artist_input'   ).parent().hide();
    row.find('.title_input'    ).parent().hide();
    row.find('.time_input'     ).parent().hide();
    row.find('.submit_update_btn' ).parent().hide();
    row.find('.cancel_update_btn' ).parent().hide();
});

socket.on('invalid_update_datetime', function(id) {
    /* Socket hit by the server when it decides the given datetime format
        is invalid. */
    add_update_datetime_error(id);
});

socket.on('invalid_update_group_name', function(id) {
    /* Socket hit by the server when it decides the given group name
        is invalid. */
    add_invalid_group_name_error(id);
});

socket.on('search_results', function(data) {
    /* Socket hit once the server has our search results and is ready to display them. */
    remove_all_tracks()
    JSON.parse(data['tracks']).forEach((track) => {
        add_track($('#column_headers'), 'after', track);
    });
    
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
    $('#' + track).fadeOut( 400, function () {
        update_row_highlights();
    });
});

socket.on('load_more_results', function(tracks) {
    /* Hit by server once it has retreived 20 new tracks from the database */
    JSON.parse(tracks).forEach(function(track) {
        add_track($('table#tracks').find('tr').last(), 'after', track);
    });

    // Unlock scrolling to bottom detection
    $('table#tracks').data('detect_scroll', true);
});

socket.on('no_more_results', function() {
    /* Hit by server when it has run out of tracks to display for the current search query. */
    $('table#tracks').data('detect_scroll', true);  // Turns back on scroll detection. 
    $('table#tracks').data('more_results', false);  // Restricts page from asking server for more tracks.
});
