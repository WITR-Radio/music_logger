/*** A function which returns true if the url is 
 *   logger.witr.rit.edu/ and false if it is
 *   logger.witr.rit.edu/underground ***/

function is_main_logger() {
    if (window.location.pathname == '/')
        return 'true';
    else if (window.location.pathname == '/underground')
        return 'false';
    else 
        return 'invalid pathname for is_main_logger() function';
}