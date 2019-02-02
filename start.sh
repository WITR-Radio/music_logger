#!/bin/sh
/usr/bin/cd /home/logger/music_logger &&
/bin/sh /home/logger/logger-env/bin/activate &&
/usr/bin/nohup /home/logger/logger-env/bin/python /home/logger/music_logger/music_logger.py &
