/*** A module to be included before the page loads, which sets the 'in_subnet' 
 *      variable so everything(other js, jinja2 template engine) can easily check
 *      if this client is in the subnet or not ***/

var in_subnet;

$.get('/is_in_subnet', function(data) {
    if (data === 'False')
        window.in_subnet = false;
    else
        window.in_subnet = true;
});
