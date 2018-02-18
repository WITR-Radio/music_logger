import os
import unittest
import tempfile
import sys

from flask_socketio import SocketIO

sys.path.append('C:/Users/colin/WITR/music_logger')  # so we can import our modules
import music_logger
from db_overwatch import stop_db_overwatch
from models import db, Track, Group

class MusicLoggerTestCase(unittest.TestCase):
    """ Currently class for all unit tests """

    def setUp(self): # camelCase required
        """ Sets up test music_logger app """
        self.db_fd, music_logger.app.config['DATABASE'] = tempfile.mkstemp()
        self.client = music_logger.app.test_client()
        with music_logger.app.app_context():
            db.create_all()


    def tearDown(self): # camelCase required
        """ Tears down test music_logger app """
        os.close(self.db_fd)
        os.unlink(music_logger.app.config['DATABASE'])
        stop_db_overwatch()


    """ UNIT TESTS """
    def test_home_status_code(self):
        """ Asserts home url returns a response code of 200 """
        rv = self.client.get('/')
        self.assertEqual(rv.status_code, 200)


    def test_connect(self):
        """ Asserts connecting to web socket layer returns 'connected' """
        client = music_logger.socketio.test_client(music_logger.app)
        received = client.get_received()
        self.assertEqual(received[0]['name'], 'connected')
        client.disconnect()


    # def test_search_returns_true(self):
    #     with self.app.test_request_context():
    #         self.assertTrue(music_logger.search_track(
    #             {'start': '', 'end': '', 'artist': '', 'title': ''}
    #         ))


if __name__ == '__main__':
    unittest.main()