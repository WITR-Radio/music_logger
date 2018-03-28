/*** HELPERS ***/
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