settings = read_json('../tilt.option.json')
settings_user = read_json('../tilt.option.user.json', {})

if settings_user != None:
    settings.update(settings_user)


def get_settings():
    return settings


def get_log_setting():
    logSettingMap = {
        "console": "indirect",
        "stream": "direct",
        "dual": "dual",
    }
    streamingMethod = logSettingMap.get(
        str(settings.get('logStreamingMethod')))

    if (streamingMethod == None):
        fail('Please use console/stream/dual value for logStreamingMethod setting.')

    return streamingMethod


def get_identifier():
    id = settings.get('customIdentifier', '')
    if id == '':
        id = os.environ['USER']
    return id
