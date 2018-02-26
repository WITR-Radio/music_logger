/**
 * Created by Benjamin Reynolds on 5/1/2016.
 * Edited by Colin Reilly on 2/1/18.
 */
(function display($, d) {
    /*** SOCKETS ***/
    var socket = io.connect('http://' + document.domain + ':' + location.port);
    socket.on('connected', function (tracks) {
        /* Socket hit by the server once it has confirmed the client is connected */
        JSON.parse(tracks).forEach(add_track_to_top);
    });

    socket.on('addTracks', function (Tracks) {
        /* Socket used to add a track to the currently displayed page */
        JSON.parse(Tracks).forEach(add_track_to_top);
    });

    socket.on('updateTrack', function (id, time, title, artist, group, rivendell, requester) {
        /* Socket used to update a track on the currently displayed page */
        var row = $("tr#" + id.toString()).fadeOut();
        row.propertyIsEnumerable()
    });

    socket.on('search_results', function(tracks) {
        /* Socket hit once the server has our search results and is ready to display them */
        remove_all_tracks()
        JSON.parse(tracks).forEach(add_track_to_top);
    })

    socket.on('removeTrack', function(track) {
        /* Once the server has successfully deleted the track 
            from the database this socket is hit to remove the track
            from the page */
        $('#' + track).fadeOut();
    })

    /*** EVENT HANDLERS ***/
    window.onclick = function(event) {
        /* closes dropdowns when the user clicks off them */
        if (!event.target.matches('#start_search_input') && 
            !event.target.matches('#end_search_input')   &&
            !event.target.matches('.time_dropdown_content > span')) {

            $('.time_dropdown_content').removeClass('show');
        }
    }

    $('.time_dropdown > input').on('click', function () {
        /* toggles dropdown when time input fields are clicked in search bar */
        $(this).parent().find('.time_dropdown_content').toggleClass('show');
    });

    $('.time_dropdown_content > span').on('click', function () {
        /* inputs value and hides dropdown when time is selected in search bar */
        $(this).parent().parent().find('input').val($(this).html());

        $(this).parent().removeClass('show');
    });

    $('#search_btn').on('click', function () {
        /* Sends search query to the server */
        var artist = $('#artist_search_input').val();
        var title = $('#title_search_input').val();
        var date = $('#date_search_input').val();
        var start = $('#start_search_input').val();
        var end = $('#end_search_input').val();        
        socket.emit('query', {
            'artist': artist, 
            'title': title, 
            'date': date, 
            'start': start, 
            'end': end
        });
    });

    $('table').on('click', '.delete_btn', function () {
        /* Tells the server to delete the clicked track from the database */
        var track_id = $(this).parent().parent().attr('id');
        socket.emit('removeTrack', track_id);
    })

    /*** HELPERS ***/
    function add_track_to_top(track) {
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
            "<td class='update_clmn'><button class='update_btn'>UPDATE</button></td>" +            
            "<td class='delete_clmn'><button class='delete_btn'>DELETE</button></td>" +
            "</tr>").hide().insertAfter($("#column_headers")).fadeIn("slow");
    }

    function remove_all_tracks() {
        /* Removes all tracks from the page */
        $('tr:not(:first)').fadeOut();
    }
})(jQuery, detailed);
