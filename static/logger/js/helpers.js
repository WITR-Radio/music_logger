/*** HELPERS ***/
var table_highlight = '#e9f6fb';

function add_track_to_top(track) {
    /* Takes JSON dictionary @track 
        and puts each track stored in it as a <tr> on the top of the tracks table */
    $("<tr id='" + track.id + "' >" +
        "<td class='artist_clmn'>"    + track.artist + "</td>" +
        "<td class='title_clmn'>"     + track.title  + "</td>" +
        "<td class='play_time_clmn'>" + track.time   + "</td>" +
        "<td class='privileged_inpt_clmn'><input class='artist_input' type='text' name='artist'></td>" +
        "<td class='privileged_inpt_clmn'><input class='title_input'  type='text' name='title'></td>" +
        "<td class='privileged_inpt_clmn'><input class='time_input'   type='text' name='time'></td>" +
        (detailed ?
            "<td>" +
            ( track.rvdl ? "<a>rvdl</a>" : "") +
            "</td>" +
            "<td>" + track.group + "</td>" +
            "<td>" + (track.requester ? track.requester : "" ) + "</td>" 
            : "") +
        "<td class='submit_clmn privileged_btn_clmn'><button class='submit_update_btn'>SUBMIT</button></td>" +
        "<td class='cancel_clmn privileged_btn_clmn'><button class='cancel_update_btn'>CANCEL</button></td>" +            
        "<td class='update_clmn privileged_btn_clmn'><button class='update_btn'>       UPDATE</button></td>" +            
        "<td class='delete_clmn privileged_btn_clmn'><button class='delete_btn'>       DELETE</button></td>" +
        "</tr>").hide().insertAfter($("#column_headers")).fadeIn("slow");
};

function add_track_to_bottom(track) {
    /* Takes JSON dictionary @track 
        and puts each track stored in it as a <tr> on the bottom of the tracks table */
    $("<tr id='" + track.id + "' >" +
        "<td class='artist_clmn'>"    + track.artist + "</td>" +
        "<td class='title_clmn'>"     + track.title  + "</td>" +
        "<td class='play_time_clmn'>" + track.time   + "</td>" +
        "<td class='privileged_inpt_clmn'><input class='artist_input' type='text' name='artist'></td>" +
        "<td class='privileged_inpt_clmn'><input class='title_input'  type='text' name='title'></td>" +
        "<td class='privileged_inpt_clmn'><input class='time_input'   type='text' name='time'></td>" +
        (detailed ?
            "<td>" +
            ( track.rvdl ? "<a>rvdl</a>" : "") +
            "</td>" +
            "<td>" + track.group + "</td>" +
            "<td>" + (track.requester ? track.requester : "" ) + "</td>" 
            : "") +
        "<td class='submit_clmn privileged_btn_clmn'><button class='submit_update_btn'>SUBMIT</button></td>" +
        "<td class='cancel_clmn privileged_btn_clmn'><button class='cancel_update_btn'>CANCEL</button></td>" +            
        "<td class='update_clmn privileged_btn_clmn'><button class='update_btn'>       UPDATE</button></td>" +            
        "<td class='delete_clmn privileged_btn_clmn'><button class='delete_btn'>       DELETE</button></td>" +
        "</tr>").hide().insertAfter($("table#tracks").find('tr').last()).fadeIn("slow");
};

function add_track_before(row, data) {
    $("<tr id='" + data['id'] + "' >" +
                "<td class='artist_clmn'>"    + data['new_artist'] + "</td>" +
                "<td class='title_clmn'>"     + data['new_title']  + "</td>" +
                "<td class='play_time_clmn'>" + data['new_time']   + "</td>" +
                "<td class='privileged_inpt_clmn'><input class='artist_input' type='text' name='artist'></td>" +
                "<td class='privileged_inpt_clmn'><input class='title_input'  type='text' name='title'></td>" +
                "<td class='privileged_inpt_clmn'><input class='time_input'   type='text' name='time'></td>" +
                (detailed ?
                    "<td>" +
                    ( track.rvdl ? "<a>rvdl</a>" : "") +
                    "</td>" +
                    "<td>" + track.group + "</td>" +
                    "<td>" + (track.requester ? track.requester : "" ) + "</td>" 
                    : "") +
                "<td class='submit_clmn privileged_btn_clmn'><button class='submit_update_btn'>SUBMIT</button></td>" +
                "<td class='cancel_clmn privileged_btn_clmn'><button class='cancel_update_btn'>CANCEL</button></td>" +            
                "<td class='update_clmn privileged_btn_clmn'><button class='update_btn'>       UPDATE</button></td>" +            
                "<td class='delete_clmn privileged_btn_clmn'><button class='delete_btn'>       DELETE</button></td>" +
                "</tr>").hide().insertBefore(row).fadeIn("slow");
}

function remove_all_tracks() {
    /* Removes all tracks from the page */
    $('tr:not(:first)').remove();
};

function has_no_blank_inputs(row) {
    /* Makes sure table row doesn't have any blank inputs.
        Usually used before submitting a new track or an update.
        Also calls function to show errors to user.*/
    var ret = true;

    row.find('input').each(function () {
        if ($.trim($(this).val()) == 0) { 
            ret = false;

            add_blank_input_error(row, $(this));
        }
    });

    return ret;
};

function get_or_create_error_box(row) {
    if (row.prev().find(".error_box").length == 0)
        /* If there is no 'error_box' for this row, add one. */
        $("<tr><td><div class='error_box'></div></td></tr>").insertBefore(row);

    return row.prev().find(".error_box");
}

function add_blank_input_error(row, input) {
    /* Highlights blank inputs and shows the user an error message. */
    var error_box = get_or_create_error_box(row);
    var name = input.attr("name");
    name = name.charAt(0).toUpperCase() + name.slice(1);

    input.css("background-color", "red");  // Highlight input red

    /* Add error message to this rows 'error_box'. */
    error_box.html(
        error_box.html() +
        "<span class='error'>" + name + " field cannot be blank.</span>"
    );
};

function remove_errors_for(row) {
    /* Removes highlights and 'error_box' for the specified row. */
    if (row.prev().find(".error_box").length !== 0)
        row.prev().remove();

    row.find("input").each(function () {
        $(this).css("background-color", row.css('background-color'));
    });
};

function add_search_datetime_error() {
    /* Adds an 'invalid datetime' error the search bar.*/
    $(".search_error_box").html(
        "<span>Invalid date or time format.</span>"
    ).addClass('has_error');
};

function add_update_datetime_error(id) {
    /* Adds an 'invalid datetime' error to the correct track on the page. */
    var row = $('tr#' + id);
    var error_box = get_or_create_error_box(row);

    row.find(".time_input").css("background-color", "red");

    error_box.html(
        error_box.html() +
        "<span class='error'>Invalid Date or Time format.</span>"
    );
}

function load_more() {
    /* Loads 20 more tracks and append them to the bottom of the page */

    if ($('table#tracks').data('more_results')) {  // If the server has more tracks to serve
        // Lock detection of scrolling to bottom of page
        $('table#tracks').data('detect_scroll', false);

        console.log(document.getElementById('tracks').rows.length - 1);

        // Send search query and amount of tracks currently shown on the page
        var artist = $('table#tracks').data('lsq_artist')
        var title  = $('table#tracks').data('lsq_song')
        var date   = $('table#tracks').data('lsq_date')
        var start  = $('table#tracks').data('lsq_start_time')
        var end    = $('table#tracks').data('lsq_end_time')
        socket.emit('load_more', {
            'artist': artist, 
            'title' : title, 
            'date'  : date, 
            'start' : start, 
            'end'   : end,
            'n_tracks_shown': document.getElementById('tracks').rows.length - 1
        });
    }
};

function run_media_queries() {
    /* Javascript function to simulate css media queries; Used to
        do things css media queries can't */
    var search_content = $('.search_content');
    var search_revealer = $('.search_revealer');    

    if (window.matchMedia('(min-width: 600px').matches) {
        /* The viewport is at least 600px wide */
        $('#date_search_input'  ).attr('placeholder', 'Today');
        $('#start_search_input' ).attr('placeholder', 'Time');
        $('#end_search_input'   ).attr('placeholder', 'Time');
        $('#artist_search_input').attr('placeholder', 'Keyword');
        $('#title_search_input' ).attr('placeholder', 'Keyword');

        // Show search inputs and display their container as flex so they are horizontal
        search_revealer.css('display', 'block');
        search_content.css( 'display', 'flex');
    } else {
        /* The viewport is less than 600px wide */
        $('#date_search_input'  ).attr('placeholder', 'Date');
        $('#start_search_input' ).attr('placeholder', 'Start Time');
        $('#end_search_input'   ).attr('placeholder', 'End Time');
        $('#artist_search_input').attr('placeholder', 'Artist');
        $('#title_search_input' ).attr('placeholder', 'Title');

        /* If content is displayed as flex, viewport is transitioning from > 600px wide
            so change content to block and hide inputs */
        if(search_content.css('display') == 'flex') {
            search_content.css('display', 'block');
            search_revealer.css('display', 'none')
        }
    }
};

function update_row_highlights() {
    /* Re-highlights every other row in the tracks table. The highlights can get
        messed up when adding or deleting rows. */
    var blue = true;
    var skip_thead = true;

    $('table#tracks tr').each( function() {
        if (skip_thead)
            skip_thead = false
        else {
            if (blue && $(this).is(':visible')) {
                $(this).css('background-color', table_highlight);
                blue = false;
            }
            else if (!blue && $(this).is(':visible')) {
                $(this).css('background-color', 'white');
                blue = true;
            }
        }
    });
};

function insert_based_on_date(track) {
    /* Insert a track into the table based on it's date. 
        Returns 0 if track was inserted into the current page, returns 
        -1 if the track was not inserted into the current page. */
    var skip_thead = true;
    var last_track = '';
    var curr_track = '';
    var new_date = new Date(track['new_time']);
    var to_return = -1;  

    $('table#tracks tr').each( function() {
        if (skip_thead)  // Skip the thead
            skip_thead = false
        else if (last_track == '') {  // If this is the first row in the table
            curr_track = $(this);
            last_track = curr_track;
            last_date = new Date(last_track.find('.play_time_clmn').html());
            
            if (new_date > last_date) {  // If track should be inserted at top
                add_track_before(last_track, track);
                to_return = 0;
                return false;
            }
        }
        else {  // If the row is not the thead or the first row
            curr_track = $(this);
            curr_date = new Date(curr_track.find('.play_time_clmn').html());
            last_date = new Date(last_track.find('.play_time_clmn').html());
            
            // If track should be inserted in between last track and curr track
            if (last_date > new_date && new_date > curr_date) {
                add_track_before(curr_track, track);
                to_return = 0;
                return false;
            }

            last_track = curr_track;
        }
    });

    return to_return;
};