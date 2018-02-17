""" This function is in a separate module since both db_ovewatch.py 
    and music_logger.py need to use it"""

from json import dumps


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

    return dumps(obj, separators=(',', ':'))