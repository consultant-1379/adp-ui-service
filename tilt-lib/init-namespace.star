load('ext://namespace', 'namespace_create')
load('ext://secret', 'secret_yaml_generic')
load('config.star', 'get_settings')

settings = get_settings()
docker_registries = settings.get('dockerRegistries')


def init_namespace(namespace):
    namespace_create(namespace)

    # preparing secret file for docker: copying template and replacing placeholders
    local('cp arm_docker_pull_secret_template.json .bob/.dockerconfigjson')
    for registry in docker_registries:
        current_registry = docker_registries[registry]
        usernameKey = current_registry['username']
        passwordKey = current_registry['password']
        local('sed -i -e " s/' + usernameKey + '/' +
              os.environ[usernameKey] + '/" -e " s/' + passwordKey + '/' + os.environ[passwordKey] + '/" .bob/.dockerconfigjson')

    # creating secret for docker registries from file (secret_yaml_generic returns with blob)
    k8s_yaml(secret_yaml_generic(name=str(settings.get('dockerSecretName')),
             namespace=namespace, from_file='.bob/.dockerconfigjson', secret_type='kubernetes.io/dockerconfigjson'))


def docker_login():
    docker_config = read_json(
        os.getenv('HOME') + '/.docker/config.json', default={})
    for registry in docker_registries:
        current_registry = docker_registries[registry]
        if not docker_config.get('auths') or current_registry['url'] not in docker_config.get('auths'):
            username = os.environ[current_registry['username']]
            password = os.environ[current_registry['password']]
            local('docker login ' + current_registry['url'] +
                  ' --username=' + username + ' --password=' + password)


def generate_namespace_name():
    namespace = settings.get('exactnamespace', '')
    if namespace == '':
        namespace = settings.get('namespace_prefix') + '-' + os.environ['USER']
    return namespace
