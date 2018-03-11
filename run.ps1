$env:FLASK_APP = "music_logger"
$env:FLASK_DEBUG = 1
python -m flask run --host='0.0.0.0'