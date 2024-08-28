load('config.star', 'get_settings')
load('ext://namespace', 'namespace_inject')
settings = get_settings()
docker_registries = settings.get('dockerRegistries')


def deploy_ci_chart(ingressHost, namespace, logStreamingEnabled):

    dstNeeded = settings.get('deployDSTServices')
    fmNeeded = settings.get('faultIndicationsEnabled')
    iamNeeded = settings.get('enableAuthentication')
    pmNeeded = settings.get(
        'metricsEnabled') or fmNeeded or iamNeeded or logStreamingEnabled
    iccrNeeded = settings.get('ingressEnabled')
    meshNeeded = settings.get('serviceMeshEnabled')
    cnomNeeded = settings.get('deployCNOM')
    mTLS = settings.get('mTLS') or settings.get('enableAuthentication')
    searchEngineNeeded = logStreamingEnabled or dstNeeded

    if meshNeeded and iccrNeeded:
        # Starlark does not support exceptions
        print('In case of Service Mesh ICCR must be disabled.')

    ci_params = [  # Values to set from the command-line
        'global.pullSecret='+str(settings.get('dockerSecretName')),
        'global.security.tls.enabled='+str(mTLS),
        'global.serviceMesh.enabled='+str(meshNeeded),
        'global.networkPolicy.enabled='+str(not settings.get('nodePort')),
        'eric-sec-sip-tls.enabled='+str(mTLS),
        'eric-log-transformer.enabled='+str(logStreamingEnabled),
        'eric-data-search-engine.enabled='+str(searchEngineNeeded),
        'eric-pm-server.enabled='+str(pmNeeded),
        'eric-pm-server.imageCredentials.pullSecret=' + \
        str(settings.get('dockerSecretName')),
        'eric-data-document-database-fault-handling.enabled='+str(fmNeeded),
        'eric-fh-alarm-handler.enabled='+str(fmNeeded),
        'eric-fh-alarm-handler.imageCredentials.pullSecret=' + \
        str(settings.get('dockerSecretName')),
        'eric-tm-ingress-controller-cr.enabled='+str(iccrNeeded),
        'eric-mesh-controller.enabled='+str(meshNeeded),
        'eric-mesh-gateways.enabled=' + str(meshNeeded),
        'dst-services.enabled='+str(dstNeeded)
    ]

    if iamNeeded:
        iamAuthFqdn = ''.join(['authn.iam.', ingressHost])
        iamKeycloakFqdn = ''.join(['iam.', ingressHost])
        ci_params.append('eric-sec-access-mgmt.enabled=true')
        ci_params.append('eric-data-document-database-iam.enabled=true')
        ci_params.append(
            'eric-sec-access-mgmt.authenticationProxy.ingress.hostname='+iamAuthFqdn)
        ci_params.append(
            'eric-sec-access-mgmt.ingress.hostname='+iamKeycloakFqdn)
        if settings.get('iamUserName') and settings.get('iamUserPassword'):
            ci_params.append(
                'eric-sec-access-mgmt.adpIamUserName='+str(settings.get('iamUserName')))
            ci_params.append('eric-sec-access-mgmt.adpIamUserPwd=' +
                             str(settings.get('iamUserPassword')))

    if cnomNeeded:
        cnomFqdn = ''.join(['cnom.', ingressHost])
        print('\nCNOM UI address: ' + cnomFqdn + '\n')
        ci_params.append('eric-cnom-server.enabled=true')
        ci_params.append('eric-cnom-server.ingress.hostname='+cnomFqdn)
        ci_params.append('eric-cnom-server.imageCredentials.pullSecret=' +
                         str(settings.get('dockerSecretName')))

    # generate yaml with 'helm template' enriched with values and extra config
    template_params = []
    template_params.append('ci')  # release (deployment) name
    template_params.append('charts/ci')  # charts folder
    template_params.append('--include-crds ')
    template_params.append('--namespace ' + namespace)
    template_params.append('--set ' + ','.join(ci_params))

    # adding custom Capabilities.APIVersions to support given K8s server version
    customApiVersions = settings.get('customK8sApiVersions', [])
    for version in customApiVersions:
        template_params.append('--api-versions ' + version)

    # Switch quiet parameter of local() function to see full command in tilt console
    ci_yaml = local('helm template ' + ' '.join(template_params), quiet=True)

    # deploy yaml and watch chart folder
    k8s_yaml(namespace_inject(ci_yaml, namespace), allow_duplicates=True)
    watch_file('charts/ci')

    # in case there is Contour, wait for it and save its loadbalancer IP
    if iccrNeeded:
        cmd = 'kubectl -n ${NAMESPACE} get service -o=jsonpath=\'{.items[?(@.spec.type == "LoadBalancer")].status.loadBalancer.ingress[0].ip}\' \
      > tilt.iccr.ip.txt && \
      if ! [ -s "tilt.iccr.ip.txt" ]; then echo "ERROR: No Loadbalancer IP!" && exit 1; else echo "ICCR address in ${NAMESPACE} namespace:" && cat tilt.iccr.ip.txt && echo "\\n";fi'
        local_resource(
            'tilt-iccr-ip-fetcher',
            cmd,
            resource_deps=['eric-tm-ingress-controller-cr-contour-v1'],
            env={'NAMESPACE': namespace}
        )

    # Configuring resources dependencies to maintain the deploy order
    if fmNeeded:
        k8s_resource('eric-fh-alarm-handler',
                     port_forwards=[
                         '5006:5006',   # rest-api for alarms, https
                     ],
                     resource_deps=['eric-data-message-bus-kf'])
        k8s_resource('eric-data-message-bus-kf', resource_deps=[
                     'eric-data-document-database-fault-handling', 'eric-data-coordinator-zk'])
        k8s_resource('eric-data-document-database-fault-handling', resource_deps=[
                     'eric-sec-sip-tls-main', 'eric-sec-key-management-main', 'eric-data-distributed-coordinator-ed', 'eric-pm-server'])
        k8s_resource('eric-data-coordinator-zk', resource_deps=[
                     'eric-sec-sip-tls-main', 'eric-sec-key-management-main', 'eric-data-distributed-coordinator-ed'])
        k8s_resource('eric-pm-server', resource_deps=['eric-sec-sip-tls-main',
                     'eric-sec-key-management-main', 'eric-data-distributed-coordinator-ed'])

    if dstNeeded:
        k8s_resource('eric-dst-collector',
                     port_forwards=[
                         '14268:14268',  # Jager-thrift interface
                         # Agent port (might not needed, DST Agent is deprecated)
                         '14250:14250',
                         '9411:9411',  # Zipkin interface
                         '9422:9422',  # Zipkin interface
                         '4317:4317',  # OTLP/gRPC interface
                         '4318:4318',  # OTLP/HTTP interface
                     ])

        k8s_resource('eric-dst-query',
                     port_forwards=[
                         '16686:16686',  # jagerUI
                         '16688:16688',  # HTTPS query
                     ])
