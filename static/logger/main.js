/**
 * Created by Benjamin Reynolds on 5/1/2016.
 * Edited by Colin Reilly on 2/1/18.
 */
(function display($, d) {
    /*** SOCKETS ***/
    var socket = io.connect('http://' + document.domain + ':' + location.port);
    socket.on('connected', function (tracks) {
        /* Socket hit by the server once it has confirmed the client is connected */
        JSON.parse(tracks).forEach(addTrackToTop);
    });

    socket.on('addTracks', function (Tracks) {
        /* Socket used to add a track to the currently displayed page */
        JSON.parse(Tracks).forEach(addTrackToTop);
    });

    socket.on('updateTrack', function (id, time, title, artist, group, rivendell, requester) {
        /* Socket used to update a track on the currently displayed page */
        var row = $("tr#" + id.toString()).fadeOut();
        row.propertyIsEnumerable()
    });

    socket.on('search_results', function(tracks) {
        /* Socket hit once the server has our search results and is ready to display them */
        JSON.parse(tracks).forEach(addTrackToTop);
    })

    socket.on('removeTrack', function(track) {
        /* Once the server has successfully deleted the track 
            from the database this socket is hit to remove the track
            from the page */
        $('#' + track).fadeOut();
    })

    /*** EVENT HANDLERS ***/
    $('#search_btn').on('click', function () {
        /* Sends search query to the server */
        // socket.send('search', {'title': title, 'artist': artist, 'start': start.toString(), 'end': end.toString()});
        var artist = $('#artist_search_input').val();
        var title = $('#title_search_input').val();
        socket.emit('query', {'artist': artist, 'title': title});
    });

    $('table').on('click', '.delete_btn', function () {
        /* Tells the server to delete the clicked track from the database */
        var track_id = $(this).parent().parent().attr('id');
        socket.emit('removeTrack', track_id);
    })

    /*** HELPERS ***/
    function addTrackToTop(track) {
        /* Takes JSON dictionary @tracks and each tracks stored in it as a row of html on the page */
        $("<tr id='" + track.id + "' >" +
            "<td class='artist_clmn'>" + track.artist + "</td>" +
            "<td class='title_clmn'>" + track.title + "</td>" +
            "<td class='play_time_clmn'>" + track.time + "</td>" +
            (detailed ?
            "<td>" +
            ( track.rvdl ? "<a>rvdl</a>" : "") +
            "</td>" +
            "<td>" + track.group + "</td>" +
            "<td>" + (track.requester ? track.requester : "" ) + "</td>" : "") +
            "<td class='delete_clmn'><button class='delete_btn'>DELETE</button></td>" +
            "</tr>").hide().insertAfter($("#column_headers")).fadeIn("slow");
    }
})(jQuery, detailed);
