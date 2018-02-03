from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Group(db.Model):
    """ Model for groups such as: Feature, Recurrent, Library, New Bin, etc... """
    __tablename__ = 'groups'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False, unique=True)
    name = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False)

    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return '<Group: %r>' % self.name


class Track(db.Model):
    """ Model for music tracks """
    __tablename__ = 'tracks'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False, unique=True)
    artist = db.Column(db.String(255), nullable=True)
    title = db.Column(db.String(255), nullable=True)
    time = db.Column(db.DateTime, nullable=True)
    rivendell = db.Column(db.Boolean, nullable=True)
    group_id = db.Column(db.Integer, db.ForeignKey('groups.id'), nullable=True)
    # check performance of select and dynamic vs join for forward ref, back ref will need dynamic
    group = db.relationship('Group', lazy='joined', backref=db.backref('tracks', lazy='dynamic'))
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False)
    request = db.Column(db.Boolean, nullable=True)
    requester = db.Column(db.String(255), nullable=True)

    def __init__(self, artist, title, group, time, request=False, requester=None):
        self.artist = artist
        self.title = title
        # since the server will only create new entries if a DJ adds new tracks then rivendell will always be false
        self.rivendell = False
        self.group = group
        self.time = time
        self.request = request
        self.requester = requester

    def __repr__(self):
        return '<Track:artist %r, title %r, time %r>' % (self.artist, self.title, self.created_at)
