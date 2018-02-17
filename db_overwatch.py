""" Watch over the database and push updates when rvdl or another source updates and it does not go through the server.
    note: this might not be a good idea if the application ever has to scale since constantly checking for updates to rows
    is taxing on databases, especially mysql. If performance is bad you will have to have this server listen to rvdl's
    command output over udp instead of querying the database directly for changes. This will increase performance in all
    except a few edge cases. However whatever you do, DO NOT OPEN UP A TRANSACTION FOR EVERY REQUEST. This leads to
    a security and memory leak issue this application was designed to fix compared to the php version.
"""

from datetime import datetime
from time import sleep
import requests

from flask import url_for

from models import Track
from tracks_to_json import tracks_to_json


keep_looping = True


def stop_db_overwatch():
    keep_looping = False


def start_db_overwatch(app, db, socketio):
    keep_looping = True

    with app.app_context():  # This background thread needs the Flask context from the main thread.
        old_time = datetime.now()

        while keep_looping:
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
