{{/*
    Template defining the Authorization Proxy sidecars
    Version: eric-sec-authorization-proxy-oauth2-2.6.0-9
*/}}

{{/*
Create template for auth proxy labels; version and app selector,
template is included in SP _product_label and so attached to all k8s objects
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-labels" -}}
{{ "authpxy.version: " -}}{{- "eric-sec-authorization-proxy-oauth2-2.6.0-9" | trunc 63 | trimSuffix "-" }}
authpxy.app: "authz-proxy-library"
{{- end -}}

{{/*
Create a map from ".Values.global" with defaults if missing in values file.
This hides defaults from values file.
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-global" -}}
  {{- $globalDefaults := dict "security" (dict "tls" (dict "enabled" true)) -}}
  {{- $globalDefaults := merge $globalDefaults (dict "registry" (dict "imagePullPolicy" "IfNotPresent")) -}}
  {{- $globalDefaults := merge $globalDefaults (dict "oamNodeID" "oamNodeID not set") -}}
  {{- $globalDefaults := merge $globalDefaults (dict "timezone" "UTC") -}}
  {{- if .Values.global -}}
    {{- mergeOverwrite $globalDefaults .Values.global | toJson -}}
  {{- else -}}
    {{- $globalDefaults | toJson -}}
  {{- end -}}
{{- end -}}

{{/*
Create a map from ".Values.authorizationProxy" with defaults if missing in values file.
Note default values for ".resources" are handled in separate template "eric-adp-gui-aggregator-serviceauthz-proxy-resources"
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-values" -}}
  {{- $authzproxyDefaults := dict "enabled" true -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "protectedPaths" (list "/")) -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "adpIamServiceName" "eric-sec-access-mgmt") -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "adpPmServiceName" "eric-pm-server") -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "adpIccrServiceName" "eric-tm-ingress-controller-cr") -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "adpSipTlsServiceName" "eric-sec-sip-tls") -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "adpIccrCaSecret" "") -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "adpIamServicePort" "") -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "adpIamAdminConsolePort" "8444") -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "adpIamRealm" "oam") -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "adpIamAdminSecret" "eric-sec-access-mgmt-creds") -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "adpIamClientCredentialSecret" "eric-sec-access-mgmt-aapxy-creds") -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "port" "8888") -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "suffixOverride" "authproxy") -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "localSpClientCertVolumeName" "") -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "numOfWebServerWorkers" "2") -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "service" (dict "endpoints" (dict "authorizationProxy" (dict "tls" (dict "enforced" "required"))))) -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "service" (dict "endpoints" (dict "authorizationProxy" (dict "tls" (dict "verifyClientCertificate" "optional"))))) -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "iamRequestTimeout" "8") -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "spRequestTimeout" "8") -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "authzLog" (dict "logtransformer" (dict "host" "eric-log-transformer"))) -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "metrics" (dict "enabled" true )) -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "sipoauth2" (dict "enabled" true )) -}}
  {{- $authzproxyDefaults := merge $authzproxyDefaults (dict "counterPrefix" "") -}}

  {{- if .Values.authorizationProxy -}}
    {{- mergeOverwrite $authzproxyDefaults .Values.authorizationProxy | toJson -}}
  {{- else -}}
    {{- $authzproxyDefaults | toJson -}}
  {{- end -}}
{{- end -}}

{{/*
Create a map from ".Values.probes" with defaults if missing from value file.
This hides defaults from values file.
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-probes" -}}
  {{- $probeDefaults := dict dict "ericsecoauthproxy" (dict "startupProbe" (dict "failureThreshold" "25")) -}}
  {{- $probeDefaults := merge $probeDefaults (dict "ericsecoauthproxy" (dict "startupProbe" (dict "initialDelaySeconds" "0"))) -}}
  {{- $probeDefaults := merge $probeDefaults (dict "ericsecoauthproxy" (dict "startupProbe" (dict "periodSeconds" "5"))) -}}
  {{- $probeDefaults := merge $probeDefaults (dict "ericsecoauthproxy" (dict "startupProbe" (dict "timeoutSeconds" "5"))) -}}
  {{- $probeDefaults := merge $probeDefaults (dict "ericsecoauthproxy" (dict "livenessProbe" (dict "initialDelaySeconds" "0"))) -}}
  {{- $probeDefaults := merge $probeDefaults (dict "ericsecoauthproxy" (dict "livenessProbe" (dict "failureThreshold" "2"))) -}}
  {{- $probeDefaults := merge $probeDefaults (dict "ericsecoauthproxy" (dict "livenessProbe" (dict "periodSeconds" "5"))) -}}
  {{- $probeDefaults := merge $probeDefaults (dict "ericsecoauthproxy" (dict "livenessProbe" (dict "timeoutSeconds" "5"))) -}}
  {{- $probeDefaults := merge $probeDefaults (dict "ericsecoauthproxy" (dict "readinessProbe" (dict "initialDelaySeconds" "0"))) -}}
  {{- $probeDefaults := merge $probeDefaults (dict "ericsecoauthproxy" (dict "readinessProbe" (dict "failureThreshold" "1"))) -}}
  {{- $probeDefaults := merge $probeDefaults (dict "ericsecoauthproxy" (dict "readinessProbe" (dict "periodSeconds" "5"))) -}}
  {{- $probeDefaults := merge $probeDefaults (dict "ericsecoauthproxy" (dict "readinessProbe" (dict "successThreshold" "1"))) -}}
  {{- $probeDefaults := merge $probeDefaults (dict "ericsecoauthproxy" (dict "readinessProbe" (dict "timeoutSeconds" "5"))) -}}
  {{- if .Values.probes -}}
    {{- mergeOverwrite $probeDefaults .Values.probes | toJson -}}
  {{- else -}}
    {{- $probeDefaults | toJson -}}
  {{- end -}}
{{- end -}}

{{- define "eric-adp-gui-aggregator-service.log-streaming-activated" -}}
  {{- $streamingMethod := (include "eric-adp-gui-aggregator-service.log-streamingMethod" .) -}}
  {{- if or (eq $streamingMethod "dual") (eq $streamingMethod "direct") -}}
    {{- printf "%t" true -}}
  {{- else -}}
    {{- printf "%t" false -}}
  {{- end -}}
{{- end -}}

{{- define "eric-adp-gui-aggregator-service.log-stdout-activated" -}}
  {{- $streamingMethod := (include "eric-adp-gui-aggregator-service.log-streamingMethod" .) -}}
  {{- if or (eq $streamingMethod "dual") (eq $streamingMethod "indirect") -}}
    {{- printf "%t" true -}}
  {{- else -}}
    {{- printf "%t" false -}}
  {{- end -}}
{{- end -}}

{{/*
Streaming method selection logic.
Precedence order:
  log.streamingMethod > global.log.streamingMethod > (default) "indirect"
Local overrides global, and if nothing set then indirect (stdout) is chosen.
*/}}
{{ define "eric-adp-gui-aggregator-service.log-streamingMethod" }}
  {{- $streamingMethod := "indirect" -}}
  {{- if (((.Values.global).log).streamingMethod) -}}
    {{- $streamingMethod = .Values.global.log.streamingMethod -}}
  {{- end -}}
  {{- if ((.Values.log).streamingMethod) -}}
    {{- $streamingMethod = .Values.log.streamingMethod -}}
  {{- end -}}
  {{- printf "%s" $streamingMethod -}}
{{ end }}

{{/*
Create a map from ".Values.imageCredentials" with defaults if missing from value file.
This hides defaults from values file.
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-imageCreds" -}}
  {{- $imageCredsDefaults := dict "ericsecoauthproxy" (dict "registry" (dict "imagePullPolicy" "")) -}}
  {{- $imageCredsDefaults := merge $imageCredsDefaults (dict "ericsecoauthsap" (dict "registry" (dict "imagePullPolicy" ""))) -}}
  {{- if .Values.imageCredentials -}}
    {{- mergeOverwrite $imageCredsDefaults .Values.imageCredentials | toJson -}}
  {{- else -}}
    {{- $imageCredsDefaults | toJson -}}
  {{- end -}}
{{- end -}}

{{/*
The eric-sec-oauth-sap image path
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-sap-imagePath" -}}
    {{- $productInfo := fromYaml (.Files.Get "eric-product-info.yaml") -}}
    {{- $registryUrl := $productInfo.images.ericsecoauthsap.registry -}}
    {{- $repoPath := $productInfo.images.ericsecoauthsap.repoPath -}}
    {{- $name := $productInfo.images.ericsecoauthsap.name -}}
    {{- $tag := $productInfo.images.ericsecoauthsap.tag -}}
    {{- if .Values.global -}}
        {{- if .Values.global.registry -}}
            {{- if .Values.global.registry.url -}}
                {{- $registryUrl = .Values.global.registry.url -}}
            {{- end -}}
            {{- if not (kindIs "invalid" .Values.global.registry.repoPath) -}}
                {{- $repoPath = .Values.global.registry.repoPath -}}
            {{- end -}}
        {{- end -}}
    {{- end -}}
    {{- if .Values.imageCredentials -}}
        {{- if not (kindIs "invalid" .Values.imageCredentials.repoPath) -}}
            {{- $repoPath = .Values.imageCredentials.repoPath -}}
        {{- end -}}
        {{- if .Values.imageCredentials.ericsecoauthsap -}}
            {{- if .Values.imageCredentials.ericsecoauthsap.registry -}}
                {{- if .Values.imageCredentials.ericsecoauthsap.registry.url -}}
                    {{- $registryUrl = .Values.imageCredentials.ericsecoauthsap.registry.url -}}
                {{- end -}}
            {{- end -}}
            {{- if not (kindIs "invalid" .Values.imageCredentials.ericsecoauthsap.repoPath) -}}
                {{- $repoPath = .Values.imageCredentials.ericsecoauthsap.repoPath -}}
            {{- end -}}
        {{- end -}}
    {{- end -}}
    {{- if $repoPath -}}
        {{- $repoPath = printf "%s/" $repoPath -}}
    {{- end -}}
    {{- printf "%s/%s%s:%s" $registryUrl $repoPath $name $tag -}}
{{- end -}}

{{/*
ImagePullPolicy for sap init container
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-sap-imagePullPolicy" -}}
  {{- $imageCredentials := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-imageCreds" .) -}}
  {{- $global := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-global" .) -}}
  {{- if $imageCredentials.ericsecoauthsap.registry.imagePullPolicy -}}
    {{- print $imageCredentials.ericsecoauthsap.registry.imagePullPolicy -}}
  {{- else -}}
    {{- print $global.registry.imagePullPolicy -}}
  {{- end -}}
{{- end -}}

{{/*
The eric-sec-oauth-proxy image path
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-proxy-imagePath" -}}
    {{- $productInfo := fromYaml (.Files.Get "eric-product-info.yaml") -}}
    {{- $registryUrl := $productInfo.images.ericsecoauthproxy.registry -}}
    {{- $repoPath := $productInfo.images.ericsecoauthproxy.repoPath -}}
    {{- $name := $productInfo.images.ericsecoauthproxy.name -}}
    {{- $tag := $productInfo.images.ericsecoauthproxy.tag -}}
    {{- if .Values.global -}}
        {{- if .Values.global.registry -}}
            {{- if .Values.global.registry.url -}}
                {{- $registryUrl = .Values.global.registry.url -}}
            {{- end -}}
            {{- if not (kindIs "invalid" .Values.global.registry.repoPath) -}}
                {{- $repoPath = .Values.global.registry.repoPath -}}
            {{- end -}}
        {{- end -}}
    {{- end -}}
    {{- if .Values.imageCredentials -}}
        {{- if not (kindIs "invalid" .Values.imageCredentials.repoPath) -}}
            {{- $repoPath = .Values.imageCredentials.repoPath -}}
        {{- end -}}
        {{- if .Values.imageCredentials.ericsecoauthproxy -}}
            {{- if .Values.imageCredentials.ericsecoauthproxy.registry -}}
                {{- if .Values.imageCredentials.ericsecoauthproxy.registry.url -}}
                    {{- $registryUrl = .Values.imageCredentials.ericsecoauthproxy.registry.url -}}
                {{- end -}}
            {{- end -}}
            {{- if not (kindIs "invalid" .Values.imageCredentials.ericsecoauthproxy.repoPath) -}}
                {{- $repoPath = .Values.imageCredentials.ericsecoauthproxy.repoPath -}}
            {{- end -}}
        {{- end -}}
    {{- end -}}
    {{- if $repoPath -}}
        {{- $repoPath = printf "%s/" $repoPath -}}
    {{- end -}}
    {{- printf "%s/%s%s:%s" $registryUrl $repoPath $name $tag -}}
{{- end -}}

{{/*
ImagePullPolicy for proxy sidecar container
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-proxy-imagePullPolicy" -}}
  {{- $imageCredentials := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-imageCreds" .) -}}
  {{- $global := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-global" .) -}}
  {{- if $imageCredentials.ericsecoauthproxy.registry.imagePullPolicy -}}
    {{- print $imageCredentials.ericsecoauthproxy.registry.imagePullPolicy -}}
  {{- else -}}
    {{- print $global.registry.imagePullPolicy -}}
  {{- end -}}
{{- end -}}

{{/*
Authorization Proxy sidecar service port definition
To be used in the k8s service that publishes Authorization Proxy service port.
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-service-port" -}}
{{- $authorizationProxy := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-values" .) -}}
{{- $global := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-global" .) -}}
{{- $isAuthzServerTls := and $global.security.tls.enabled (ne $authorizationProxy.service.endpoints.authorizationProxy.tls.enforced "optional") -}}
{{- if $authorizationProxy.enabled -}}
{{- if $isAuthzServerTls }}
- name: "http-apo2-tls"
{{- else }}
- name: "http-apo2"
{{- end }}
  protocol: TCP
  port: 8080
  targetPort: http-apo2
{{- end -}}
{{- end -}}

{{/*
Authorization Proxy k8s service name
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-service-name" -}}
{{- $serviceprovidername := default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- $authorizationProxy := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-values" .) -}}
{{- printf "%s-%s" $serviceprovidername $authorizationProxy.suffixOverride }}
{{- end -}}

{{/*
Authorization Proxy IAM access label
Access to IAM according to pattern 2 network policy configurations
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-iam-access-label" -}}
{{- $authorizationProxy := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-values" .) -}}
  {{- printf "%s-access" ($authorizationProxy.adpIamServiceName) -}}
{{- end -}}

{{/*
Authorization Proxy specific k8s service annotations
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-service-annotations" -}}
{{- $global := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-global" .) -}}
{{- $authorizationProxy := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-values" .) -}}
{{- $isAuthzServerTls := and $global.security.tls.enabled (ne $authorizationProxy.service.endpoints.authorizationProxy.tls.enforced "optional") -}}
{{- if and $global.security.tls.enabled $authorizationProxy.enabled -}}
  {{- if $isAuthzServerTls -}}
  projectcontour.io/upstream-protocol.tls: http-apo2-tls,8080
  {{- end -}}
{{- end -}}
{{- end -}}

{{/*
IAM server k8s service port number.

This port will always provide those endpoints that are part of some external
standard supported by IAM server (token endpoint, openid connect endpoints etc.)

By default it will also serve IAM admin REST API (a.k.a admin console).
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-iam-int-port" -}}
{{- $global := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-global" .) -}}
{{- $authorizationProxy := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-values" .) -}}
{{- if $authorizationProxy.adpIamServicePort -}}
{{ $authorizationProxy.adpIamServicePort | quote }}
{{- else -}}
{{- if $global.security.tls.enabled -}}
"8443"
{{- else -}}
"8080"
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Get resources requests ephemeral-storage for sap container

If .Values.resources).ericsecoauthsap).requests.ephemeral-storage is defined, return that
Otherwise if Values.authorizationProxy.resources.ericsecoauthsap.requests.ephemeral-storage, return that
Otherwise return ""
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-sap-requests-ephemeral" -}}
{{- $ephemeral := "" -}}
{{- if (((.Values.authorizationProxy).resources).ericsecoauthsap).requests -}}
  {{- if index ((((.Values.authorizationProxy).resources).ericsecoauthsap).requests) "ephemeral-storage" -}}
    {{- $ephemeral = index .Values.authorizationProxy.resources.ericsecoauthsap.requests "ephemeral-storage" -}}
  {{- end -}}
{{- end -}}
{{- if ((.Values.resources).ericsecoauthsap).requests -}}
  {{- if index (((.Values.resources).ericsecoauthsap).requests) "ephemeral-storage" -}}
    {{- $ephemeral = index .Values.resources.ericsecoauthsap.requests "ephemeral-storage" -}}
  {{- end -}}
{{- end -}}
{{- $ephemeral -}}
{{- end -}}

{{/*
Get resources limits ephemeral-storage for sap container

If .Values.resources).ericsecoauthsap).limits.ephemeral-storage is defined, return that
Otherwise if Values.authorizationProxy.limits.ericsecoauthsap.requests.ephemeral-storage, return that
Otherwise return ""
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-sap-limits-ephemeral" -}}
{{- $ephemeral := "" -}}
{{- if (((.Values.authorizationProxy).resources).ericsecoauthsap).limits -}}
  {{- if index ((((.Values.authorizationProxy).resources).ericsecoauthsap).limits) "ephemeral-storage" -}}
    {{- $ephemeral = index .Values.authorizationProxy.resources.ericsecoauthsap.limits "ephemeral-storage" -}}
  {{- end -}}
{{- end -}}
{{- if ((.Values.resources).ericsecoauthsap).limits -}}
  {{- if index (((.Values.resources).ericsecoauthsap).limits) "ephemeral-storage" -}}
    {{- $ephemeral = index .Values.resources.ericsecoauthsap.limits "ephemeral-storage" -}}
  {{- end -}}
{{- end -}}
{{- $ephemeral -}}
{{- end -}}

{{/*
Get resources requests ephemeral-storage for authzproxy container

If .Values.resources.ericsecoauthproxy.requests.ephemeral-storage is defined, return that
Otherwise if Values.authorizationProxy.resources.ericsecoauthproxy.requests.ephemeral-storage, return that
Otherwise return ""
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-authzproxy-requests-ephemeral" -}}
{{- $ephemeral := "" -}}
{{- if (((.Values.authorizationProxy).resources).ericsecoauthproxy).requests -}}
  {{- if index ((((.Values.authorizationProxy).resources).ericsecoauthproxy).requests) "ephemeral-storage" -}}
    {{- $ephemeral = index .Values.authorizationProxy.resources.ericsecoauthproxy.requests "ephemeral-storage" -}}
  {{- end -}}
{{- end -}}
{{- if ((.Values.resources).ericsecoauthproxy).requests -}}
  {{- if index (((.Values.resources).ericsecoauthproxy).requests) "ephemeral-storage" -}}
    {{- $ephemeral = index .Values.resources.ericsecoauthproxy.requests "ephemeral-storage" -}}
  {{- end -}}
{{- end -}}
{{- $ephemeral -}}
{{- end -}}

{{/*
Get resources limits ephemeral-storage for authzproxy container

If .Values.resources).ericsecoauthproxy).limits.ephemeral-storage is defined, return that
Otherwise if Values.authorizationProxy.limits.ericsecoauthproxy.requests.ephemeral-storage, return that
Otherwise return ""
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-authzproxy-limits-ephemeral" -}}
{{- $ephemeral := "" -}}
{{- if (((.Values.authorizationProxy).resources).ericsecoauthproxy).limits -}}
  {{- if index ((((.Values.authorizationProxy).resources).ericsecoauthproxy).limits) "ephemeral-storage" -}}
    {{- $ephemeral = index .Values.authorizationProxy.resources.ericsecoauthproxy.limits "ephemeral-storage" -}}
  {{- end -}}
{{- end -}}
{{- if ((.Values.resources).ericsecoauthproxy).limits -}}
  {{- if index (((.Values.resources).ericsecoauthproxy).limits) "ephemeral-storage" -}}
    {{- $ephemeral = index .Values.resources.ericsecoauthproxy.limits "ephemeral-storage" -}}
  {{- end -}}
{{- end -}}
{{- $ephemeral -}}
{{- end -}}

{{/*
Create a map for authorization proxy requests and limits resources

A resource is added into map only if corresponding resource is defined in deployment parameters
.Values.resources.* or .Values.authorizationProxy.resource.*.

For example, if .Values.resources.ericsecoauthsap.requests.cpu and
.Values.authorizationProxy.resources.ericsecoauthsap.requests.cpu are not defined, then
the map does not contain ericsecoauthsap.requests.cpu at all.
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-resources" -}}
{{- $resources := dict -}}
{{- if (((.Values.resources).ericsecoauthsap).requests).cpu -}}
  {{- $resources := merge $resources (dict "ericsecoauthsap" (dict "requests" (dict "cpu" .Values.resources.ericsecoauthsap.requests.cpu))) -}}
{{- else if ((((.Values.authorizationProxy).resources).ericsecoauthsap).requests).cpu -}}
  {{- $resources := merge $resources (dict "ericsecoauthsap" (dict "requests" (dict "cpu" .Values.authorizationProxy.resources.ericsecoauthsap.requests.cpu))) -}}
{{- end -}}
{{- if (((.Values.resources).ericsecoauthsap).limits).cpu -}}
  {{- $resources := merge $resources (dict "ericsecoauthsap" (dict "limits" (dict "cpu" .Values.resources.ericsecoauthsap.limits.cpu))) -}}
{{- else if ((((.Values.authorizationProxy).resources).ericsecoauthsap).limits).cpu -}}
  {{- $resources := merge $resources (dict "ericsecoauthsap" (dict "limits" (dict "cpu" .Values.authorizationProxy.resources.ericsecoauthsap.limits.cpu))) -}}
{{- end -}}
{{- if (((.Values.resources).ericsecoauthproxy).requests).cpu -}}
  {{- $resources := merge $resources (dict "ericsecoauthproxy" (dict "requests" (dict "cpu" .Values.resources.ericsecoauthproxy.requests.cpu))) -}}
{{- else if ((((.Values.authorizationProxy).resources).ericsecoauthproxy).requests).cpu -}}
  {{- $resources := merge $resources (dict "ericsecoauthproxy" (dict "requests" (dict "cpu" .Values.authorizationProxy.resources.ericsecoauthproxy.requests.cpu))) -}}
{{- end -}}
{{- if (((.Values.resources).ericsecoauthproxy).limits).cpu -}}
  {{- $resources := merge $resources (dict "ericsecoauthproxy" (dict "limits" (dict "cpu" .Values.resources.ericsecoauthproxy.limits.cpu))) -}}
{{- else if ((((.Values.authorizationProxy).resources).ericsecoauthproxy).limits).cpu -}}
  {{- $resources := merge $resources (dict "ericsecoauthproxy" (dict "limits" (dict "cpu" .Values.authorizationProxy.resources.ericsecoauthproxy.limits.cpu))) -}}
{{- end -}}
{{- if ((((.Values.resources).ericsecoauthsap).requests).memory) -}}
  {{- $resources := merge $resources (dict "ericsecoauthsap" (dict "requests" (dict "memory" .Values.resources.ericsecoauthsap.requests.memory))) -}}
{{- else if ((((.Values.authorizationProxy).resources).ericsecoauthsap).requests).memory -}}
  {{- $resources := merge $resources (dict "ericsecoauthsap" (dict "requests" (dict "memory" .Values.authorizationProxy.resources.ericsecoauthsap.requests.memory))) -}}
{{- end -}}
{{- if ((((.Values.resources).ericsecoauthsap).limits).memory) -}}
  {{- $resources := merge $resources (dict "ericsecoauthsap" (dict "limits" (dict "memory" .Values.resources.ericsecoauthsap.limits.memory))) -}}
{{- else if ((((.Values.authorizationProxy).resources).ericsecoauthsap).limits).memory -}}
  {{- $resources := merge $resources (dict "ericsecoauthsap" (dict "limits" (dict "memory" .Values.authorizationProxy.resources.ericsecoauthsap.limits.memory))) -}}
{{- end -}}
{{- if ((((.Values.resources).ericsecoauthproxy).requests).memory) -}}
  {{- $resources := merge $resources (dict "ericsecoauthproxy" (dict "requests" (dict "memory" .Values.resources.ericsecoauthproxy.requests.memory))) -}}
{{- else if ((((.Values.authorizationProxy).resources).ericsecoauthproxy).requests).memory -}}
  {{- $resources := merge $resources (dict "ericsecoauthproxy" (dict "requests" (dict "memory" .Values.authorizationProxy.resources.ericsecoauthproxy.requests.memory))) -}}
{{- end -}}
{{- if ((((.Values.resources).ericsecoauthproxy).limits).memory) -}}
  {{- $resources := merge $resources (dict "ericsecoauthproxy" (dict "limits" (dict "memory" .Values.resources.ericsecoauthproxy.limits.memory))) -}}
{{- else if ((((.Values.authorizationProxy).resources).ericsecoauthproxy).limits).memory -}}
  {{- $resources := merge $resources (dict "ericsecoauthproxy" (dict "limits" (dict "memory" .Values.authorizationProxy.resources.ericsecoauthproxy.limits.memory))) -}}
{{- end -}}
{{- $ephemeral := (include "eric-adp-gui-aggregator-service.authz-proxy-sap-requests-ephemeral" .) -}}
{{- if ne $ephemeral "" -}}
   {{- $resources := merge $resources (dict "ericsecoauthsap" (dict "requests" (dict "ephemeral-storage" $ephemeral))) -}}
{{- end -}}
{{- $ephemeral := (include "eric-adp-gui-aggregator-service.authz-proxy-sap-limits-ephemeral" .) -}}
{{- if ne $ephemeral "" -}}
   {{- $resources := merge $resources (dict "ericsecoauthsap" (dict "limits" (dict "ephemeral-storage" $ephemeral))) -}}
{{- end -}}
{{- $ephemeral := (include "eric-adp-gui-aggregator-service.authz-proxy-authzproxy-requests-ephemeral" .) -}}
{{- if ne $ephemeral "" -}}
   {{- $resources := merge $resources (dict "ericsecoauthproxy" (dict "requests" (dict "ephemeral-storage" $ephemeral))) -}}
{{- end -}}
{{- $ephemeral := (include "eric-adp-gui-aggregator-service.authz-proxy-authzproxy-limits-ephemeral" .) -}}
{{- if ne $ephemeral "" -}}
   {{- $resources := merge $resources (dict "ericsecoauthproxy" (dict "limits" (dict "ephemeral-storage" $ephemeral))) -}}
{{- end -}}
{{- $resources | toJson -}}
{{- end -}}


{{/*
Authorization Proxy (sap) init container resource requests and limits
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-sap-resources" -}}
{{- $resources := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-resources" .) -}}
requests:
  {{- if ((($resources).ericsecoauthsap).requests).cpu }}
  cpu: {{ $resources.ericsecoauthsap.requests.cpu | quote }}
  {{- end }}
  {{- if ((($resources).ericsecoauthsap).requests).memory }}
  memory: {{ $resources.ericsecoauthsap.requests.memory | quote }}
  {{- end }}
  {{- if (($resources).ericsecoauthsap).requests }}
  {{- if index $resources.ericsecoauthsap.requests "ephemeral-storage" }}
  ephemeral-storage: {{ index $resources.ericsecoauthsap.requests "ephemeral-storage" | quote }}
  {{- end }}
  {{- end }}
limits:
  {{- if ((($resources).ericsecoauthsap).limits).cpu }}
  cpu: {{ $resources.ericsecoauthsap.limits.cpu | quote }}
  {{- end }}
  {{- if ((($resources).ericsecoauthsap).limits).memory }}
  memory: {{ $resources.ericsecoauthsap.limits.memory | quote }}
  {{- end }}
  {{- if (($resources).ericsecoauthsap).limits }}
  {{- if index $resources.ericsecoauthsap.limits "ephemeral-storage" }}
  ephemeral-storage: {{ index $resources.ericsecoauthsap.limits "ephemeral-storage" | quote }}
  {{- end }}
  {{- end }}
{{- end -}}

{{/*
Authorization Proxy sidecar container resource requests and limits
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-sidecar-resources" -}}
{{- $resources := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-resources" .) -}}
requests:
  {{- if ((($resources).ericsecoauthproxy).requests).cpu }}
  cpu: {{ $resources.ericsecoauthproxy.requests.cpu | quote }}
  {{- end }}
  {{- if ((($resources).ericsecoauthproxy).requests).memory }}
  memory: {{ $resources.ericsecoauthproxy.requests.memory | quote }}
  {{- end }}
  {{- if (($resources).ericsecoauthproxy).requests }}
  {{- if index $resources.ericsecoauthproxy.requests "ephemeral-storage" }}
  ephemeral-storage: {{ index $resources.ericsecoauthproxy.requests "ephemeral-storage" | quote }}
  {{- end }}
  {{- end }}
limits:
  {{- if ((($resources).ericsecoauthproxy).limits).cpu }}
  cpu: {{ $resources.ericsecoauthproxy.limits.cpu | quote }}
  {{- end }}
  {{- if ((($resources).ericsecoauthproxy).limits).memory }}
  memory: {{ $resources.ericsecoauthproxy.limits.memory | quote }}
  {{- end }}
  {{- if (($resources).ericsecoauthproxy).limits }}
  {{- if index $resources.ericsecoauthproxy.limits "ephemeral-storage" }}
  ephemeral-storage: {{ index $resources.ericsecoauthproxy.limits "ephemeral-storage" | quote }}
  {{- end }}
  {{- end }}
{{- end -}}

{{/*
Is IAM Server's sip-oauth2 API used for creating SAP client or not.
*/}}
{{- define "eric-adp-gui-aggregator-service.sap-cli-used" -}}
{{- $sipOauth2Beta      := .Capabilities.APIVersions.Has "iam.sec.ericsson.com/v1beta1/InternalOAuth2Identity" -}}
{{- $authorizationProxy := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-values" .) -}}
{{- if and $authorizationProxy.sipoauth2.enabled $sipOauth2Beta }}
true
{{- else }}
{{- end -}}
{{- end -}}

{{/*
The name of the SAP client in IAM Server.
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-sap-cli-name" -}}
{{- printf "%s-%s" (include "eric-adp-gui-aggregator-service.authz-proxy-service-name" .) "iam-sap-cli" -}}
{{- end -}}


{{/*
Define the apparmor annotation creation based on input profile and container name
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-getApparmorAnnotation" -}}
{{- $profile := index . "profile" -}}
{{- $containerName := index . "ContainerName" -}}
{{- if $profile.type -}}
{{- if eq "runtime/default" (lower $profile.type) }}
container.apparmor.security.beta.kubernetes.io/{{ $containerName }}: "runtime/default"
{{- else if eq "unconfined" (lower $profile.type) }}
container.apparmor.security.beta.kubernetes.io/{{ $containerName }}: "unconfined"
{{- else if eq "localhost" (lower $profile.type) }}
{{- if $profile.localhostProfile }}
{{- $localhostProfileList := (splitList "/" $profile.localhostProfile) -}}
{{- if (last $localhostProfileList) }}
container.apparmor.security.beta.kubernetes.io/{{ $containerName }}: "localhost/{{ (last $localhostProfileList ) }}"
{{- end }}
{{- end }}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Define the apparmor annotation for authorization proxy SAP Init container
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-sap-container.appArmorAnnotations" -}}
{{- if .Values.appArmorProfile -}}
{{- $profile := .Values.appArmorProfile -}}
{{- if index .Values.appArmorProfile "ericsecoauthsap" -}}
{{- if (index .Values.appArmorProfile "ericsecoauthsap").type -}}
{{- $profile = index .Values.appArmorProfile "ericsecoauthsap" }}
{{- end -}}
{{- end -}}
{{- include "eric-adp-gui-aggregator-service.authz-proxy-getApparmorAnnotation" (dict "profile" $profile "ContainerName" "ericsecoauthsap") }}
{{- end -}}
{{- end -}}

{{/*
Define the apparmor annotation for authorization proxy server container
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-container.appArmorAnnotations" -}}
{{- if .Values.appArmorProfile -}}
{{- $profile := .Values.appArmorProfile }}
{{- if index .Values.appArmorProfile "ericsecoauthproxy" -}}
{{- if (index .Values.appArmorProfile "ericsecoauthproxy").type -}}
{{- $profile = index .Values.appArmorProfile "ericsecoauthproxy" }}
{{- end -}}
{{- end -}}
{{- include "eric-adp-gui-aggregator-service.authz-proxy-getApparmorAnnotation" (dict "profile" $profile "ContainerName" "ericsecoauthproxy") }}
{{- end -}}
{{- end -}}

{{/*
Define the seccomp security context creation based on input profile (no container name needed since it is already in the containers security profile)
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-getSeccompSecurityContext" -}}
{{- $profile := index . "profile" -}}
{{- if $profile.type -}}
{{- if eq "runtimedefault" (lower $profile.type) }}
seccompProfile:
  type: RuntimeDefault
{{- else if eq "unconfined" (lower $profile.type) }}
seccompProfile:
  type: Unconfined
{{- else if eq "localhost" (lower $profile.type) }}
seccompProfile:
  type: Localhost
  localhostProfile: {{ $profile.localhostProfile }}
{{- end }}
{{- end -}}
{{- end -}}

{{/*
Define the seccomp security context for authorization proxy SAP Init container
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-sap-container.seccompProfile" -}}
{{- if .Values.seccompProfile }}
{{- $profile := .Values.seccompProfile }}
{{- if index .Values.seccompProfile "ericsecoauthsap" }}
{{- if (index .Values.seccompProfile "ericsecoauthsap").type }}
{{- $profile = index .Values.seccompProfile "ericsecoauthsap" }}
{{- end }}
{{- end }}
{{- include "eric-adp-gui-aggregator-service.authz-proxy-getSeccompSecurityContext" (dict "profile" $profile) }}
{{- end -}}
{{- end -}}

{{/*
Define the seccomp security context for authorization proxy server container
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-container.seccompProfile" -}}
{{- if .Values.seccompProfile }}
{{- $profile := .Values.seccompProfile }}
{{- if index .Values.seccompProfile "ericsecoauthproxy" }}
{{- if (index .Values.seccompProfile "ericsecoauthproxy").type }}
{{- $profile = index .Values.seccompProfile "ericsecoauthproxy" }}
{{- end }}
{{- end }}
{{- include "eric-adp-gui-aggregator-service.authz-proxy-getSeccompSecurityContext" (dict "profile" $profile) }}
{{- end -}}
{{- end -}}


{{/*
Authorization Proxy SAP init container spec
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-sap-container.spec" -}}
{{- $authorizationProxy := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-values" .) -}}
{{- $logStream := eq (include "eric-adp-gui-aggregator-service.log-streaming-activated" .) "true" -}}
{{- $logStdout := eq (include "eric-adp-gui-aggregator-service.log-stdout-activated" .) "true" -}}
{{- if $authorizationProxy.enabled }}
{{- $global            := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-global" .) -}}
{{- $sapClientUsed     := include "eric-adp-gui-aggregator-service.sap-cli-used" . -}}
- name: ericsecoauthsap
  image: {{ template "eric-adp-gui-aggregator-service.authz-proxy-sap-imagePath" . }}
  imagePullPolicy: {{ template "eric-adp-gui-aggregator-service.authz-proxy-sap-imagePullPolicy" . }}
  command: ["catatonit", "--"]
  args: ["/sap/sap.py"]
  securityContext:
    allowPrivilegeEscalation: false
    privileged: false
    readOnlyRootFilesystem: true
    runAsNonRoot: true
{{- include "eric-adp-gui-aggregator-service.authz-proxy-sap-container.seccompProfile" . | indent 4 }}
    capabilities:
      drop:
        - ALL
  resources:
{{ include "eric-adp-gui-aggregator-service.authz-proxy-sap-resources" . | indent 4 }}
  env:
  - name: ERIC_SEC_SAP_TIMEOUT
    value: {{ $authorizationProxy.iamRequestTimeout | quote }}
  - name: SERVICE_NAME
    value: {{ template "eric-adp-gui-aggregator-service.authz-proxy-service-name" . }}
  - name: LOG_STDOUT
    #In case the "direct" is configured, init container has to use the dual. Meaning init container will always logs to stdout
    value: "ENABLED"
  - name: LOG_STREAM
    {{- if $logStream }}
    value: "ENABLED"
    {{- else }}
    value: "DISABLED"
    {{- end }}
  - name: LOG_LEVEL
    value: {{ .Values.logLevel | default "info" | quote }}
  - name: LOG_TRANSFORMER_HOST
    value: {{ $authorizationProxy.authzLog.logtransformer.host | quote }}
  - name: ERIC_SEC_AUTHZ_PROXY_TLS
    {{- if $global.security.tls.enabled }}
    value: "ENABLED"
    {{- else }}
    value: "DISABLED"
    {{- end }}
  - name: ERIC_SEC_AUTHZ_PROXY_IAM_REALM_NAME
    value: {{ $authorizationProxy.adpIamRealm }}
  - name: ERIC_SEC_AUTHZ_PROXY_IAM_INT_ROOT_URI
    value: {{ printf "%s-%s" $authorizationProxy.adpIamServiceName "http" }}
  - name: ERIC_SEC_AUTHZ_PROXY_IAM_DEFAULT_PORT
    value: {{ template "eric-adp-gui-aggregator-service.authz-proxy-iam-int-port" . }}
  - name: ERIC_SEC_AUTHZ_PROXY_IAM_SECONDARY_PORT
    value: {{ $authorizationProxy.adpIamAdminConsolePort | quote }}
  - name: ERIC_SEC_AUTHZ_PROXY_SP_NAME
    value: {{ template "eric-adp-gui-aggregator-service.authz-proxy-service-name" . }}
  - name: TZ
    value: {{ $global.timezone }}
  {{- if $sapClientUsed }}
  - name: IAM_AAPXY_SAP_CLIENT_NAME
    # Note: The value must match with the name of the InternalOAuth2Identity resource
    value: {{ template "eric-adp-gui-aggregator-service.authz-proxy-sap-cli-name" . }}
    {{- if not $global.security.tls.enabled }}
  - name: IAM_AAPXY_SAP_SECRET_FILE
    value: /run/secrets/{{ template "eric-adp-gui-aggregator-service.sapClientSecret" . }}/client-secret
    {{- end }}
  {{- else }}
  - name: IAM_ADMIN_USER_ID_FILE
    value: /run/secrets/iam-admin-creds/kcadminid
  - name: IAM_ADMIN_PASSWORD_FILE
    value: /run/secrets/iam-admin-creds/kcpasswd
  {{- end }}
  {{- if not $global.security.tls.enabled }}
  - name: CLIENT_SECRET_FILE
    value: /run/secrets/aa-proxy-client-secret/aapxysecret
  {{- end }}
  - name: ERIC_SEC_AUTHZ_PROXY_POD_NAME
    valueFrom:
      fieldRef:
        fieldPath: metadata.name
  - name: ERIC_SEC_AUTHZ_PROXY_NAMESPACE
    valueFrom:
      fieldRef:
        fieldPath: metadata.namespace
  - name: ERIC_SEC_AUTHZ_PROXY_CONTAINER_NAME
    value: "ericsecoauthsap"
  - name: ROOT_MOUNT_PATH
    value: "/run/secrets"
{{- if $global.security.tls.enabled }}
  - name: IAM_CLIENT_SECRET
    value: {{ include "eric-adp-gui-aggregator-service.iamClientSecret" . | quote }}
  - name: ROOT_CA_SECRET
    value: {{ include "eric-adp-gui-aggregator-service.rootCaSecret" . | quote }}
  {{- if $logStream }}
  - name: LT_CLIENT_SECRET
    value: {{ include "eric-adp-gui-aggregator-service.ltClientSecret" . | quote }}
  {{- end }}
{{- end }}
{{- if $sapClientUsed }}
  {{- if $global.security.tls.enabled }}
  - name: SAP_CLIENT_CERT
    value: {{ include "eric-adp-gui-aggregator-service.sapClientCert" . | quote }}
  {{- else }}
  - name: SAP_CLIENT_SECRET
    value: {{ include "eric-adp-gui-aggregator-service.sapClientSecret" . | quote }}
  {{- end }}
{{- else }}
  - name: IAM_ADMIN_SECRET
    value: {{ include "eric-adp-gui-aggregator-service.iamAdminSecret" . | quote }}
{{- end }}
  volumeMounts:
  - name: ericsecoauthsap-tmp
    mountPath: "/tmp"
  - name: ericsecoauthproxy-logs
    mountPath: "/logs"
  - name: authz-proxy-authorizationrules
    mountPath: /sap/config
    readOnly: true
{{- if $global.security.tls.enabled }}
  - name: authz-proxy-iam-client-certificates
    mountPath: /run/secrets/{{ template "eric-adp-gui-aggregator-service.iamClientSecret" . }}
  - name: authz-proxy-sip-tls-root-ca
    mountPath: /run/secrets/{{ template "eric-adp-gui-aggregator-service.rootCaSecret" . }}
  {{- if $logStream }}
  - name: authz-proxy-lt-client-certificates
    mountPath: /run/secrets/{{ template "eric-adp-gui-aggregator-service.ltClientSecret" . }}
  {{- end }}
{{- else }}
  - name: authz-proxy-client-secret
    mountPath: /run/secrets/aa-proxy-client-secret
{{- end }}
{{- if $sapClientUsed }}
  {{- if $global.security.tls.enabled }}
  - name: authz-proxy-iam-sap-client-certificates
    mountPath: /run/secrets/{{ template "eric-adp-gui-aggregator-service.sapClientCert" . }}
  {{- else }}
  - name: authz-proxy-sap-client-secret
    mountPath: /run/secrets/{{ template "eric-adp-gui-aggregator-service.sapClientSecret" . }}
  {{- end }}
{{- else }}
  - name: authz-proxy-admin-creds
    mountPath: /run/secrets/iam-admin-creds
{{- end }}
{{- end }}
{{- end -}}

{{/*
Authorization Proxy sidecar container spec
The container port number can be changed by adding parameter ".Values.authorizationProxy.port"
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-container.spec" -}}
{{- $authorizationProxy := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-values" .) -}}
{{- $logStream := eq (include "eric-adp-gui-aggregator-service.log-streaming-activated" .) "true" -}}
{{- $logStdout := eq (include "eric-adp-gui-aggregator-service.log-stdout-activated" .) "true" -}}
{{- if $authorizationProxy.enabled }}
{{- $global           := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-global" .) -}}
{{- $probes           := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-probes" .) -}}
{{- $timeoutStartup   := sub $probes.ericsecoauthproxy.startupProbe.timeoutSeconds 1 | quote -}}
{{- $timeoutLiveness  := sub $probes.ericsecoauthproxy.livenessProbe.timeoutSeconds 1 | quote -}}
{{- $timeoutReadiness := sub $probes.ericsecoauthproxy.readinessProbe.timeoutSeconds 1 | quote -}}
{{- $probeProxyPort   := sub $authorizationProxy.port 1 -}}
{{- $metricProxyPort  := sub $authorizationProxy.port 2 -}}
{{- $isAuthzServerTls := and $global.security.tls.enabled (ne $authorizationProxy.service.endpoints.authorizationProxy.tls.enforced "optional") -}}
- name: ericsecoauthproxy
  image: {{ template "eric-adp-gui-aggregator-service.authz-proxy-proxy-imagePath" . }}
  imagePullPolicy: {{ template "eric-adp-gui-aggregator-service.authz-proxy-proxy-imagePullPolicy" . }}
  command: ["catatonit", "--"]
  args: ["/authorization-proxy/authz_proxy_server.py"]
  securityContext:
    allowPrivilegeEscalation: false
    privileged: false
    readOnlyRootFilesystem: true
    runAsNonRoot: true
{{- include "eric-adp-gui-aggregator-service.authz-proxy-container.seccompProfile" . | indent 4 }}
    capabilities:
      drop:
        - ALL
  startupProbe:
    httpGet:
      path: /health/startup
      port: {{ $probeProxyPort }}
    initialDelaySeconds: {{ $probes.ericsecoauthproxy.startupProbe.initialDelaySeconds }}
    failureThreshold: {{ $probes.ericsecoauthproxy.startupProbe.failureThreshold }}
    timeoutSeconds: {{ $probes.ericsecoauthproxy.startupProbe.timeoutSeconds }}
    periodSeconds: {{ $probes.ericsecoauthproxy.startupProbe.periodSeconds }}
  livenessProbe:
    httpGet:
      path: /health/liveness
      port: {{ $probeProxyPort }}
    initialDelaySeconds: {{ $probes.ericsecoauthproxy.livenessProbe.initialDelaySeconds }}
    timeoutSeconds: {{ $probes.ericsecoauthproxy.livenessProbe.timeoutSeconds }}
    failureThreshold: {{ $probes.ericsecoauthproxy.livenessProbe.failureThreshold }}
    periodSeconds: {{ $probes.ericsecoauthproxy.livenessProbe.periodSeconds }}
  readinessProbe:
    httpGet:
      path: /health/readiness
      port: {{ $probeProxyPort }}
    initialDelaySeconds: {{ $probes.ericsecoauthproxy.readinessProbe.initialDelaySeconds }}
    timeoutSeconds: {{ $probes.ericsecoauthproxy.readinessProbe.timeoutSeconds }}
    failureThreshold: {{ $probes.ericsecoauthproxy.readinessProbe.failureThreshold }}
    successThreshold: {{ $probes.ericsecoauthproxy.readinessProbe.successThreshold }}
    periodSeconds: {{ $probes.ericsecoauthproxy.readinessProbe.periodSeconds }}
  resources:
{{ include "eric-adp-gui-aggregator-service.authz-proxy-sidecar-resources" . | indent 4 }}
  env:
  - name: HTTP_PROBE_PORT
    value: {{ $probeProxyPort | quote }}
  - name: HTTP_PROBE_LOG_LEVEL
    value: {{ .Values.logLevel | default "info" | quote }}
  - name: HTTP_PROBE_SERVICE_NAME
    value: {{ template "eric-adp-gui-aggregator-service.authz-proxy-service-name" . }}
  - name: HTTP_PROBE_CONTAINER_NAME
    value: "ericsecoauthproxy"
  - name: HTTP_PROBE_POD_NAME
    valueFrom:
      fieldRef:
        fieldPath: metadata.name
  - name: HTTP_PROBE_NAMESPACE
    valueFrom:
      fieldRef:
        fieldPath: metadata.namespace
  - name: HTTP_PROBE_STARTUP_CMD_TIMEOUT_SEC
    value: {{ $timeoutStartup }}
  - name: HTTP_PROBE_READINESS_CMD_TIMEOUT_SEC
    value: {{ $timeoutReadiness }}
  - name: HTTP_PROBE_LIVENESS_CMD_TIMEOUT_SEC
    value: {{ $timeoutLiveness }}
  - name: HTTP_PROBE_CMD_DIR
    value: "/authorization-proxy"
  - name: STARTUP_PROBE_PATH
    value: "/authzproxy/watchdog"
  - name: LIVENESS_PROBE_PATH
    value: "/authzproxy/watchdog"
  - name: READINESS_PROBE_PATH
    value: "/authzproxy/readiness"
  - name: ERIC_SEC_AUTHZ_RPT_TIMEOUT
    value: {{ $authorizationProxy.iamRequestTimeout | quote }}
  - name: ERIC_SEC_AUTHZ_SP_TIMEOUT
    value: {{ $authorizationProxy.spRequestTimeout | quote }}
  - name: ERIC_SEC_COUNTER_PREFIX
    value: {{ $authorizationProxy.counterPrefix | quote }}
  - name: ERIC_SEC_AUTHZ_PROXY_NODE_ID
    value: {{ $global.oamNodeID | quote }}
  - name: FLASK_ENV
    value: "production"
  - name: SERVICE_NAME
    value: {{ template "eric-adp-gui-aggregator-service.authz-proxy-service-name" . }}
  - name: LOG_STDOUT
    {{- if $logStdout }}
    value: "ENABLED"
    {{- else }}
    value: "DISABLED"
    {{- end }}
  - name: LOG_STREAM
    {{- if $logStream }}
    value: "ENABLED"
    {{- else }}
    value: "DISABLED"
    {{- end }}
  - name: LOG_LEVEL
    value: {{ .Values.logLevel | default "info" | quote }}
  - name: LOG_TRANSFORMER_HOST
    value: {{ $authorizationProxy.authzLog.logtransformer.host | quote }}
  - name: ERIC_SEC_AUTHZ_PROXY_TLS
    {{- if $global.security.tls.enabled }}
    value: "ENABLED"
    {{- else }}
    value: "DISABLED"
    {{- end }}
  - name: ERIC_SEC_AUTHZ_METRICS
    {{- if $authorizationProxy.metrics.enabled }}
    value: "ENABLED"
    {{- else }}
    value: "DISABLED"
    {{- end }}
  - name: ERIC_SEC_AUTHZ_PROXY_SERVER_TLS
    {{- if $isAuthzServerTls }}
    value: "ENABLED"
    {{- else }}
    value: "DISABLED"
    {{- end }}
  - name: ERIC_SEC_AUTHZ_PROXY_VERIFY_CLIENT
    value: {{ $authorizationProxy.service.endpoints.authorizationProxy.tls.verifyClientCertificate }}
  - name: ERIC_SEC_AUTHZ_PROXY_GUNICORN_WORKERS
    value: {{ $authorizationProxy.numOfWebServerWorkers | quote }}
  - name: ERIC_SEC_AUTHZ_PROXY_IAM_REALM_NAME
    value: {{ $authorizationProxy.adpIamRealm | quote }}
  - name: ERIC_SEC_AUTHZ_PROXY_IAM_INT_ROOT_URI
    value: {{ printf "%s-%s" $authorizationProxy.adpIamServiceName "http" }}
  - name: ERIC_SEC_AUTHZ_PROXY_IAM_DEFAULT_PORT
    value: {{ template "eric-adp-gui-aggregator-service.authz-proxy-iam-int-port" . }}
  - name: ERIC_SEC_AUTHZ_PROXY_IAM_SECONDARY_PORT
    value: {{ $authorizationProxy.adpIamAdminConsolePort | quote }}
  - name: ERIC_SEC_AUTHZ_PROXY_PORT
    value: {{ $authorizationProxy.port | quote }}
  - name: ERIC_SEC_AUTHZ_PROXY_METRIC_PORT
    value: {{  $metricProxyPort | quote }}
  - name: ERIC_SEC_AUTHZ_PROXY_LOCALHOST_SERVICE_URI
    value: "http://localhost:{{ $authorizationProxy.localSpPort }}"
  - name: ERIC_SEC_AUTHZ_PROXY_SP_NAME
    value: {{ template "eric-adp-gui-aggregator-service.authz-proxy-service-name" . }}
    {{- if $authorizationProxy.localSpClientCertVolumeName }}
  - name: ERIC_SEC_AUTHZ_PROXY_SP_TLS_CERTS
    value: /run/secrets/{{ template "eric-adp-gui-aggregator-service.localSpClientSecret" . }}
    {{- end }}
  - name: ROOT_MOUNT_PATH
    value: "/run/secrets"
{{- if $isAuthzServerTls }}
  - name: AUTHZ_PROXY_SERVER_SECRET
    value: {{ include "eric-adp-gui-aggregator-service.serverSecret" . | quote }}
  - name: AUTHZ_PROXY_CA_SECRET
    value: {{ include "eric-adp-gui-aggregator-service.iccrCaSecret" . | quote }}
{{- end }}
{{- if $global.security.tls.enabled }}
  - name: IAM_CLIENT_SECRET
    value: {{ include "eric-adp-gui-aggregator-service.iamClientSecret" . | quote }}
  # After the deprecation to end misuse of IAM's internal CA, remove the old CA that APO2 is misusing
  - name: IAM_CA_SECRET
    value: {{ include "eric-adp-gui-aggregator-service.iamClientCaSecret" . | quote }}
{{- if $isAuthzServerTls }}
  - name: PROBE_CLIENT_SECRET
    value: {{ include "eric-adp-gui-aggregator-service.authzProxyProbeClientSecret" . | quote }}
  - name: PROBE_CA_SECRET
    value: {{ include "eric-adp-gui-aggregator-service.authzProxyProbeCaSecret" . | quote }}
{{- end }}
    {{- if $logStream }}
  - name: LT_CLIENT_SECRET
    value: {{ include "eric-adp-gui-aggregator-service.ltClientSecret" . | quote }}
    {{- end }}
  - name: ROOT_CA_SECRET
    value: {{ include "eric-adp-gui-aggregator-service.rootCaSecret" . | quote }}
  - name: PMS_CA_SECRET
    value: {{ include "eric-adp-gui-aggregator-service.pmsCaSecret" . | quote }}
{{- end }}
  - name: TZ
    value: {{ $global.timezone }}
  - name: ERIC_SEC_AUTHZ_PROXY_POD_NAME
    valueFrom:
      fieldRef:
        fieldPath: metadata.name
  - name: ERIC_SEC_AUTHZ_PROXY_NAMESPACE
    valueFrom:
      fieldRef:
        fieldPath: metadata.namespace
  - name: ERIC_SEC_AUTHZ_PROXY_CONTAINER_NAME
    value: "ericsecoauthproxy"
  ports:
  - containerPort: {{ $authorizationProxy.port }}
    name: http-apo2
  - containerPort: {{ $metricProxyPort }}
    {{- if $isAuthzServerTls }}
    name: https-metrics
    {{- else }}
    name: http-metrics
    {{- end }}
  volumeMounts:
  - name: ericsecoauthproxy-tmp
    mountPath: "/tmp"
  - name: ericsecoauthproxy-logs
    mountPath: "/logs"
  - name: ericsecoauthproxy-gunicorn
    mountPath: "/run/gunicorn"
  - name: ericsecoauthproxy-metricserver
    mountPath: "/run/gunicorn-metric"
  - name: ericsecoauthproxy-metrics
    mountPath: "/run/metrics"
{{- if $isAuthzServerTls }}
  - name: authz-proxy-server-certificates
    mountPath: /run/secrets/{{ template "eric-adp-gui-aggregator-service.serverSecret" . }}
  - name: authz-proxy-iccr-client-ca-certificate
    mountPath: /run/secrets/{{ template "eric-adp-gui-aggregator-service.iccrCaSecret" . }}
{{- end }}
{{- if $global.security.tls.enabled }}
  - name: authz-proxy-iam-client-certificates
    mountPath: /run/secrets/{{ template "eric-adp-gui-aggregator-service.iamClientSecret" . }}
  # After the deprecation to end misuse of IAM's internal CA, authz-proxy-iam-ca-certificates will be removed
  - name: authz-proxy-iam-ca-certificates
    mountPath: /run/secrets/{{ template "eric-adp-gui-aggregator-service.iamClientCaSecret" . }}
{{- if $isAuthzServerTls }}
  - name: authz-proxy-probe-client-certificates
    mountPath: /run/secrets/{{ template "eric-adp-gui-aggregator-service.authzProxyProbeClientSecret" . }}
  - name: authz-proxy-probe-ca-certificates
    mountPath: /run/secrets/{{ template "eric-adp-gui-aggregator-service.authzProxyProbeCaSecret" . }}
{{- end }}
    {{- if $logStream }}
  - name: authz-proxy-lt-client-certificates
    mountPath: /run/secrets/{{ template "eric-adp-gui-aggregator-service.ltClientSecret" . }}
    {{- end }}
  - name: authz-proxy-sip-tls-root-ca
    mountPath: /run/secrets/{{ template "eric-adp-gui-aggregator-service.rootCaSecret" . }}
  - name: authz-proxy-pm-server-ca
    mountPath: /run/secrets/{{ template "eric-adp-gui-aggregator-service.pmsCaSecret" . }}
    {{- if $authorizationProxy.localSpClientCertVolumeName }}
  - name: {{ $authorizationProxy.localSpClientCertVolumeName | quote }}
    mountPath: /run/secrets/{{ template "eric-adp-gui-aggregator-service.localSpClientSecret" . }}
    {{- end }}
{{- else }}
  - name: authz-proxy-client-secret
    mountPath: /run/secrets/aa-proxy-client-secret
{{- end }}
{{- end }}
{{- end }}

{{/*
Authorization Proxy volumes, contains the certificates for ingress, log transformer and IAM communication
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-volume.spec" -}}
{{- $authorizationProxy := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-values" .) -}}
{{- $logStream := eq (include "eric-adp-gui-aggregator-service.log-streaming-activated" .) "true" -}}
{{- $logStdout := eq (include "eric-adp-gui-aggregator-service.log-stdout-activated" .) "true" -}}
{{- if $authorizationProxy.enabled }}
{{- $global             := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-global" .) -}}
{{- $isAuthzServerTls   := and $global.security.tls.enabled (ne $authorizationProxy.service.endpoints.authorizationProxy.tls.enforced "optional") -}}
{{- $sapClientUsed      := include "eric-adp-gui-aggregator-service.sap-cli-used" . -}}
- name: ericsecoauthsap-tmp
  emptyDir:
    sizeLimit: "10Mi"
    medium: "Memory"
- name: ericsecoauthproxy-tmp
  emptyDir:
    sizeLimit: "10Mi"
    medium: "Memory"
- name: ericsecoauthproxy-logs
  emptyDir:
    sizeLimit: "10Mi"
    medium: "Memory"
- name: ericsecoauthproxy-gunicorn
  emptyDir:
    sizeLimit: "10Mi"
    medium: "Memory"
- name: ericsecoauthproxy-metricserver
  emptyDir:
    sizeLimit: "10Mi"
    medium: "Memory"
- name: ericsecoauthproxy-metrics
  emptyDir:
    medium: "Memory"
- name: authz-proxy-authorizationrules
  configMap:
    name: {{ template "eric-adp-gui-aggregator-service.authz-proxy-service-name" . }}-authorizationrules

{{- if $global.security.tls.enabled }}
- name: authz-proxy-iam-client-certificates
  secret:
    secretName: {{ template "eric-adp-gui-aggregator-service.iamClientSecret" . }}
    optional: true
{{- if $isAuthzServerTls }}
- name: authz-proxy-probe-ca-certificates
  secret:
    secretName: {{ template "eric-adp-gui-aggregator-service.authzProxyProbeCaSecret" . }}
    optional: true
- name: authz-proxy-probe-client-certificates
  secret:
    secretName: {{ template "eric-adp-gui-aggregator-service.authzProxyProbeClientSecret" . }}
    optional: true
{{- end }}
- name: authz-proxy-sip-tls-root-ca
  secret:
    secretName: {{ template "eric-adp-gui-aggregator-service.rootCaSecret" . }}
    optional: true
# After the deprecation to end misuse of IAM's internal CA, authz-proxy-iam-ca-certificates will be removed
- name: authz-proxy-iam-ca-certificates
  secret:
    secretName: {{ template "eric-adp-gui-aggregator-service.iamClientCaSecret" . }}
    optional: true
  {{- if $sapClientUsed }}
- name: authz-proxy-iam-sap-client-certificates
  secret:
    secretName: {{ template "eric-adp-gui-aggregator-service.sapClientCert" . }}
    optional: true
  {{- else }}
- name: authz-proxy-admin-creds
  secret:
    secretName: {{ template "eric-adp-gui-aggregator-service.iamAdminSecret" . }}
    optional: true
  {{- end }}
  {{- if $logStream }}
- name: authz-proxy-lt-client-certificates
  secret:
    secretName: {{ template "eric-adp-gui-aggregator-service.ltClientSecret" . }}
    optional: true
  {{- end }}
- name: authz-proxy-pm-server-ca
  secret:
    secretName: {{ template "eric-adp-gui-aggregator-service.pmsCaSecret" . }}
    optional: true
{{- else }}
- name: authz-proxy-client-secret
  secret:
    secretName: {{ $authorizationProxy.adpIamClientCredentialSecret }}
  {{- if $sapClientUsed }}
- name: authz-proxy-sap-client-secret
  secret:
    secretName: {{ template "eric-adp-gui-aggregator-service.sapClientSecret" . }}
  {{- else }}
- name: authz-proxy-admin-creds
  secret:
    secretName: {{ template "eric-adp-gui-aggregator-service.iamAdminSecret" . }}
  {{- end }}
{{- end }}
{{- if $isAuthzServerTls }}
- name: authz-proxy-server-certificates
  secret:
    secretName: {{ template "eric-adp-gui-aggregator-service.serverSecret" . }}
    optional: true
- name: authz-proxy-iccr-client-ca-certificate
  secret:
    secretName: {{ template "eric-adp-gui-aggregator-service.iccrCaSecret" . }}
    optional: true
{{- end }}
{{- end -}}
{{- end -}}

{{/*
Authorization Proxy HTTPProxy ingress conditional routing.

The template can only be included from "routes:" yaml element in ICCR HTTPproxy resource.
The resource paths that require authorization must be listed in Values file:
authorizationProxy:protected_paths
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-ingress-routes" -}}
{{- $authorizationProxy := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-values" .) -}}
{{- $global := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-global" .) -}}
{{- $isAuthzServerTls := and $global.security.tls.enabled (ne $authorizationProxy.service.endpoints.authorizationProxy.tls.enforced "optional") -}}
{{- if $authorizationProxy.enabled }}
{{- $dot :=  . -}}
{{- $authzServicePort := 8080 -}}
# ----------------------------------------------------------------------
# Authorization proxy specific routing conditions start
# ----------------------------------------------------------------------
{{- range $authorizationProxy.protectedPaths }}
# Conditions for .Values.authorizationProxy.protectedPath: {{ . }}:
# If cookie exists:
- conditions:
  - prefix: {{ . }}
  - header:
      name: Cookie
      contains: eric.adp.authz.proxy.token
  services:
  - name: {{ template "eric-adp-gui-aggregator-service.authz-proxy-service-name" $dot }}
    port: {{ $authzServicePort }}
{{- if $isAuthzServerTls }}
    protocol: tls
    validation:
      caSecret: {{ template "eric-adp-gui-aggregator-service.rootCaSecret" $dot }}
      subjectName: {{ template "eric-adp-gui-aggregator-service.authz-proxy-service-name" $dot }}
{{- end }}
# If bearer token exists in authorization header:
- conditions:
  - prefix: {{ . }}
  - header:
      name: Authorization
      contains: Bearer
  services:
  - name: {{ template "eric-adp-gui-aggregator-service.authz-proxy-service-name" $dot }}
    port: {{ $authzServicePort }}
{{- if $isAuthzServerTls }}
    protocol: tls
    validation:
      caSecret: {{ template "eric-adp-gui-aggregator-service.rootCaSecret" $dot }}
      subjectName: {{ template "eric-adp-gui-aggregator-service.authz-proxy-service-name" $dot }}
{{- end }}
# No user identity found, route to authentication proxy for authentication:
- conditions:
  - prefix: {{ . }}
  services:
  - name: {{ $authorizationProxy.adpIamServiceName }}-authn
    port: 8080
{{- if $global.security.tls.enabled }}
    protocol: tls
    validation:
      caSecret: {{ template "eric-adp-gui-aggregator-service.rootCaSecret" $dot }}
      subjectName: {{ $authorizationProxy.adpIamServiceName }}-authn
{{- end }}
{{- end }}
# ----------------------------------------------------------------------
# Authorization proxy specific routing conditions ends
# ----------------------------------------------------------------------
{{- end -}}
{{- end -}}

{{/*
Authorization Proxy Log Transformer client TLS certificate

To be included by the sip-tls CR manifest that creates client certificate
that is used for mutual TLS between authorization proxy/sap and Log Transformer.
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-lt-client-cert-spec" -}}
{{- $authorizationProxy := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-values" .) -}}
{{- if $authorizationProxy.enabled }}
kubernetes:
  generatedSecretName: {{ template "eric-adp-gui-aggregator-service.ltClientSecret" . }}
  certificateName: clicert.pem
  privateKeyName: cliprivkey.pem
certificate:
  subject:
    cn: {{ template "eric-adp-gui-aggregator-service.authz-proxy-service-name" . }}
  issuer:
    reference: "{{ $authorizationProxy.authzLog.logtransformer.host }}-input-ca-cert"
  extendedKeyUsage:
    tlsServerAuth: false
    tlsClientAuth: true
{{- end }}
{{- end -}}

{{/*
Authorization Proxy probe client TLS certificate

To be included by the sip-tls CR manifest that creates client certificate
that is used for authorization proxy probe server.
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-probe-client-cert-spec" -}}
{{- $authorizationProxy := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-values" .) -}}
{{- if $authorizationProxy.enabled }}
kubernetes:
  generatedSecretName: {{ template "eric-adp-gui-aggregator-service.authzProxyProbeClientSecret" . }}
  certificateName: clicert.pem
  privateKeyName: cliprivkey.pem
certificate:
  subject:
    cn: {{ template "eric-adp-gui-aggregator-service.authz-proxy-service-name" . }}
  extendedKeyUsage:
    tlsServerAuth: false
    tlsClientAuth: true
  issuer:
    reference: {{ template "eric-adp-gui-aggregator-service.authzProxyProbeCaSecret" . }}
{{- end }}
{{- end -}}

{{/*
Authorization Proxy IAM client TLS certificate

To be included by the sip-tls CR manifest that creates client certificate
that is used for mutual TLS between authorization proxy/sap and IAM server.
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-client-cert-spec" -}}
{{- $authorizationProxy := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-values" .) -}}
{{- if $authorizationProxy.enabled }}
kubernetes:
  generatedSecretName: {{ template "eric-adp-gui-aggregator-service.iamClientSecret" . }}
  certificateName: clicert.pem
  privateKeyName: cliprivkey.pem
certificate:
  subject:
    cn: adp-iam-aa-client
  extendedKeyUsage:
    tlsServerAuth: false
    tlsClientAuth: true
  issuer:
    reference: {{ template "eric-adp-gui-aggregator-service.iamClientCaSecret" . }}
{{- end }}
{{- end -}}

{{/*
Authorization Proxy server certificate

To be included by the sip-tls CR manifest that creates server certificate
that is used for TLS between authorization proxy and ingress.
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-server-cert-spec" -}}
{{- $authorizationProxy := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-values" .) -}}
{{- if $authorizationProxy.enabled }}
kubernetes:
  generatedSecretName: {{ template "eric-adp-gui-aggregator-service.serverSecret" . }}
  certificateName: srvcert.pem
  privateKeyName: srvprivkey.pem
certificate:
  subject:
    cn: {{ template "eric-adp-gui-aggregator-service.authz-proxy-service-name" . }}
  subjectAlternativeName:
    dns:
      - certified-scrape-target
  extendedKeyUsage:
    tlsServerAuth: true
    tlsClientAuth: false
{{- end }}
{{- end -}}


{{/*
Authorization Proxy probe client ca

To be included by the sip-tls CR manifest that creates probe client ca
that is used for TLS probe server.

Use that CA to issue probe client certs, and use that CA to validate the client certs in gunicorn.
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-probe-client-ca-spec" -}}
{{- $authorizationProxy := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-values" .) -}}
{{- if $authorizationProxy.enabled }}
kubernetes:
  generatedSecretName: {{ template "eric-adp-gui-aggregator-service.authzProxyProbeCaSecret" . }}
  certificateName: client-cacertbundle.pem
certificate:
  subject:
    cn: {{ template "eric-adp-gui-aggregator-service.authz-proxy-service-name" . }}
{{- end }}
{{- end -}}

{{/*
Authorization Proxy IAM SAP client TLS certificate

To be included by the sip-tls CR manifest that creates SAP client certificate
that is used for mutual TLS between SAP and IAM server.
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-sap-cli-cert-spec" -}}
{{- $authorizationProxy := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-values" .) -}}
kubernetes:
  generatedSecretName: {{ template "eric-adp-gui-aggregator-service.sapClientCert" . }}
  certificateName: clicert.pem
  privateKeyName: cliprivkey.pem
certificate:
  subject:
    cn: {{ template "eric-adp-gui-aggregator-service.authz-proxy-sap-cli-name" . }}
  extendedKeyUsage:
    tlsServerAuth: false
    tlsClientAuth: true
  issuer:
    reference: {{ template "eric-adp-gui-aggregator-service.iamClientCaSecret" . }}
{{- end -}}

{{/*
Authorization Proxy IAM SAP client

To be included by the sip-oauth2 CR manifest that creates SAP client in IAM server.
(SAP uses this client when making configuration in IAM server)
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-sap-cli-spec" -}}
{{- $authorizationProxy := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-values" .) -}}
{{- $globals := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-global" .) -}}
realm: {{ $authorizationProxy.adpIamRealm }}
{{- if $globals.security.tls.enabled }}
internalCertificateDnRegex: CN={{ template "eric-adp-gui-aggregator-service.authz-proxy-sap-cli-name" . }}
{{- else }}
kubernetes:
  generatedSecretName: {{ template "eric-adp-gui-aggregator-service.sapClientSecret" . }}
{{- end }}
clientRoles:
  - clientId: realm-management
    roles:
      - query-groups
      - query-clients
      - manage-realm
      - manage-clients
      - manage-authorization
{{- end -}}

{{/*
  The template function that allows override root CA
*/}}
{{- define "eric-adp-gui-aggregator-service.rootCaSecret" -}}
  {{- $global := (.Values.global) | default dict }}
  {{- if (((((.Values.global).security).tls).trustedInternalRootCa).secret) -}}
     {{ (((((.Values.global).security).tls).trustedInternalRootCa).secret) }}
  {{- else -}}
    {{ printf "%s" "eric-sec-sip-tls-trusted-root-cert" }}
  {{- end -}}
{{- end -}}

{{/*
  The template function that returns the secret name of probe client
*/}}
{{- define "eric-adp-gui-aggregator-service.authzProxyProbeClientSecret" -}}
{{ template "eric-adp-gui-aggregator-service.authz-proxy-service-name" . }}-probe-client-cert
{{- end -}}

{{/*
  The template function that returns the secret name of probe client ca
*/}}
{{- define "eric-adp-gui-aggregator-service.authzProxyProbeCaSecret" -}}
{{ template "eric-adp-gui-aggregator-service.authz-proxy-service-name" . }}-probe-client-ca
{{- end -}}

{{/*
  The template function that returns the secret name of iam client
*/}}
{{- define "eric-adp-gui-aggregator-service.iamClientSecret" -}}
{{ template "eric-adp-gui-aggregator-service.authz-proxy-service-name" . }}-iam-client-cert
{{- end -}}

{{/*
  The template function that returns the secret name of iam CA
*/}}
{{- define "eric-adp-gui-aggregator-service.iamClientCaSecret" -}}
{{- $authorizationProxy := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-values" .) -}}
{{ $authorizationProxy.adpIamServiceName }}-iam-client-ca
{{- end -}}

{{/*
  The template function that returns the secret name of SAP client secret
*/}}
{{- define "eric-adp-gui-aggregator-service.sapClientSecret" -}}
{{ template "eric-adp-gui-aggregator-service.authz-proxy-service-name" . }}-sap-client-secret
{{- end -}}

{{/*
  The template function that returns the iam admin secret
*/}}
{{- define "eric-adp-gui-aggregator-service.iamAdminSecret" -}}
{{- $authorizationProxy := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-values" .) -}}
{{ $authorizationProxy.adpIamAdminSecret }}
{{- end -}}

{{/*
  The template function that returns the secret name of SAP client cert
*/}}
{{- define "eric-adp-gui-aggregator-service.sapClientCert" -}}
{{ template "eric-adp-gui-aggregator-service.authz-proxy-service-name" . }}-sap-client-cert
{{- end -}}

{{/*
  The template function that returns the secret name of Log Transformer
  client
*/}}
{{- define "eric-adp-gui-aggregator-service.ltClientSecret" -}}
{{ template "eric-adp-gui-aggregator-service.authz-proxy-service-name" . }}-lt-client-cert
{{- end -}}

{{/*
  The template function that returns the secret name of PMS CA
*/}}
{{- define "eric-adp-gui-aggregator-service.pmsCaSecret" -}}
{{- $authorizationProxy := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-values" .) -}}
{{ $authorizationProxy.adpPmServiceName }}-ca
{{- end -}}

{{/*
  The template function that returns the secret name of authz proxy
  server
*/}}
{{- define "eric-adp-gui-aggregator-service.serverSecret" -}}
{{ template "eric-adp-gui-aggregator-service.authz-proxy-service-name" . }}-server-cert
{{- end -}}

{{/*
  The template function that returns the secret name of ICCR client CA
*/}}
{{- define "eric-adp-gui-aggregator-service.iccrCaSecret" -}}
{{- $authorizationProxy := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-values" .) -}}
  {{- if $authorizationProxy.adpIccrCaSecret }}
    {{- $authorizationProxy.adpIccrCaSecret }}
  {{- else }}
    {{- $authorizationProxy.adpIccrServiceName }}-client-ca
  {{- end }}
{{- end -}}

{{/*
  The template function that returns the secret name of local sp cert
*/}}
{{- define "eric-adp-gui-aggregator-service.localSpClientSecret" -}}
{{- $authorizationProxy := fromJson (include "eric-adp-gui-aggregator-service.authz-proxy-values" .) -}}
{{ $authorizationProxy.localSpClientCertVolumeName }}
{{- end -}}


