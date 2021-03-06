from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.sql import func
from datetime import datetime

db = SQLAlchemy()


class MainGroup(db.Model):
    """ Model for groups such as: Feature, New Bin, Library, Recurrent, Specialty Show """

    __table_args__ = {"schema": "music_logger"}
    __tablename__ = 'groups'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False, unique=True)
    name = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False)

    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return '<Group: %r>' % self.name


class MainTrack(db.Model):
    """ Model for music tracks """
    
    __table_args__ = {"schema": "music_logger"}
    __tablename__ = 'tracks'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False, unique=True)
    artist = db.Column(db.String(255),                               nullable=True)
    title = db.Column(db.String(255),                                nullable=True)
    time = db.Column(db.DateTime,                                    nullable=True)
    rivendell = db.Column(db.Boolean,                                nullable=True)
    group_id = db.Column(db.Integer, db.ForeignKey('music_logger.groups.id'),     nullable=True)
    # check performance of select and dynamic vs join for forward ref, back ref will need dynamic
    group = db.relationship('MainGroup', lazy='joined', backref=db.backref('tracks', lazy='dynamic'))
    created_at = db.Column(db.DateTime, nullable=False, default=func.now())
    updated_at = db.Column(db.DateTime, nullable=False, default=func.now(), onupdate=func.now())
    request = db.Column(db.Boolean, nullable=True)
    requester = db.Column(db.String(255), nullable=True)

    def __init__(self, artist, title, group, created_at, request=False, requester=None):
        self.artist = artist
        self.title = title
        # since the server will only create new entries if a DJ adds new tracks then rivendell will always be false
        self.rivendell = False
        self.group = group
        self.time = None
        self.created_at = created_at
        self.request = request
        self.requester = requester

    def __repr__(self):
        return '<Track:artist %r, title %r, time %r>' % (self.artist, self.title, self.created_at)


class UndergroundGroup(db.Model):
    """ Model for groups such as: Feature, New Bin, Library, Recurrent, Specialty Show """

    __table_args__ = {"schema": "udg_music_logger"}
    __tablename__ = 'groups'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False, unique=True)
    name = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False)

    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return '<Group: %r>' % self.name


class UndergroundTrack(db.Model):
    """ Model for music tracks """
    
    __table_args__ = {"schema": "udg_music_logger"}
    __tablename__ = 'tracks'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False, unique=True)
    artist = db.Column(db.String(255),                               nullable=True)
    title = db.Column(db.String(255),                                nullable=True)
    time = db.Column(db.DateTime,                                    nullable=True)
    rivendell = db.Column(db.Boolean,                                nullable=True)
    group_id = db.Column(db.Integer, db.ForeignKey('udg_music_logger.groups.id'),     nullable=True)
    # check performance of select and dynamic vs join for forward ref, back ref will need dynamic
    group = db.relationship('UndergroundGroup', lazy='joined', backref=db.backref('tracks', lazy='dynamic'))
    created_at = db.Column(db.DateTime, nullable=False, default=func.now())
    updated_at = db.Column(db.DateTime, nullable=False, default=func.now(), onupdate=func.now())
    request = db.Column(db.Boolean, nullable=True)
    requester = db.Column(db.String(255), nullable=True)

    def __init__(self, artist, title, group, created_at, request=False, requester=None):
        self.artist = artist
        self.title = title
        # since the server will only create new entries if a DJ adds new tracks then rivendell will always be false
        self.rivendell = False
        self.group = group
        self.time = None
        self.created_at = created_at
        self.request = request
        self.requester = requester

    def __repr__(self):
        return '<Track:artist %r, title %r, time %r>' % (self.artist, self.title, self.created_at)