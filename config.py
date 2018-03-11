"""
    Configs of the music logger, to change which 
    config is loaded(Production, Staging, Development) go to music_logger.py
    and change the class in the app.config.from_object().
"""


class Config(object):

    DEBUG = False
    TESTING = False
    SECRET_KEY = "secret?"
    DB_USER = 'root'
    DB_PASSWORD = ''
    DB_HOST = ''
    DB_NAME = 'music_logger'
    SQLALCHEMY_DATABASE_URI = 'mysql://' + DB_USER + ':' + DB_PASSWORD + '@' + DB_HOST + '/' + DB_NAME
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class Production(Config):

    DB_USER = ''
    DB_PASSWORD = ''
    DB_HOST = ''
    DB_NAME = ''


class Staging(Config):

    DB_USER = ''
    DB_PASSWORD = ''
    DB_HOST = ''
    DB_NAME = ''
    TESTING = True


class Development(Config):
    
    TESTING = True
    DEBUG = True
    DB_USER = 'root'
    DB_HOST = '127.0.0.1'
    DB_NAME = 'music_logger'
    DB_PASSWORD = 'Ax^2+Bx+C=y'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://' + DB_USER + ':' + DB_PASSWORD + '@' + DB_HOST + '/' + DB_NAME
    # SERVER_NAME = '127.0.0.1:5000' the hostname is currently supplied by the ./run.ps1 script
