/**
 * Created by Benjamin Reynolds on 5/1/2016.
 * Edited by Colin Reilly on 2/1/18.
 */
(function display($, d) {
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

    socket.on('removeTrack', function (id) {
        /* Socket used to remove a track from the currently displayed page */
        $("#" + id.toString()).fadeOut().remove();
    });

    socket.on('search_results', function(tracks) {
        /* Socket hit once the server has our search results and is ready to display them */
        JSON.parse(tracks).forEach(addTrackToTop);
    })

    $("#Search").on('click', function () {
        /* Sends search query to the server */
        // socket.send('search', {'title': title, 'artist': artist, 'start': start.toString(), 'end': end.toString()});
        var artist = $('#artistInput').val();
        var title = $('#titleInput').val();
        socket.emit('query', {'artist': artist, 'title': title});
    });

    function addTrackToTop(track) {
        /* Takes JSON dictionary @tracks and each tracks stored in it as a row of html on the page */
        $("<tr id='" + track.id + "' >" +
            "<td>" + track.artist + "</td>" +
            "<td>" + track.title + "</td>" +
            "<td>" + track.time + "</td>" +
            (detailed ?
            "<td>" +
            ( track.rvdl ? "<a>rvdl</a>" : "") +
            "</td>" +
            "<td>" + track.group + "</td>" +
            "<td>" + (track.requester ? track.requester : "" ) + "</td>" : "") +
            "</tr>").hide().insertAfter($("#column_headers")).fadeIn("slow");
    }
})(jQuery, detailed);
