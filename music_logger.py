"""
    Created by Ben Reynolds
    Modified by Colin Reilly 2/3/18

    Main Flask server file, contains all client routes as well as
    Sockets hit by clients. Handles search queries as well as
    updating, removing, and adding tracks to the database.
"""
import os
# DIR_PATH = os.path.dirname(os.path.realpath(__file__))  # full cwd path

import socket
import sys
import signal
import logging
from logging.handlers import RotatingFileHandler
from threading import Thread
from datetime import datetime
import xml.etree.ElementTree as ET
from json import loads, dumps
from werkzeug.contrib.fixers import ProxyFix

from flask import Flask, render_template, request, url_for, redirect, make_response
from flask_socketio import SocketIO, emit, send
from sqlalchemy import desc, asc
from sassutils.wsgi import SassMiddleware
from models import db, MainGroup, MainTrack, UndergroundGroup, UndergroundTrack

from helper_modules.db_overwatch import start_db_overwatch, stop_db_overwatch
from helper_modules.tracks_to_json import tracks_to_json
from helper_modules.in_subnet import in_subnet

# instance_relative_config=True tells app.config.from_pyfile to look in the instance
# folder for the config.py file
app = Flask(__name__, instance_relative_config=True)
app.config.from_pyfile('staging_config.py')

db.init_app(app)
socketio = SocketIO(app)

# Tells sass to recompile css every time the server refreshes
app.wsgi_app = ProxyFix(SassMiddleware(app.wsgi_app, {
    'music_logger': ('static/logger/sass', 'static/logger/css', 'static/logger/css')
}))


### ROUTES ###
@app.route('/')
def page():
    """ Renders the home/root url page. """
    return render_template("index.html", in_subnet=in_subnet(request.remote_addr), stream_type="FM")


@app.route('/underground')
def underground():
    """ Renders the underground home/root page. """
    return render_template("index.html", in_subnet=in_subnet(request.remote_addr), stream_type="UDG")


# for legacy programs
@app.route('/latest.json')
def latest():
    data = loads(tracks_to_json(MainTrack.query.order_by(MainTrack.created_at.desc()).first()))
    resp = make_response(dumps(data[0]))
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp


@app.route('/latest_udg.json')
def latest_udg():
    data = loads(tracks_to_json(UndergroundTrack.query.order_by(UndergroundTrack.created_at.desc()).first()))
    resp = make_response(dumps(data[0]))
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp


@app.route('/details')
def details():
    """ Renders the home/root page and displays additional song details. """
    return render_template("index.html", detailed=True, in_subnet=True)#in_subnet(request.remote_addr))


@app.route('/is_in_subnet', methods=['GET'])
def is_in_subnet():
    """ Route client uses to check if it is in the WITR Subnet """
    return str(in_subnet(request.remote_addr))


@app.route('/groups', methods=['GET'])
def groups():
    """ Route client uses to get a list of the track groups in the database """
    # Use underground DB or main DB
    if request.args['is_main_logger'] == 'true':
        Group = MainGroup
    elif request.args['is_main_logger'] == 'false':
        Group = UndergroundGroup
    else:
        print('ERROR: in request_initial_tracks socket ' + request.args['is_main_logger'], file=sys.stderr)
        return

    query = Group.query.all()
    groups = []
    for group in query:
        groups.insert(0, group.name)

    return dumps(groups, separators=(',', ':'))


@app.route('/udpupdate', methods=['POST'])
def udpupdate():
    """ Rivendell posts to this route with an XML document containing
        a track. This function then parses that XML and 
        saves it to the database 
    """
    if in_subnet(request.remote_addr):
        root = ET.fromstring(request.data)
        data = {}
    
        for child in root:
            data[child.tag] = child.text
    
        track = UndergroundTrack(
            artist = data['artist'],
            title = data['title'],
            group = UndergroundGroup.query.get(int(data['group'])),
            created_at = datetime.now()
        )
        db.session.add(track)
        db.session.commit()

        return 'Added track to logger database'
    else:
        return 'Access Denied'


@app.route('/rivendell_udg_update', methods=['POST'])
def rivendell_udg_update():
    """ Rivendell posts to this route with an XML document containing
        a track. This function then parses that XML and 
        saves it to the underground database .
    """
    if in_subnet(request.remote_addr):
        # Get XML root
        root = ET.fromstring(request.data)
        data = {}
    
        # Turn XML into dictionary
        for child in root:
            data[child.tag] = child.text
    
        # Create the new track and save it to the DB
        track = UndergroundTrack(
            artist = data['artist'],
            title = data['title'],
            group = UndergroundGroup.query.get(int(data['group'])),
            created_at = datetime.now()
        )
        db.session.add(track)
        db.session.commit()

        # Update clients
        socketio.emit('add_tracks', {
            'tracks': tracks_to_json(track),
            'is_main_logger': 'false'
        }, json=True)

        return 'Added track to underground logger database'
    else:
        return 'Access Denied'


@app.route('/rivendell_update', methods=['POST'])
def rivendell_update():
    """ Rivendell posts to this route with an XML document containing a
        track. This function then parses that XML and saves it to the
        main logger database.
    """
    if in_subnet(request.remote_addr):
        # Get XML root
        root = ET.fromstring(request.data)
        data = {}
    
        # Turn XML into dictionary
        for child in root:
            data[child.tag] = child.text

        # Create the new track and save it to the DB
        track = MainTrack(
            artist = data['artist'],
            title = data['title'],
            group = MainGroup.query.get(int(data['group'])),
            created_at = datetime.now()
        )
        db.session.add(track)
        db.session.commit()

        # Update clients
        socketio.emit('add_tracks', {
            'tracks': tracks_to_json(track),
            'is_main_logger': 'true'
        }, json=True)

        return 'Added track to main logger database.'
    else:
        return 'Access Denied'


### SOCKETS ###
@socketio.on('connect')
def startup():
    """ Socket hit once a client connects to the server. """
    emit('connected')


@socketio.on('request_initial_tracks')
def request_intitial_tracks(data):
    """ Based on whether data['main_logger'] is true emits
        either 20 most recent main logger tracks or 20 most recent
        underground logger tracks.
    """
    # Check if main logger or underground logger
    if data['is_main_logger'] == 'true':
        Track = MainTrack
    elif data['is_main_logger'] == 'false':
        Track = UndergroundTrack
    else:
        # print('ERROR: in request_initial_tracks socket ' + str(is_main_logger), file=sys.stderr)
        tracks = []

    # Get the query results
    results = Track.query
    
    if 'artist' in data['query']:
        results = results.filter(Track.artist.like('%' + data['query']['artist'] + '%'))
    if 'title' in data['query']:
        results = results.filter(Track.title.like('%' + data['query']['title'] + '%'))
    if 'data' in data['query'] or 'start' in data['query'] or 'end' in data['query']:
        try:
            data['query']['start'] = data['query']['start'].replace('%20', ' ')
            data['query']['end'] = data['query']['end'].replace('%20', ' ')
            start = datetime.strptime(data['query']['date'] + ' ' + data['query']['start'], '%m/%d/%Y %I:%M %p') 
            end   = datetime.strptime(data['query']['date'] + ' ' + data['query']['end'  ], '%m/%d/%Y %I:%M %p')
            results = results.filter(Track.created_at.between(start, end))
        except ValueError:
            emit('invalid_search_datetime')
            return

    # Send query results to client
    tracks = results.order_by(desc(Track.created_at)).limit(20).all()

    emit('handle_initial_tracks', tracks_to_json(tracks), json=True)


@socketio.on('add_track_to_db')
def add_track_to_db(data):
    """ Socket used to add a track in the database. """
    if (in_subnet(request.remote_addr)):
        # Use underground DB or main DB
        if data['is_main_logger'] == 'true':
            Track = MainTrack
            Group = MainGroup
        elif data['is_main_logger'] == 'false':
            Track = UndergroundTrack
            Group = UndergroundGroup
        else:
            print('ERROR: in request_initial_tracks socket ' + data['is_main_logger'], file=sys.stderr)
            return
        
        try:
            group = Group.query.filter_by(name=data['new_group']).first()

            track = Track(
                artist = data['new_artist'],
                title = data['new_title'],
                group = group,
                created_at = datetime.strptime(data['new_time'], '%m/%d/%y %I:%M %p')        
            )

            db.session.add(track)
            db.session.commit()

            update_clients(-1, data)
        except ValueError:
            # Invalid datetime format.
            emit('invalid_add_datetime')


@socketio.on('removeTrack')
def remove_track(data):
    """ Socket used to remove a track from the database. """
    if (in_subnet(request.remote_addr)):
        track_id = data['track_id']
        is_main_logger = data['is_main_logger']

        if is_main_logger == 'true':
            track = MainTrack.query.get(track_id)
        elif is_main_logger =='false':
            track = UndergroundTrack.query.get(track_id)
        else:
            print('ERROR: in request_initial_tracks socket ' + str(is_main_logger), file=sys.stderr)
            return

        db.session.delete(track)
        db.session.commit()
        emit('removeTrack', {'track_id': track_id, 'is_main_logger': is_main_logger}, broadcast=True)


@socketio.on('search_track')
def search_track(data):
    """ Socket used to search the database using parameters in @data. """
    # Use underground DB or main DB
    if data['is_main_logger'] == 'true':
        Track = MainTrack
    elif data['is_main_logger'] == 'false':
        Track = UndergroundTrack
    else:
        print('ERROR: in request_initial_tracks socket ' + data['is_main_logger'], file=sys.stderr)
        return

    # Get the query results
    results = Track.query
    
    if 'artist' in data:
        results = results.filter(Track.artist.like('%' + data['artist'] + '%'))
    if 'title' in data:
        results = results.filter(Track.title.like('%' + data['title'] + '%'))
    if 'date' in data or 'start' in data or 'end' in data:
        try:
            start = datetime.strptime(data['date'] + ' ' + data['start'], '%m/%d/%Y %I:%M %p') 
            end   = datetime.strptime(data['date'] + ' ' + data['end'  ], '%m/%d/%Y %I:%M %p')
            results = results.filter(Track.created_at.between(start, end))
        except ValueError:
            emit('invalid_search_datetime')
            return


    data['tracks'] = tracks_to_json(results.order_by(desc(Track.created_at)).limit(20).all())

    # Send query results to client
    emit('search_results', data, json=True)


@socketio.on('commit_update')
def commit_update(data):
    """ Socket used to update a track in the database. """
    if in_subnet(request.remote_addr):
        # Choose underground DB or main DB
        if data['is_main_logger'] == 'true':
            Track = MainTrack
            Group = MainGroup
        elif data['is_main_logger'] == 'false':
            Track = UndergroundTrack
            Group = UndergroundGroup
        else:
            print('ERROR: in request_initial_tracks socket ' + data['is_main_logger'], file=sys.stderr)
            return

        try:
            track = Track.query.get(data['track_id'])
            group = Group.query.filter_by(name=data['new_group']).first()

            if group is None:  # Invalid group name, show error and exit
                emit('invalid_update_group_name', data['track_id'])
                return None

            track.artist     = data['new_artist']
            track.title      = data['new_title']
            track.created_at = datetime.strptime(data['new_time'], '%m/%d/%y %I:%M %p')
            track.group      = group

            db.session.commit()

            emit('successful_update', track.id)
            update_clients(track.id, data)
        except ValueError:
            # Invalid datetime format.
            emit('invalid_update_datetime', data['track_id'])


@socketio.on('load_more')
def load_more(data):
    """ *** Infinite Scrolling ***
        Hit when a user scrolls to the bottom of thier page and needs 20 new tracks.
        User sends how many tracks are on their client as well as the last used 
        search query. Server runs search query and slices result for next 20 tracks. 
    """
    # Choose underground DB or main DB
    if data['is_main_logger'] == 'true':
        Track = MainTrack
        Group = MainGroup
    elif data['is_main_logger'] == 'false':
        Track = UndergroundTrack
        Group = UndergroundGroup
    else:
        print('ERROR: in request_initial_tracks socket ' + data['is_main_logger'], file=sys.stderr)
        return

    results = Track.query

    if 'artist' in data:
        results = results.filter(Track.artist.like('%' + data['artist'] + '%'))
    if 'title' in data:
        results = results.filter(Track.title.like('%' + data['title'] + '%'))
    if 'date' in data or 'start' in data or 'end' in data:
        data['start'] = data['start'].replace('%20', ' ')
        data['end'] = data['end'].replace('%20', ' ')
        start = datetime.strptime(data['date'] + ' ' + data['start'], '%m/%d/%Y %I:%M %p')
        end   = datetime.strptime(data['date'] + ' ' + data['end'  ], '%m/%d/%Y %I:%M %p')
        results = results.filter(Track.created_at.between(start, end))

    num_t = data['n_tracks_shown']

    results = tracks_to_json(
        results.order_by(desc(Track.created_at))
        .slice(num_t, num_t + 20)
        .all()
        [::-1]  # Reverse result query so tracks show up in correct order on page.
    )

    if results != '[]':
        emit('load_more_results', results, json=True)
    else:
        emit('no_more_results')


### HELPERS ###
def update_clients(id, data):
    """ Emits track update to all connected clients """
    data['id'] = id
    socketio.emit('update_track', data, json=True)


def signal_handler(signal, frame):
    """ Listens for Ctrl+C and closes the db_overwatch thread """
    stop_db_overwatch()
    sys.exit(0)
signal.signal(signal.SIGINT, signal_handler)


if __name__ == '__main__':
    """ Starts the socketio production server and threads the UDP server """
    print('Music Logger: starting socketio')
    socketio.run(app, host='0.0.0.0', port='5000', debug=False)

