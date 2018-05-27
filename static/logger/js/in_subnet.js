/*** A module to be included before the page loads, which sets the 'in_subnet' 
 *      variable so everything(other js, jinja2 template engine) can easily check
 *      if this client is in the subnet or not ***/

var in_subnet = false;

socket.emit('is_in_subnet');

socket.on('is_in_subnet', function(subnet_answer) {
    var in_subnet = subnet_answer;
});