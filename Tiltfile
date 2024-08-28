load('./tilt-lib/config.star', 'get_settings')
load('./tilt-lib/config.star', 'get_log_setting')
load('./tilt-lib/config.star', 'get_identifier')
settings = get_settings()
namespace = 'default'
gas_service_port = str(settings.get('servicePort'))
gas_service_forwarding_port = str(settings.get('forwardingPort'))
gas_metrics_port = str(settings.get('metricsPort'))
gas_metrics_forwarding_port = str(settings.get('metricsForwardingPort'))
debug_port = str(settings.get('debugPort'))
mainChart_deps = []

# this variable is used both in GAS and CI block
ingressHost = settings.get('ingressHost', 'localhost')
loadBalancerIp = settings.get('ingressIP', '')
# overwriting it using actual IP in case of Contour
if settings.get('ingressEnabled'):
  # after .txt is updated by "tilt-iccr-ip-fetcher", Tiltfile is retriggered and ingressHost is recalculated
  loadBalancerIp = read_file('tilt.iccr.ip.txt', default = '')
  loadBalancerIp = str(loadBalancerIp)

identifier = get_identifier()

if loadBalancerIp:
  ingressHost = ''.join([str(identifier),'.gas.', loadBalancerIp, '.nip.io'])
  protocol = 'http'
  if (settings.get('ingressEnableTLS')):
    protocol = 'https'
  gasUrl=''.join([protocol, '://', ingressHost, str(settings.get('guiContext'))])
  if (settings.get('deployMainService') and (settings.get('ingressEnabled') or settings.get('serviceMeshEnabled'))):
    print('\nGAS UI address: ' + gasUrl + '\n')

# Handle remote mode
load('./tilt-lib/init-namespace.star', 'init_namespace', 'docker_login', 'generate_namespace_name')
if settings.get('mode') == 'remote':
  allow_k8s_contexts(settings.get('kubecontext'))
  local('node scripts/generate-npm-tokens.js')
  namespace = generate_namespace_name()
  init_namespace(namespace)
  #local('kubectl config set-context --current --namespace=' + namespace)
  docker_login()

# Load statement can not be moved to if statement, because Tilt does not allow that.
load('./tilt-lib/generate-mock.star', 'generate_mock_service', 'build_mock_service_image')
if settings.get('deployMockServices') or settings.get('deployEsmServices') or settings.get('deployDevPortalMock'):
  build_mock_service_image()

if settings.get('deployMockServices') and not settings.get('deployDevPortalMock'):
  # mock_id, port_offset, namespace, loadBalancerIp, public_path, context_root, (unsetLabels)
  generate_mock_service('ecm', 10, namespace, loadBalancerIp, 'ui-generic-ecm', '/ui')
  generate_mock_service('eea', 20, namespace, loadBalancerIp, 'ui-generic-eea', '/ui-manual', unsetLabels = True)
  generate_mock_service('enm', 30, namespace, loadBalancerIp, 'ui-generic-enm', '/other-path')

if settings.get('deployEsmServices') and not settings.get('deployDevPortalMock'):
  # mock_id, port_offset, namespace, loadBalancerIp, public_path
  generate_mock_service('esma', 50, namespace, loadBalancerIp, 'esm-container')
  generate_mock_service('esmb', 60, namespace, loadBalancerIp, 'esm-service-1')
  generate_mock_service('esmc', 70, namespace, loadBalancerIp, 'esm-service-2')
  generate_mock_service('eui1', 80, namespace, loadBalancerIp, 'e-ui-app-1')
  generate_mock_service('eui2', 100, namespace, loadBalancerIp, 'e-ui-app-2')
  generate_mock_service('3pp', 120, namespace, loadBalancerIp, 'third-party-app')
  generate_mock_service('tree', 140, namespace, loadBalancerIp, 'e-ui-tree-apps')
  generate_mock_service('action-consumer', 160, namespace, loadBalancerIp, 'action-consumer')
  generate_mock_service('action-provider', 180, namespace, loadBalancerIp, 'action-provider')

if settings.get('deployDevPortalMock'):
  generate_mock_service('configuration-checker', 200, namespace, loadBalancerIp, 'dev-portal-mock-gui')
  k8s_resource('demo-ui-service-configuration-checker', resource_deps=['tilt-iccr-ip-fetcher'])

load('./tilt-lib/deploy-main-service.star', 'deploy_main_service')
load('./tilt-lib/build-main-service.star', 'build_main_service')
load('./tilt-lib/deploy-ci-chart.star', 'deploy_ci_chart')
logStreamingMethod = get_log_setting()
logStreamingEnabled = (logStreamingMethod == 'dual') or (logStreamingMethod == 'direct')

if not settings.get('isCiChartDeployed') and (logStreamingEnabled or settings.get('mTLS') or settings.get('faultIndicationsEnabled') or settings.get('enableAuthentication') or settings.get('ingressEnabled') or settings.get('serviceMeshEnabled') or settings.get('deployCNOM') or settings.get('metricsEnabled') or settings.get('deployDSTServices')):
  deploy_ci_chart(ingressHost, namespace, logStreamingEnabled)

if settings.get('deployMainService'):
  if settings.get('faultIndicationsEnabled'):
    mainChart_deps.append('eric-fh-alarm-handler')

  if settings.get('deployDSTServices'):
    mainChart_deps.append('eric-dst-collector')

  if logStreamingEnabled:
    mainChart_deps.append('eric-log-transformer')

  # in case of Contour, only deploy GAS after tilt-iccr-ip-fetcher is ready
  if settings.get('ingressEnabled') and settings.get('ingressUseContour'):
    mainChart_deps.append('tilt-iccr-ip-fetcher')

  build_main_service()
  deploy_main_service(ingressHost, mainChart_deps, namespace, gas_service_port, gas_service_forwarding_port, gas_metrics_port, gas_metrics_forwarding_port, debug_port, logStreamingMethod)
