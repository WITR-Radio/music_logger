"""
    Created by Ben Reynolds
    Modified by Colin Reilly 2/3/18

    Main Flask server file, contains all client routes as well as
    Sockets hit by clients. Handles search queries as well as 
    updating, removing, and adding tracks to the database.
"""

import threading
from datetime import datetime
from json import dumps, loads
from time import sleep

from flask import Flask, render_template
from flask_socketio import SocketIO, emit, send

from config import Development
from models import Track, db

app = Flask(__name__)
app.config.from_object(Development)  # change loaded config name to change attributes
db.init_app(app)
socketio = SocketIO(app)


@app.route('/')
def page():
    """ Renders the home/root url page. """
    return render_template("index.html")


# for legacy programs
@app.route('/latest.json')
def latest():
    return tracks_to_json(Track.query.order_by(Track.created_at).first())


@app.route('/Details')
def details():
    """ Renders the home/root page and displays additional song details. """
    return render_template("index.html", detailed=True)


@socketio.on('connect')
def startup():
    """ Socket hit once a client connects to the server. """
    tracks = Track.query.order_by(Track.created_at).limit(20).all()
    print("got signal")
    emit('connected', tracks_to_json(tracks), json=True)


@socketio.on('addTrack')
def add_track(track):
    """ Socket used to add a track to the database. """
    a_track = loads(track)
    db_track = Track(a_track['artist'], a_track['title'], a_track['group'],
                     a_track['time'], a_track['request'], a_track['requester'])
    db.session.add(db_track)
    db.session.commit()
    emit('addTracks', track, json=True, broadcast=True)


@socketio.on('updateTrack')
def update_track(track):
    """ Socket used to update a track in the database. """
    dict_track = loads(track)
    track_to_update = Track.query.get(dict_track['id'])
    for column in dict_track:
        setattr(track_to_update, column, dict_track[column])
    db.session.commit()
    emit('updateTrack', track, json=True, broadcast=True)


@socketio.on('removeTrack')
def remove_track(track_id):
    """ Socket used to remove a track from the database. """
    track = Track.query.get(track_id)
    db.session.delete(track)
    db.session.commit()
    emit('removeTrack', track_id, broadcast=True)


@socketio.on('query')
def search_track(data):
    """ Socket used to search the database using parameters in @data. """
    results = Track.query
    # if start is not None:
    #     results = results.filter_by(Track.time >= start)
    # if end is not None:
    #     results = results.filter_by(Track.time <= end)
    if data['artist'] is not None:
        results = results.filter(Track.artist.like('%' + data['artist'] + '%'))
    if data['title'] is not None:
        results = results.filter(Track.title.like('%' + data['title'] + '%'))

    emit('search_results', tracks_to_json(results.limit(20).all()), json=True)


@socketio.on('message')
def on_message_test(message):
    """ Used for testing sockets - simply sends the message back """
    send(message)



# watch over the database and push updates when rvdl or another source updates and it does not go through the server.
# note: this might not be a good idea if the application ever has to scale since constantly checking for updates to rows
# is taxing on databases, especially mysql. If performance is bad you will have to have this server listen to rvdl's
# command output over udp instead of querying the database directly for changes. This will increase performance in all
# accept a few edge cases. However whatever you do, DO NOT OPEN UP A TRANSACTION FOR EVERY REQUEST. This leads to
# a security and memory leak issue this application was designed to fix compared to the php version.
def db_overwatch():
    # TODO: have threaded function that connects to database, make updated tracks
    # query: SELECT * FROM Tracks JOIN Groups ON Tracks.group_id=Groups.id WHERE Tracks.created_at >= time;
    # repeat this query every few seconds, .
    # If not will have to keep a local copy cached to make sure duplicates are not sent.
    time = datetime.now()
    old_tracks = Track.query(Track.created_at >= time).all()
    while True:
        new_tracks = Track.query(Track.created_at >= time).all()  # get all newly created tracks since last check
        new_tracks = [track for track in new_tracks if track not in old_tracks]  # filter out already emitted tracks
        emit("addTracks", tracks_to_json(new_tracks))
        old_tracks = new_tracks + [track for track in old_tracks if track.created_at >= time]
        sleep(3)
    return db_overwatch()


def tracks_to_json(query):
    """ function for converting tracks to json and prettifying the
        json while debugging, switch to compact for deployment 
    """
    obj = []
    if isinstance(query, list):
        for track in query:
            obj.append({'id': track.id, 'artist': track.artist, 'title': track.title,
                        'time': track.created_at.strftime("%x %I:%M %p"), 'requester': track.requester,
                        'group': track.group.name})
    else:
        obj.append({'id': query.id, 'artist': query.artist, 'title': query.title,
                    'time': query.created_at.strftime("%x %I:%M %p"), 'requester': query.requester,
                    'group': query.group.name})
    if app.testing:
        return dumps(obj, sort_keys=True, indent=4)
    else:
        return dumps(obj, separators=(',', ':'))


if __name__ == '__main__':
    app.run()
    socketio.run(app)
    threading.Thread(db_overwatch())
