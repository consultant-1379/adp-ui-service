load('config.star', 'get_settings')
settings = get_settings()
docker_registries = settings.get('dockerRegistries')
armdocker = docker_registries['armdocker']
version = read_file('../.bob/var.version', default='1.0.0')

image_base_os_version = '5.6.0-11'

if settings.get('devMode'):
    devMode = 'true'
    entryPointCommand = './entrypoint.sh -d'
else:
    devMode = 'false'
    entryPointCommand = './entrypoint.sh'


def build_main_service():
    docker_build(
        armdocker['url'] + '/' +
        str(settings.get('repoPath')) + '/uiservice',  # image name
        '.',  # base path for docker build
        dockerfile='./docker/Dockerfile',
        entrypoint=entryPointCommand,
        ignore=['mock'],
        build_args={
            'DEV': devMode,
            'BASE_OS_VERSION': image_base_os_version,
            'VERSION': version
        },
        secret=[
            'id=arm_npm_token,src=.bob/var.token',
            'id=rnd_arm_npm_token,src=.bob/var.rnd-token'
        ],
        live_update=[
            fall_back_on(['backend/package.json']),
            sync('backend', '/runtime/server'),
            # run('cd /runtime/server && npm install', trigger=['backend/package.json']), # does not work due to user right issues - TODO fix
        ]
    )
