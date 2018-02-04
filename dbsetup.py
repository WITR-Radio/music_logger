"""
    Initializes the database with 'tracks' and 'groups' tables
    as well as seed data for both tables.

    You may have to manually run the groups_data.sql and tracks_data.sql
    scripts manually in a sql environment after running this python script.
"""

import pymysql.cursors
from music_logger import app
from os.path import abspath
from sys import argv

groupsTableFile = abspath('./test/seeds/music_logger_groups.sql')
tracksTableFile = abspath('./test/seeds/music_logger_tracks.sql')
groupsDataFile = abspath('./test/data/groups_data.sql')
tracksDataFile = abspath('./test/data/tracks_data.sql')

connection = pymysql.connect(host=app.config['DB_HOST'],
                             user=app.config['DB_USER'],
                             password=app.config['DB_PASSWORD'],
                             db=app.config['DB_NAME'],
                             charset='utf8mb4',
                             cursorclass=pymysql.cursors.DictCursor)


def create(args):
    if any(x in args for x in ['-h', '--help']):
        print("usage: dbsetup")
    try:
        if any(x in args for x in ['-E', '--Erase']):
            with connection as cur:
                cur.execute('DROP DATABASE IF EXISTS test;')
                cur.execute('CREATE DATABASE test;')
            connection.commit()
        read_sql_file(connection, groupsTableFile)
        read_sql_file(connection, tracksTableFile)
        read_sql_file(connection, groupsDataFile)
        if any(x in args for x in ['-s', '--seed']):
            seed_tracks()
    finally:
        connection.close()


def seed_tracks():
    read_sql_file(connection, tracksDataFile)


def read_sql_file(connect, file):
    with connect.cursor() as cursor:
        with open(file) as f:
            for x in f.read().strip().split(';'):
                x.strip()
                if x != '':
                    cursor.execute(x)
    connection.commit()

create(argv)
