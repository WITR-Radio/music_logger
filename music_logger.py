"""
    Created by Ben Reynolds
    Modified by Colin Reilly 2/3/18

    Main Flask server file, contains all client routes as well as
    Sockets hit by clients. Handles search queries as well as 
    updating, removing, and adding tracks to the database.
"""

from threading import Thread
from datetime import datetime
from json import dumps, loads
from time import sleep
import requests

from flask import Flask, render_template, request, url_for, redirect
from flask_socketio import SocketIO, emit, send
from sqlalchemy import desc

from config import Development
from models import db, Group, Track

app = Flask(__name__)
app.config.from_object(Development)  # change loaded config name to change attributes
db.init_app(app)
socketio = SocketIO(app)


@app.before_first_request
def thread_db_overwatch():
    t = Thread(target = db_overwatch, args = (app, db, socketio))
    t.start()
    print('db_overwatch threaded')


### ROUTES ###
@app.route('/')
def page():
    """ Renders the home/root url page. """
    return render_template("index.html")


# for legacy programs
@app.route('/latest.json')
def latest():
    return tracks_to_json(Track.query.order_by(Track.created_at).first())


@app.route('/details')
def details():
    """ Renders the home/root page and displays additional song details. """
    return render_template("index.html", detailed=True)


@app.route('/dj')
def dj():
    """ Renders the dj page for submitting/updating/deleting tracks """
    return render_template("dj_view.html")


@app.route('/add_track_to_db', methods=['POST'])
def add_track_to_db():
    """ Handles a POST request to submit a new track to the db """
    group = Group.query.get(1)

    track = Track(
        request.form['artist'],
        request.form['title'],
        group,
        None
    )

    db.session.add(track)
    db.session.commit()

    return redirect(url_for('dj'))


@app.route('/add_track_to_client', methods=['POST'])
def add_track_to_client():
    """ Handles a POST request to emit a message to all clients
    telling them to add a new track to their page.

    Colin Reilly 2/11/2018:
    Typically this route is hit by the db_overwatch thread
    once it detects a change in the database and needs to update
    the clients with new tracks.

    Creating a route for emitting this kind of update to clients
    keeps the socketio instance in the main Flask thread only. If we wanted
    to emit to clients from background threads we would need a messaging queue
    between the main thread and all other threads, something I think is best avoided.
    """
    socketio.emit('addTracks', request.get_json(force=True), json=True)
    return 'success'  # Flask doesn't like returning None.


### SOCKETS ###
@socketio.on('connect')
def startup():
    """ Socket hit once a client connects to the server. """
    tracks = Track.query.order_by(desc(Track.created_at)).limit(20).all()
    emit('connected', tracks_to_json(tracks), json=True)


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


### HELPER ###
def db_overwatch(app, db, socketio):
    """ Watch over the database and push updates when rvdl or another source updates and it does not go through the server.
        note: this might not be a good idea if the application ever has to scale since constantly checking for updates to rows
        is taxing on databases, especially mysql. If performance is bad you will have to have this server listen to rvdl's
        command output over udp instead of querying the database directly for changes. This will increase performance in all
        except a few edge cases. However whatever you do, DO NOT OPEN UP A TRANSACTION FOR EVERY REQUEST. This leads to
        a security and memory leak issue this application was designed to fix compared to the php version.
    """
    with app.app_context():  # This background thread needs the Flask context from the main thread.
        old_time = datetime.now()

        while True:
            new_time = datetime.now()

            # Keep session up-to-date by reinitializing.
            # TODO This is possibly very taxing on the database.
            session = db.create_scoped_session()  
            # Check the db for new tracks submitted in the last 3 seconds.
            new_tracks = \
                session.query(Track).filter(Track.created_at.between(old_time, new_time)).all()
            session.close()

            # If there are new tracks send a post request to the main Flask thread
            # so it can emit a web socket message to clients.
            if new_tracks: 
                requests.post(url_for('add_track_to_client'), 
                            json = tracks_to_json(new_tracks))

            old_time = new_time  # Old time and new time are always 3 seconds apart
            sleep(3)

        return db_overwatch()


def tracks_to_json(query):
    """ function for converting tracks to json and prettifying the
        json while debugging, switch to compact for deployment 
    """
    obj = []
    if isinstance(query, list):
        for track in query:
            obj.insert(0, {'id': track.id, 'artist': track.artist, 'title': track.title,
                        'time': track.created_at.strftime("%x %I:%M %p"), 'requester': track.requester,
                        'group': track.group.name})
    else:
        obj.insert(0, {'id': query.id, 'artist': query.artist, 'title': query.title,
                    'time': query.created_at.strftime("%x %I:%M %p"), 'requester': query.requester,
                    'group': query.group.name})
    if app.testing:
        return dumps(obj, sort_keys=True, indent=4)
    else:
        return dumps(obj, separators=(',', ':'))