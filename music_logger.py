"""
    Created by Ben Reynolds
    Modified by Colin Reilly 2/3/18

    Main Flask server file, contains all client routes as well as
    Sockets hit by clients. Handles search queries as well as 
    updating, removing, and adding tracks to the database.
"""

import sys
from threading import Thread
from datetime import datetime
from json import loads

from flask import Flask, render_template, request, url_for, redirect
from flask_socketio import SocketIO, emit, send
from sqlalchemy import desc
from sassutils.wsgi import SassMiddleware

sys.path.append('C:/Users/colin/WITR/music_logger/helper_modules')  # so we can import our modules
from config import Development
from models import db, Group, Track
from db_overwatch import start_db_overwatch
from tracks_to_json import tracks_to_json

app = Flask(__name__)
app.config.from_object(Development)  # change loaded config name to change attributes
db.init_app(app)
socketio = SocketIO(app)

app.wsgi_app = SassMiddleware(app.wsgi_app, {
    'music_logger': ('static/logger/sass', 'static/logger/css', 'static/logger/css')
})


@app.before_first_request
def thread_db_overwatch():
    """ Threads the db_overwatch function BEFORE THE FIRST REQUEST. 
        The app.before_first_request decorator will only run this function
        no sooner than directly before the first request. 
        So if the server is started and nobody connects, db_overwatch will
        not be run. """
    t = Thread(target = start_db_overwatch, args = (app, db, socketio))
    t.start()
    print('***** db_overwatch threaded *****')


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
    socketio.emit('add_tracks', request.get_json(force=True), json=True)
    return 'success'  # Flask doesn't like returning None.


### SOCKETS ###
@socketio.on('connect')
def startup():
    """ Socket hit once a client connects to the server. """
    tracks = Track.query.order_by(desc(Track.created_at)).limit(20).all()
    emit('connected', tracks_to_json(tracks), json=True)


@socketio.on('add_track_to_db')
def add_track_to_db(data):
    group = Group.query.get(1)

    track = Track(
        data.new_artist,
        data.new_title,
        group,
        None
    )

    db.session.add(track)
    db.session.commit()


@socketio.on('removeTrack')
def remove_track(track_id):
    """ Socket used to remove a track from the database. """
    track = Track.query.get(track_id)
    db.session.delete(track)
    db.session.commit()
    emit('removeTrack', track_id, broadcast=True)


@socketio.on('search_track')
def search_track(data):
    """ Socket used to search the database using parameters in @data. """
    results = Track.query
    
    if data['artist'] is not '':
        results = results.filter(Track.artist.like('%' + data['artist'] + '%'))
    if data['title'] is not '':
        results = results.filter(Track.title.like('%' + data['title'] + '%'))
    if data['date'] is not '':
        try:
            start = datetime.strptime(data['date'] + ' ' + data['start'], '%m/%d/%Y %I:%M %p') 
            end   = datetime.strptime(data['date'] + ' ' + data['end'  ], '%m/%d/%Y %I:%M %p')
            results = results.filter(Track.created_at.between(start, end))
        except ValueError:
            emit('invalid_search_datetime')
            return

    emit('search_results', 
        tracks_to_json(results.order_by(desc(Track.created_at)).limit(20).all()), 
        json=True
    )


@socketio.on('commit_update')
def commit_update(data):
    """ Socket used to update a track in the database. """
    try:
        track = Track.query.get(data['track_id'])

        track.artist     = data['new_artist']
        track.title      = data['new_title']
        track.created_at = datetime.strptime(data['new_time'], '%m/%d/%y %I:%M %p'), 

        db.session.commit()

        emit('successful_update', track.id)
        update_clients(track, data)
    except ValueError:
        # Invalid datetime format.
        emit('invalid_update_datetime', data['track_id'])


@socketio.on('message')
def on_message_test(message):
    """ Used for testing sockets - simply sends the message back """
    send(message)


### HELPERS ###
def update_clients(track, data):
    data['id'] = track.id
    socketio.emit('update_track', data, json=True)
