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

            $('.time_dropdown_content').hide();
        }
    }

    $('.time_dropdown > input').on('click', function () {
        /* toggles dropdown when time input fields are clicked in search bar */
        $(this).parent().find('.time_dropdown_content').toggle();
    });

    $('.time_dropdown_content > span').on('click', function () {
        /* inputs value and hides dropdown when time is selected in search bar */
        $(this).parent().parent().find('input').val($(this).html());

        $(this).parent().hide();
    });

    $('#search_btn').on('click', function () {
        /* Sends search query to the server */
        var artist = $('#artist_search_input').val();
        var title  = $('#title_search_input').val();
        var date   = $('#date_search_input').val();
        var start  = $('#start_search_input').val();
        var end    = $('#end_search_input').val();        
        socket.emit('query', {
            'artist': artist, 
            'title' : title, 
            'date'  : date, 
            'start' : start, 
            'end'   : end
        });
    });

    $('table').on('click', '.update_btn', function () {
        var row = $(this).parent().parent();
        
        var artist_clmn    = row.find('.artist_clmn');
        var title_clmn     = row.find('.title_clmn');
        var play_time_clmn = row.find('.play_time_clmn');        

        row.find('.updating_artist').val(artist_clmn.html()).show();
        row.find('.updating_title' ).val(title_clmn.html()).show();
        row.find('.updating_time'  ).val(play_time_clmn.html()).show();
        row.find('.submit_btn').show();
        row.find('.cancel_btn').show();

        artist_clmn.hide();
        title_clmn.hide();
        play_time_clmn.hide();
        row.find('.update_btn').hide();
    });

    $('table').on('click', '.cancel_btn', function () {
        var row = $(this).parent().parent();

        row.find('.artist_clmn'   ).show();
        row.find('.title_clmn'    ).show();
        row.find('.play_time_clmn').show();
        row.find('.update_btn'    ).show();  

        row.find('.updating_artist').hide();
        row.find('.updating_title' ).hide();
        row.find('.updating_time'  ).hide();
        row.find('.submit_btn'     ).hide();
        row.find('.cancel_btn'     ).hide();
    });

    $('table').on('click', '.submit_btn', function () {
        var row = $(this).parent().parent();

        socket.emit('update', {
            'track_id'  : row.attr('id'),
            'new_artist': row.find('.updating_artist').val(),
            'new_title' : row.find('.updating_title').val(),
            'new_time'  : row.find('.updating_time').val()            
        })
    });

    $('table').on('click', '.delete_btn', function () {
        /* Tells the server to delete the clicked track from the database */
        var track_id = $(this).parent().parent().attr('id');
        socket.emit('removeTrack', track_id);
    });

    /*** HELPERS ***/
    function add_track_to_top(track) {
        /* Takes JSON dictionary @tracks and puts each track stored in it as a <tr> on the page */
        $("<tr id='" + track.id + "' >" +
            "<td class='artist_clmn'>"    + track.artist + "</td>" +
            "<td class='title_clmn'>"     + track.title  + "</td>" +
            "<td class='play_time_clmn'>" + track.time   + "</td>" +
            "<td><input class='updating_artist' type='text'></td>" +
            "<td><input class='updating_title' type='text'></td>" +
            "<td><input class='updating_time' type='text'></td>" +
            (detailed ?
            "<td>" +
            ( track.rvdl ? "<a>rvdl</a>" : "") +
            "</td>" +
            "<td>" + track.group + "</td>" +
            "<td>" + (track.requester ? track.requester : "" ) + "</td>" : "") +
            "<td class='submit_clmn'><button class='submit_btn'>SUBMIT</button></td>" +
            "<td class='cancel_clmn'><button class='cancel_btn'>CANCEL</button></td>" +            
            "<td class='update_clmn'><button class='update_btn'>UPDATE</button></td>" +            
            "<td class='delete_clmn'><button class='delete_btn'>DELETE</button></td>" +
            "</tr>").hide().insertAfter($("#column_headers")).fadeIn("slow");
    }

    function remove_all_tracks() {
        /* Removes all tracks from the page */
        $('tr:not(:first)').fadeOut();
    }
})(jQuery, detailed);
