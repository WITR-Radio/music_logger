/*** EVENT HANDLERS ***/
var witr_blue = '#06a7e1';
var lbl_clr = '#8b8b8b';


/* Dropdown */
function toggle_dropdown(input) {
    $(input).parent().find('.dropdown_content').toggle();
}

function input_and_hide(span) {
    $(span).parent().parent().find('input').val($(span).html());
    $(span).parent().hide();
}

window.onclick = function (event) {
    /* closes dropdowns when the user clicks off somewhere else on the screen. */
    if (!event.target.matches('.dropdown > input') &&
        !event.target.matches('.dropdown_content > span')) {

        $('.dropdown_content').hide();
    }
};


/* Search */
$('.time_dropdown > input').on('click', function () {
    /* toggles dropdown when time input fields are clicked in search bar. */
    toggle_dropdown(this);
});

$('.time_dropdown_content > span').on('click', function () {
    /* inputs value and hides dropdown when time is selected in search bar. */
    input_and_hide(this);
});

$('#search_btn').on('click', function () {
    /* If search inputs are hidden, reveals them, 
        else sends search query to the server.*/
    var search_revealer = $('div.search_revealer');

    if (search_revealer.is(':visible')) {
        $('.search_error_box').html('');

        // Get values from search fields
        var artist = $('#artist_search_input').val();
        var title = $('#title_search_input').val();
        var date = $('#date_search_input').val();
        var start = $('#start_search_input').val();
        var end = $('#end_search_input').val();

        // If field is not blank add it to data dict
        var data = {};
        (artist ? data['artist'] = artist : null);
        (title ? data['title'] = title : null);
        (date ? data['date'] = date : null);
        (start ? data['start'] = start : null);
        (end ? data['end'] = end : null);
        data['is_main_logger'] = is_main_logger()
        data['push_state'] = 'true'  // Update window.history.state after tracks are loaded

        // Send search query to server
        socket.emit('search_track', data);

        // Allow page to ask server for more tracks
        $('table#tracks').data('more_results', true);
    } else {
        search_revealer.slideDown();
    }
});

$('input').focus(function () {
    /* Handlers to highlight search inputs when they are focused */
    if ($(this).attr('id') != 'search_btn') // don't highlight when clicking search btn
        $(this).parent().find('label').css('color', witr_blue);
}).focusout(function () {
    $(this).parent().find('label').css('color', lbl_clr);
});


/* Adding Tracks */
$('#add_track_btn').on('click', function () {
    /* Adds a blank row to the top of the page representing a new track input. */
    var new_col = $("<tr class='-1 noremove' style='background-color: white;'>" +
        "<td class='artist_clmn'>   <input class='artist_input' name='artist' type='text'></td>" +
        "<td class='title_clmn'>    <input class='title_input'  name='title'  type='text'></td>" +
        "<td class='play_time_clmn'><input class='time_input' id='add_time_input'  name='time'   type='text' readonly></td>" +
        "<td class='group_clmn'>" +
        "<div class='group_dropdown dropdown'>" +
        "<input class='group_input' type='text' readonly>" +
        "<div class='group_dropdown_content dropdown_content'>" +
        groups_dropdown_content() +
        "</div>" +
        "</div>" +
        "</td>" +
        "<td class='privileged_btn_clmn'><button class='submit_add_btn'>SUBMIT</button></td>" +
        "<td class='privileged_btn_clmn'><button class='cancel_add_btn'>CANCEL</button></td>" +
        "</tr>").insertAfter($(".noremove").first());

    // Display submit and cancel buttons
    new_col.find('.privileged_btn_clmn').each(function () {
        $(this).css('display', 'table-cell');
    });

    new_col.find('.time_input').datepicker({
        language: 'en',
        timepicker: true,
        dateFormat: 'mm/dd/yy'
    });
    var dp = $('#add_time_input').datepicker().data('datepicker');

    dp.selectDate(new Date());
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
    var datetime = row.find(".time_input");

    remove_errors_for(row); // Prevent duplicate errors being shown

    if (has_no_blank_inputs(row)) {
        socket.emit('add_track_to_db', {
            'new_artist': row.find('.artist_input').val(),
            'new_title': row.find('.title_input').val(),
            'new_time': row.find('.time_input').val(),
            'new_group': row.find('.group_input').val(),
            'is_main_logger': is_main_logger()
        })
        row.remove();
        remove_all_tracks();
        socket.emit('request_initial_tracks', {
            'is_main_logger': is_main_logger(),
            'query': uri_search_dict()
        });
    }
    /* Take care of removing errors and showing correct fields in the 
        track row once the server decides the datetime is valid or not */
});


/* Updating Tracks */
$('table').on('click', '.update_btn', function () {
    /* Converts a track row to 'update mode' showing editable fields and new buttons. */
    var row = $(this).parent().parent();

    /* Get the currently displayed colums. */
    var artist_clmn = row.find('.artist_clmn');
    var title_clmn = row.find('.title_clmn');
    var play_time_clmn = row.find('.play_time_clmn');
    var group_clmn = row.find('.group_clmn')

    /* Get updating time because it's used a few times. */
    var time_input = row.find('.time_input');

    /* The most important line of code in this website.
        When the track inputs are shown their bottom border adds 1px to the height
        of the table row. This pixel MUST be accounted for!!!!!! 
        By saving the height before the inputs are shown and setting the height back to that 
        saved height after the inputs are shown, the row never changes sizes.*/
    var h = row.height();

    /* Show and fill-in the 'update mode' columns. */
    row.find('.artist_input').val(artist_clmn.html()).parent().show();
    row.find('.title_input').val(title_clmn.html()).parent().show();
    time_input.val(play_time_clmn.html()).parent().show();
    row.find('.group_input').val(group_clmn.html()).parent().parent().show();

    row.find('.submit_update_btn').parent().show();
    row.find('.cancel_update_btn').parent().show();

    /* Set the height back to what it was before the inputs were shown. */
    row.height(h);

    /* Hide the non 'update mode' columns. */
    artist_clmn.hide();
    title_clmn.hide();
    play_time_clmn.hide();
    group_clmn.hide();
    row.find('.update_btn').parent().hide();
    row.find('.delete_btn').parent().hide();

    /* Initialize the date-time picker */
    if (!time_input.hasClass('has_datepicker')) {
        time_input.addClass('has_datepicker');
        var dp = time_input.datepicker({
            language: 'en',
            timepicker: true,
            startDate: new Date(play_time_clmn.html()),
            dateFormat: 'mm/dd/yy'
        });
    }
});

$('table').on('click', '.cancel_update_btn', function () {
    /* Cancels the track update. */
    var row = $(this).parent().parent();

    remove_errors_for(row);

    /* Show the non 'update mode' columns. */
    row.find('.artist_clmn').show();
    row.find('.title_clmn').show();
    row.find('.play_time_clmn').show();
    row.find('.group_clmn').show();
    row.find('.update_btn').parent().show();
    row.find('.delete_btn').parent().show();

    /* Hide the 'update mode' columns. */
    row.find('.artist_input').parent().hide();
    row.find('.title_input').parent().hide();
    row.find('.time_input').parent().hide();
    row.find('.group_input').parent().parent().hide();
    row.find('.submit_update_btn').parent().hide();
    row.find('.cancel_update_btn').parent().hide();
});

$('table').on('click', '.submit_update_btn', function () {
    /* Submits an updated track to the server. */
    var row = $(this).parent().parent();

    remove_errors_for(row);

    if (has_no_blank_inputs(row)) {
        /* Send updates via socket. */
        socket.emit('commit_update', {
            'track_id': row.attr('id'),
            'new_artist': row.find('.artist_input').val(),
            'new_title': row.find('.title_input').val(),
            'new_time': row.find('.time_input').val(),
            'new_group': row.find('.group_input').val(),
            'is_main_logger': is_main_logger()
        })
    }

    remove_all_tracks();
    socket.emit('request_initial_tracks', {
            'is_main_logger': is_main_logger(),
            'query': uri_search_dict()
    });

    // ***Sequence continues through server into 'successful_update' socket
});

$('table').on('click', '.dropdown > input', function () {
    toggle_dropdown(this);
});

$('table').on('click', '.dropdown_content > span', function () {
    input_and_hide(this);
});


/* Deleting Tracks */
$('table').on('click', '.delete_btn', function () {
    /* Tells the server to delete the clicked track from the database */
    var track_id = $(this).parent().parent().attr('id');
    socket.emit('removeTrack', {'track_id': track_id, 'is_main_logger': is_main_logger()});
});


/* Media Queries that require javascript functionality */
$(document).ready(function () {
    /* Run javascript media queries when the page loads */
    run_media_queries();
});

window.addEventListener('resize', function (event) {
    /* Run javscript media queries when the page is resized */
    run_media_queries();
});

$('#load_more').click(function () {
    show_loading_spinner();
    load_more();
});

window.addEventListener('popstate', function (event) {
    /* Gets called when the user clicks the forward or backward buttons.
        Loads tracks based on what the search query in the uri is.*/
    var data = uri_search_dict();
    data['is_main_logger'] = is_main_logger();
    data['push_state'] = 'false'  // Don't update state after tracks are loaded
    socket.emit('search_track', data);
});
