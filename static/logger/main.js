/**
 * Created by Benjamin Reynolds on 5/1/2016.
 */
(function display($, d) {
    var socket = io.connect('http://' + document.domain + ':' + location.port);
    socket.on('connected', function (tracks) {
        JSON.parse(tracks).forEach(addTrackToTop);
    });

    socket.on('addTracks', function (Tracks) {
        JSON.parse(Tracks).forEach(addTrack);
    });

    socket.on('updateTrack', function (id, time, title, artist, group, rivendell, requester) {
        var row = $("tr#" + id.toString()).fadeOut();
        row.propertyIsEnumerable()
    });

    socket.on('removeTrack', function (id) {
        $("#" + id.toString()).fadeOut().remove();
    });

    socket.on('results', function(tracks) {
        JSON.parse(tracks).forEach(addTrackToTop);
    })

    /* pagination: store date range client side and query */
    function nextRange() {
        socket.send();
        $("tr").fadeOut("fast").remove();
    }

    $("#Search").on('click', function () {
        // socket.send('search', {'title': title, 'artist': artist, 'start': start.toString(), 'end': end.toString()});
        var artist = $('#artistInput').val();
        var title = $('#titleInput').val();
        socket.emit('query', {'artist': artist, 'title': title});
    });

    function addTrackToTop(track) {
        $("<tr id='" + track.id + "' >" +
            "<td class='text-center'>" + track.artist + "</td>" +
            "<td  class='text-center'>" + track.title + "</td>" +
            "<td  class='text-center'>" + track.time + "</td>" +
            (detailed ?
            "<td  class='text-center'>" +
            ( track.rvdl ? "<a class='button tiny disabled round alert'>rvdl</a>" : "") +
            "</td>" +
            "<td  class='text-center'>" + track.group + "</td>" +
            "<td  class='text-center'>" + (track.requester ? track.requester : "" ) + "</td>" : "") +
            "</tr>").hide().insertAfter($("#column_headers")).fadeIn("slow");
    }
})(jQuery, detailed);
