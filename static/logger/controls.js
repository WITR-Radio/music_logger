/**
 * Created by Benjamin Reynolds on 7/8/2016.
 */
(function (dis) {
    dis.socket.send('newTrack');
    dis.socket.send('updateTrack');
    dis.socket.send('deleteTrack');
})(display);
