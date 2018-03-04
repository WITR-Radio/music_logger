/*** EVENT HANDLERS ***/
/* Search */
window.onclick = function(event) {
    /* closes dropdowns when the user clicks off somewhere else on the screen. */
    if (!event.target.matches('#start_search_input') && 
        !event.target.matches('#end_search_input')   &&
        !event.target.matches('.time_dropdown_content > span')) {

        $('.time_dropdown_content').hide();
    }
};

$('.time_dropdown > input').on('click', function () {
    /* toggles dropdown when time input fields are clicked in search bar. */
    $(this).parent().find('.time_dropdown_content').toggle();
});

$('.time_dropdown_content > span').on('click', function () {
    /* inputs value and hides dropdown when time is selected in search bar. */
    $(this).parent().parent().find('input').val($(this).html());

    $(this).parent().hide();
});

$('#search_btn').on('click', function () {
    /* Sends search query to the server. */
    $(".search_error_box").html("");

    var artist = $('#artist_search_input').val();
    var title  = $('#title_search_input').val();
    var date   = $('#date_search_input').val();
    var start  = $('#start_search_input').val();
    var end    = $('#end_search_input').val();        
    socket.emit('search_track', {
        'artist': artist, 
        'title' : title, 
        'date'  : date, 
        'start' : start, 
        'end'   : end
    });
});

/* Adding Tracks */
$('#add_track_btn').on('click', function () {
    /* Adds a blank row to the top of the page representing a new track input. */
    $("<tr id='-1' >" +
        "<td><input class='adding_artist' name='artist' type='text'></td>" +
        "<td><input class='adding_title'  name='title'  type='text'></td>" +
        "<td><input class='adding_time'   name='time'   type='text'></td>" +
        "<td class='submit_update_clmn'><button class='submit_add_btn'>SUBMIT</button></td>" +
        "<td class='cancel_update_clmn'><button class='cancel_add_btn'>CANCEL</button></td>" +
        "</tr>").insertAfter($("#column_headers"));
});

$('table').on('click', '.cancel_add_btn', function () {
    /* Button cancel adding a new track to logger. */
    var row = $(this).parent().parent();

    remove_errors_for(row);

    row.remove();
});

$('table').on('click', '.submit_add_btn', function () {
    /* Submits the new track to the logger and checks for errors. */
    var row = $(this).parent().parent();
    var datetime = row.find(".updating_time");

    remove_errors_for(row); // Prevent duplicate errors being shown

    if (has_no_blank_inputs(row)) {
        socket.emit('add_track_to_db', {
            'new_artist': row.find('.adding_artist').val(),
            'new_title' : row.find('.adding_title').val(),
            'new_time'  : row.find('.adding_time').val()
        })
    
        row.remove();
    }
    /* Take care of removing errors and showing correct fields in the 
        track row once the server decides the datetime is valid or not */
});

/* Updating Tracks */
$('table').on('click', '.update_btn', function () {
    /* Converts a track row to 'update mode' showing editable fields and new buttons. */
    var row = $(this).parent().parent();
    
    /* Get the currently displayed colums. */
    var artist_clmn    = row.find('.artist_clmn');
    var title_clmn     = row.find('.title_clmn');
    var play_time_clmn = row.find('.play_time_clmn');        

    /* Show and fill in the 'update mode' columns. */
    row.find('.updating_artist').val(artist_clmn.html()).show();
    row.find('.updating_title' ).val(title_clmn.html()).show();
    row.find('.updating_time'  ).val(play_time_clmn.html()).show();
    row.find('.submit_update_btn').show();
    row.find('.cancel_update_btn').show();

    /* Hide the non 'update mode' columns. */
    artist_clmn.hide();
    title_clmn.hide();
    play_time_clmn.hide();
    row.find('.update_btn').hide();
});

$('table').on('click', '.cancel_update_btn', function () {
    /* Cancels the track update. */
    var row = $(this).parent().parent();

    remove_errors_for(row);

    /* Show the non 'update mode' columns. */
    row.find('.artist_clmn'   ).show();
    row.find('.title_clmn'    ).show();
    row.find('.play_time_clmn').show();
    row.find('.update_btn'    ).show();  

    /* Hide the 'update mode' columns. */
    row.find('.updating_artist'   ).hide();
    row.find('.updating_title'    ).hide();
    row.find('.updating_time'     ).hide();
    row.find('.submit_update_btn' ).hide();
    row.find('.cancel_update_btn' ).hide();
});

$('table').on('click', '.submit_update_btn', function () {
    /* Submits an updated track to the server. */
    var row = $(this).parent().parent();

    remove_errors_for(row);

    if (has_no_blank_inputs(row)) {
        /* Send updates via socket. */
        socket.emit('commit_update', {
            'track_id'  : row.attr('id'),
            'new_artist': row.find('.updating_artist').val(),
            'new_title' : row.find('.updating_title' ).val(),
            'new_time'  : row.find('.updating_time'  ).val()            
        })
    };
});

/* Deleting Tracks */
$('table').on('click', '.delete_btn', function () {
    /* Tells the server to delete the clicked track from the database */
    var track_id = $(this).parent().parent().attr('id');
    socket.emit('removeTrack', track_id);
});