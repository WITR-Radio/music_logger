/**
 * Created by Colin Reilly on 2/4/2018
 */

(function display($) {
    var socket = io.connect('http://' + document.domain + ':' + location.port);
    socket.on('connected', function (tracks) {
        /* Socket hit by the server once it has confirmed the client is connected */
        JSON.parse(tracks).forEach(addTrackToTop);
    });

    $("#add_new_track").on('click', function() {
        /* submits a new track to the server */
        var artist = $()
    })
})(jQuery);
