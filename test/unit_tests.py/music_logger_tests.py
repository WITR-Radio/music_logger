import os
import unittest
import tempfile
import sys

from flask_socketio import SocketIO

sys.path.append('C:/Users/colin/WITR/music_logger')  # so we can import our modules
import music_logger
from models import db, Track, Group

class MusicLoggerTestCase(unittest.TestCase):

    def setUp(self): # has to be camel case to be recognized
        """ Sets up test music_logger app """
        self.app = music_logger.app
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.app.testing = True
        db.create_all()
        self.client = self.app.test_client(use_cookies=True)
        
        self.socketio = SocketIO(self.app)

    def test_home_status_code(self):
        """ Hits the home url and asserts it returns a response code of 200 """
        result = self.client.get('/')
        self.assertEqual(result.status_code, 200)

    # def test_connect(self):
    #     client = self.socketio.test_client(self.app)
    #     received = client.get_received()
    #     print(received)
    #     # self.assertEqual(received[0]['args'], 'connected')
    #     client.disconnect()

    # def test_search_returns_true(self):
    #     with self.app.test_request_context():
    #         self.assertTrue(music_logger.search_track(
    #             {'start': '', 'end': '', 'artist': '', 'title': ''}
    #         ))

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()


if __name__ == '__main__':
    unittest.main()