/*** Sets a global array holding all the track groups from the database.
 *      I want to make sure the groups that get displayed in the 
 *      input dropdowns are always up to date and this is a way
 *      to make sure they are while still keeping a single request
 *      to the server. ***/

var groups;

$.get('/groups', function(groups) {
    window.groups = groups;
});

function groups_dropdown_content() {
    content = '';

    JSON.parse(groups).forEach(group => {
        content = content + '<span>' + group + '</span>';
    });

    return content;
};
