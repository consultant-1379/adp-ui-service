load('config.star', 'get_settings')
load('config.star', 'get_identifier')
load('ext://namespace', 'namespace_inject')
settings = get_settings()
docker_registries = settings.get('dockerRegistries')
armdocker = docker_registries['armdocker']

dstNeeded = settings.get('deployDSTServices')
mTLS = settings.get('mTLS') or settings.get('enableAuthentication')

identifier = get_identifier()


def deploy_main_service(ingressHost, mainChart_deps, namespace, gas_service_port, gas_service_forwarding_port, gas_metrics_port, gas_metrics_forwarding_port, debug_port, logStreamingMethod):

    k8s_resource('eric-adp-gui-aggregator-service',  # deployment name in the k8s yaml
                 port_forwards=[
                     '{}:{}'.format(gas_service_forwarding_port,
                                    gas_service_port),   # ui-service
                     '{}:{}'.format(gas_metrics_forwarding_port,
                                    gas_metrics_port),   # metrics
                     '{}:9229'.format(debug_port),   # debugger
                 ],
                 resource_deps=mainChart_deps
                 )

    set_params = [  # Values to set from the command-line
        'service.port='+gas_service_port,
        'service.targetPort='+gas_service_port,
        'imageCredentials.main.registry.url=' + armdocker['url'],
        'imageCredentials.pullSecret=' + str(settings.get('dockerSecretName')),
        'imageCredentials.main.repoPath=' + str(settings.get('repoPath')),
        'imageCredentials.main.name=uiservice',
        'ingress.enabled='+str(settings.get('ingressEnabled')),
        'ingress.path='+settings.get('ingressPath',
                                     '/uiservice_' + identifier),
        'ingress.hostname='+ingressHost,
        'ingress.tls.enabled='+str(settings.get('ingressEnableTLS')),
        'ingress.useContour='+str(settings.get('ingressUseContour')),
        'ingress.ingressClass='+settings.get('ingressClass'),
        'ingress.adpIccrServiceName='+str(settings.get('adpIccrServiceName')),
        'global.networkPolicy.enabled='+str(not settings.get('nodePort')),
        'global.security.tls.enabled='+str(mTLS),
        'service.endpoints.http.tls.verifyClientCertificate=' + \
        settings.get('verifyClientCertificate', 'optional'),
        'log.streamingMethod='+logStreamingMethod,
        'configuration.faultIndications.enabled=' + \
        str(settings.get('faultIndicationsEnabled')),
        'configuration.logging.defaultLogLevel=' + \
        settings.get('logLevel', 'info'),
        'configuration.logging.stdoutLogFormat=' + \
        settings.get('stdoutLogFormat', 'text'),
        'configuration.helpAggregator.enabled=' + \
        str(settings.get('helpAggregatorEnabled')),
        'configuration.guiContext='+str(settings.get('guiContext')),
        'uiconfig.path='+str(settings.get('uiConfigPath')),
        'metrics.enabled='+str(settings.get('metricsEnabled')),
        'metrics.port='+gas_metrics_port,
        # live reload only works with single pod
        'replicaCount='+str(settings.get('replicaCount', 1)),
        'dst.enabled='+str(dstNeeded),
    ]

    # reusing Ingress host when setting up APO FQDN's
    if settings.get('enableAuthentication'):
        authFqdn = ''.join(['authn.iam.', ingressHost])
        keycloakFqdn = ''.join(['iam.', ingressHost])
        set_params.append('authorizationProxy.enabled=' +
                          str(settings.get('enableAuthentication')))
        set_params.append('authorizationProxy.authnProxyFQDN='+authFqdn)
        set_params.append('authorizationProxy.keycloakFQDN='+keycloakFqdn)
        set_params.append('authorizationProxy.adpIccrServiceName=' +
                          str(settings.get('adpIccrServiceName')))
        set_params.append('configuration.userPermission.enabled=' +
                          str(settings.get('enableAuthentication')))

    if settings.get('deployMockServices'):
        set_params.append('manualconfig.services[0].name=demo-ui-service-eea')
        set_params.append('manualconfig.services[0].version=1.0')
        if mTLS:
            set_params.append(
                'manualconfig.services[0].URL=https://demo-ui-service-eea-http:4000/ui-manual')
        else:
            set_params.append(
                'manualconfig.services[0].URL=http://demo-ui-service-eea-http:4000/ui-manual')

    if settings.get('deployDevPortalMock'):
        set_params.append(
            'manualconfig.groups[0].name="rapps:category:optimization"')
        set_params.append(
            'manualconfig.groups[0].displayName="Network Optimization"')
        set_params.append('manualconfig.groups[0].type="category"')
        set_params.append('manualconfig.groups[0].version="1.0.0"')
        set_params.append('manualconfig.groups[1].name="rapps:product"')
        set_params.append(
            'manualconfig.groups[1].displayName="Automation Apps"')
        set_params.append('manualconfig.groups[1].type="product"')
        set_params.append('manualconfig.groups[1].version="1.0.0"')
        set_params.append('manualconfig.groups[2].name="eic:product"')
        set_params.append(
            'manualconfig.groups[2].displayName="Ericsson Intelligent Controller"')
        set_params.append('manualconfig.groups[2].type="product"')
        set_params.append('manualconfig.groups[2].version="1.0.0"')

    if settings.get('deployCNOM'):
        set_params.append('configuration.cnom.defaultDashboards.enabled=true')
        set_params.append('configuration.cnom.dashboardTopology.enabled=false')
        set_params.append('configuration.cnom.dashboardTreeView.enabled=true')

    if settings.get('nodePort'):
        nodeport_hostname = read_file('tilt.nodeport.hostname.txt', default='')
        nodeport_hostname = str(nodeport_hostname)
        cmd = 'sh ci/scripts/get-nodeport-external-url.sh > tilt.nodeport.hostname.txt'
        env_vars = {'NAMESPACE': namespace,
                    'SERVICE_NAME': settings.get('nodePortServiceName')}

        local_resource(
            'gas-nodeport-ulr-getter',
            cmd,
            resource_deps=['eric-adp-gui-aggregator-service'],
            env=env_vars
        )

        if nodeport_hostname:
            urlparts = nodeport_hostname.split(':')
            nodeport_hostname = ''.join(
                [urlparts[0], '.seli.gic.ericsson.se:', urlparts[1]])
            set_params.append('uiconfig.hostname='+nodeport_hostname)
        if mTLS:
            protocol = 'https'
        else:
            protocol = 'http'

        set_params.append('uiconfig.protocol='+protocol)
        set_params.append('service.type=NodePort')
        set_params.append('service.endpoints.http.tls.enforced=optional')
        set_params.append(
            'service.endpoints.http.tls.verifyClientCertificate=optional')

        gasUrl = ''.join([protocol, '://', nodeport_hostname,
                         str(settings.get('guiContext'))])
        print('\n GAS UI NodePort address: ' + gasUrl + '\n')
    else:
        set_params.append('service.endpoints.http.tls.verifyClientCertificate=' +
                          settings.get('verifyClientCertificate', 'optional'))

    # generate yaml with 'helm template' enriched with values and extra config
    template_params = []
    # release (deployment) name
    template_params.append('gui-aggregator-service')
    template_params.append(
        'charts/eric-adp-gui-aggregator-service')  # charts folder
    template_params.append('--include-crds ')
    template_params.append('--namespace ' + namespace)
    template_params.append('--set ' + ','.join(set_params))
    template_params.append('--values ci/config/test-chart-values.yaml')

    # adding custom Capabilities.APIVersions to support given K8s server version
    customApiVersions = settings.get('customK8sApiVersions', [])
    for version in customApiVersions:
        template_params.append('--api-versions ' + version)

    # Switch quiet parameter of local() function to see full command in tilt console
    uiservice_yaml = local(
        'helm template ' + ' '.join(template_params), quiet=True)

    # live reload needs write access to the root fs
    uiservice_yaml = blob(str(uiservice_yaml).replace(
        'readOnlyRootFilesystem: true', 'readOnlyRootFilesystem: false'))

    # deploy yaml and watch chart folder
    k8s_yaml(namespace_inject(uiservice_yaml, namespace))
    watch_file('charts/eric-adp-gui-aggregator-service')
