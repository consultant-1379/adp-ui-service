{{/*
Create a map from ".Values.global" with defaults if missing in values file.
This hides defaults from values file.
*/}}
{{- define "eric-adp-gui-aggregator-service.global" -}}
  {{- $globalDefaults := dict "security" (dict "tls" (dict "enabled" true)) -}}
  {{- $globalDefaults := merge $globalDefaults (dict "security" (dict "tls" (dict "trustedInternalRootCa" (dict "secret" "eric-sec-sip-tls-trusted-root-cert")))) -}}
  {{- $globalDefaults := merge $globalDefaults (dict "security" (dict "policyBinding" (dict "create" false))) -}}
  {{- $globalDefaults := merge $globalDefaults (dict "securityPolicy" (dict "rolekind" "")) -}}
  {{- $globalDefaults := merge $globalDefaults (dict "registry" (dict "url" "armdocker.rnd.ericsson.se")) -}}
  {{- $globalDefaults := merge $globalDefaults (dict "registry" (dict "imagePullPolicy" "IfNotPresent")) -}}
  {{- $globalDefaults := merge $globalDefaults (dict "nodeSelector" (dict)) -}}
  {{- $globalDefaults := merge $globalDefaults (dict "timezone" "UTC") -}}
  {{- $globalDefaults := merge $globalDefaults (dict "log" (dict "streamingMethod" "dual")) -}}
  {{- $globalDefaults := merge $globalDefaults (dict "hosts" (dict "iam" "iam.ericsson.com")) -}}
  {{- $globalDefaults := merge $globalDefaults (dict "iam" (dict "cacert" (dict "secretName" "iam-cacert-secret" "key" "tls.crt"))) -}}
  {{- $globalDefaults := merge $globalDefaults (dict "tolerations" (list)) -}}
  {{- if .Values.global -}}
    {{- mergeOverwrite $globalDefaults .Values.global | toJson -}}
  {{- else -}}
    {{- $globalDefaults | toJson -}}
  {{- end -}}
{{- end -}}

{{/*
Create a dictionary to collect constant values.
*/}}
{{- define "eric-adp-gui-aggregator-service.constants" -}}
  {{- $constants := dict "cnomDashboardsNamespace" "GUI_AGGREGATOR_SERVICE" -}}
  {{- $constants | toJson -}}
{{- end -}}

{{/*
Expand the name of the chart.
*/}}
{{- define "eric-adp-gui-aggregator-service.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Generate the user account editor url
*/}}
{{- define "eric-adp-gui-aggregator-service.userAccountURL" -}}
{{- if .Values.configuration.userAccountURL }}
{{- print .Values.configuration.userAccountURL }}
{{- else if .Values.authorizationProxy.enabled }}
{{- printf "%s%s%s%s%s" "https://" .Values.authorizationProxy.keycloakFQDN "/auth/realms/" .Values.authorizationProxy.adpIamRealm "/account" }}
{{- else }}
{{- printf "" }}
{{- end }}
{{- end -}}

{{/*
Generate the logout url
*/}}
{{- define "eric-adp-gui-aggregator-service.logoutURL" -}}
{{- if .Values.configuration.logoutURL }}
{{- print .Values.configuration.logoutURL }}
{{- else if .Values.authorizationProxy.enabled }}
{{- printf "%s%s%s%s%s%s%s" "https://" .Values.authorizationProxy.keycloakFQDN "/auth/realms/" .Values.authorizationProxy.adpIamRealm "/protocol/openid-connect/logout?post_logout_redirect_uri=https%3A%2F%2F" .Values.authorizationProxy.authnProxyFQDN "%2Fadp-iam-auth-proxy%2Fauthenticate%2Flogout-done" }}
{{- else }}
{{- printf "#" }}
{{- end }}
{{- end -}}

{{/*
Create chart version as used by the chart label.
*/}}
{{- define "eric-adp-gui-aggregator-service.version" -}}
{{- printf "%s" .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "eric-adp-gui-aggregator-service.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create full path of main image.
*/}}
{{- define "eric-adp-gui-aggregator-service.mainImagePath" }}
    {{- $productInfo := fromYaml (.Files.Get "eric-product-info.yaml") -}}
    {{- $registryUrl := $productInfo.images.main.registry -}}
    {{- $repoPath := $productInfo.images.main.repoPath -}}
    {{- $name := $productInfo.images.main.name -}}
    {{- $tag := $productInfo.images.main.tag -}}
    {{- $global := fromJson (include "eric-adp-gui-aggregator-service.global" .) -}}
    {{- if $global.registry.url -}}
        {{- $registryUrl = $global.registry.url -}}
    {{- end -}}
    {{- if not (kindIs "invalid" $global.registry.repoPath) -}}
        {{- $repoPath = $global.registry.repoPath -}}
    {{- end -}}
    {{- if .Values.imageCredentials -}}
      {{- if not (kindIs "invalid" .Values.imageCredentials.repoPath) -}}
          {{- $repoPath = .Values.imageCredentials.repoPath -}}
      {{- end -}}
      {{- if .Values.imageCredentials.main -}}
        {{- if .Values.imageCredentials.main.registry -}}
          {{- if .Values.imageCredentials.main.registry.url -}}
              {{- $registryUrl = .Values.imageCredentials.main.registry.url -}}
          {{- end -}}
        {{- end -}}
        {{- if not (kindIs "invalid" .Values.imageCredentials.main.repoPath) -}}
            {{- $repoPath = .Values.imageCredentials.main.repoPath -}}
        {{- end -}}
        {{- if not (kindIs "invalid" .Values.imageCredentials.main.name) -}}
            {{- $name = .Values.imageCredentials.main.name -}}
        {{- end -}}
        {{- if not (kindIs "invalid" .Values.imageCredentials.main.tag) -}}
            {{- $tag = .Values.imageCredentials.main.tag -}}
        {{- end -}}
      {{- end -}}
    {{- end -}}
    {{- printf "%s/%s/%s:%s" $registryUrl $repoPath $name $tag -}}
{{- end -}}

{{/*
Create image pull secrets.
*/}}
{{- define "eric-adp-gui-aggregator-service.pullSecrets" -}}
{{- $global := fromJson (include "eric-adp-gui-aggregator-service.global" .) -}}
{{- if .Values.imageCredentials.pullSecret -}}
    {{- print .Values.imageCredentials.pullSecret -}}
{{- else if $global.pullSecret -}}
    {{- print $global.pullSecret -}}
{{- end -}}
{{- end -}}

{{/*
Create image pull policy.
*/}}
{{- define "eric-adp-gui-aggregator-service.registryImagePullPolicy" -}}
    {{- $global := fromJson (include "eric-adp-gui-aggregator-service.global" .) -}}
    {{- if .Values.imageCredentials.main.registry.imagePullPolicy -}}
      {{- print .Values.imageCredentials.main.registry.imagePullPolicy -}}
    {{- else -}}
      {{- print $global.registry.imagePullPolicy -}}
    {{- end -}}
{{- end -}}

{{/*
Create Ericsson product specific annotations.
*/}}
{{- define "eric-adp-gui-aggregator-service.product-info" }}
ericsson.com/product-name: {{ (fromYaml (.Files.Get "eric-product-info.yaml")).productName | quote }}
ericsson.com/product-number: {{ (fromYaml (.Files.Get "eric-product-info.yaml")).productNumber | quote }}
ericsson.com/product-revision: {{regexReplaceAll "(.*)[+].*" .Chart.Version "${1}" }}
{{- end -}}

{{/*
Merge user-defined annotations with product info (DR-D1121-065, DR-D1121-060)
*/}}
{{- define "eric-adp-gui-aggregator-service.annotations" -}}
  {{- $productInfoAnn := include "eric-adp-gui-aggregator-service.product-info" . | fromYaml -}}
  {{- $globalAnn := (.Values.global).annotations -}}
  {{- $serviceAnn := .Values.annotations -}}
  {{- include "eric-adp-gui-aggregator-service.mergeAnnotations" (dict "location" .Template.Name "sources" (list $productInfoAnn $globalAnn $serviceAnn)) | trim }}
{{- end -}}

{{/*
Merge user-defined labels with helm labels (DR-D1121-065, DR-D1121-060)
*/}}
{{- define "eric-adp-gui-aggregator-service.labels" -}}
  {{- $productLabels := include "eric-adp-gui-aggregator-service.product-labels" . | fromYaml -}}
  {{- $globalLabels := (.Values.global).labels -}}
  {{- $serviceLabels := .Values.labels -}}
  {{- if .Values.dst.enabled -}}
    {{- $dstLabels :=  .Values.dst.labels  -}}
    {{- include "eric-adp-gui-aggregator-service.mergeLabels" (dict "location" .Template.Name "sources" (list $productLabels $globalLabels $serviceLabels $dstLabels)) | trim }}
  {{- else -}}
    {{- include "eric-adp-gui-aggregator-service.mergeLabels" (dict "location" .Template.Name "sources" (list $productLabels $globalLabels $serviceLabels)) | trim }}
  {{- end -}}
{{- end -}}

{{/*
Release name.
*/}}
{{- define "eric-adp-gui-aggregator-service.release.name" -}}
{{- default .Release.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a merged set of nodeSelectors from global and service level.
*/}}
{{ define "eric-adp-gui-aggregator-service.nodeSelector" }}
  {{- $global := fromJson (include "eric-adp-gui-aggregator-service.global" .) -}}
  {{- if .Values.nodeSelector -}}
    {{- range $key, $localValue := .Values.nodeSelector -}}
      {{- if hasKey $global.nodeSelector $key -}}
          {{- $globalValue := index $global.nodeSelector $key -}}
          {{- if ne $globalValue $localValue -}}
            {{- printf "nodeSelector \"%s\" is specified in both global (%s: %s) and service level (%s: %s) with differing values which is not allowed." $key $key $globalValue $key $localValue | fail -}}
          {{- end -}}
      {{- end -}}
    {{- end -}}
    {{- toYaml (merge $global.nodeSelector .Values.nodeSelector) | trim -}}
  {{- else -}}
    {{- toYaml $global.nodeSelector | trim -}}
  {{- end -}}
{{ end }}

{{/*
Security policy reference.
*/}}
{{- define "eric-adp-gui-aggregator-service.securityPolicy.reference" -}}
{{- $global := fromJson (include "eric-adp-gui-aggregator-service.global" .) -}}
{{- if $global.security.policyReferenceMap -}}
    {{ $mapped := index .Values "global" "security" "policyReferenceMap" "default-restricted-security-policy" }}
    {{- if $mapped -}}
        {{ $mapped }}
    {{- else -}}
      default-restricted-security-policy
    {{- end -}}
{{- else -}}
  default-restricted-security-policy
{{- end -}}
{{- end -}}

{{/*
Define asymmetric-key-certificate-name for ingress
*/}}
{{- define "eric-adp-gui-aggregator-service.ingress.asymmetricKeyCertName"}}
{{- if contains "/" .Values.ingress.certificates.asymmetricKeyCertificateName }}
{{- print .Values.ingress.certificates.asymmetricKeyCertificateName }}
{{- else }}
{{- printf "%s/%s" .Values.ingress.certificates.asymmetricKeyCertificateName .Values.ingress.certificates.asymmetricKeyCertificateName }}
{{- end }}
{{- end }}

{{/*
Generate ingress path
*/}}
{{- define "eric-adp-gui-aggregator-service.ingressPath"}}
{{- printf "/%s" ( default .Values.ingress.path "" | trimSuffix "/" | trimPrefix "/" | replace "-" "_") -}}
{{- end }}

{{/*
Define configuration snippet
*/}}
{{- define "eric-adp-gui-aggregator-service.get-config-snippet" }}
nginx.ingress.kubernetes.io/configuration-snippet: |
{{ if .Values.ingress.tls.enabled }}
  rewrite {{ .path }}$ https://{{ .Values.ingress.hostname }}{{ .path }}/;
{{ else }}
  rewrite {{ .path }}$ http://{{ .Values.ingress.hostname }}{{ .path }}/;
{{ end }}
{{- end }}

{{/*
adding TopologySpreadConstraints
*/}}
{{- define "eric-adp-gui-aggregator-service.topologySpreadConstraints" }}
{{- if .Values.topologySpreadConstraints }}
{{- range $config, $values := .Values.topologySpreadConstraints }}
- topologyKey: {{ $values.topologyKey }}
  maxSkew: {{ $values.maxSkew | default 1 }}
  whenUnsatisfiable: {{ $values.whenUnsatisfiable | default "ScheduleAnyway" }}
  labelSelector:
    matchLabels:
      app: {{ template "eric-adp-gui-aggregator-service.name" $ }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Service port name of metrics endpoint
*/}}
{{- define "eric-adp-gui-aggregator-service.metric-port-name" -}}
{{- $global := fromJson (include "eric-adp-gui-aggregator-service.global" .) -}}
{{- if .Values.metrics.enableNewScrapePattern }}
    {{- $global.security.tls.enabled | ternary "https-metrics" "http-metrics" }}
{{- else }}
    {{- $global.security.tls.enabled | ternary "http-metric-tls" "http-metric" }}
{{- end }}
{{- end -}}

{{/*
Service annotations to expose metrics for Prometheus
*/}}
{{- define "eric-adp-gui-aggregator-service.prometheus-annotations" -}}
{{- $global := fromJson (include "eric-adp-gui-aggregator-service.global" .) -}}
{{- if .Values.metrics.enableNewScrapePattern }}
    {{- if .Values.metrics.enabled }}
        prometheus.io/scrape-role: "endpoints"
        prometheus.io/scrape-interval: "15s"
        prometheus.io/port: {{ .Values.metrics.port | quote }}
        prometheus.io/path: "/metrics"
    {{- else }}
        prometheus.io/scrape-role: "false"
    {{- end }}
{{- else }}
    {{- if .Values.metrics.enabled }}
        prometheus.io/scrape: "true"
        prometheus.io/port: {{ .Values.metrics.port | quote }}
        prometheus.io/scheme: {{ $global.security.tls.enabled | ternary "https" "http" }}
    {{- else }}
        prometheus.io/scrape: "false"
    {{- end }}
{{- end }}
{{- end -}}

{{/* APO2 annotations to expose metrics for Prometheus

If scrape: "true" authZ container will be scraped too.
Example Resource Service metrics, ERS does not support TLS
So enabling TLS scraping for ERS (scraping fails because non-tls but otherwise the system works normally)
*/}}
{{- define "eric-adp-gui-aggregator-service.authz-proxy-prometheus-annotations" -}}
{{- $global := fromJson (include "eric-adp-gui-aggregator-service.global" .) -}}
{{- if .Values.metrics.enabled }}
prometheus.io/scrape: "true"
prometheus.io/port: "8888"
prometheus.io/path: "/authzproxy/metrics"
prometheus.io/scheme: {{ $global.security.tls.enabled | ternary "https" "http" }}
{{- end }}
{{- end -}}

{{/*
Boolean value indicating whether sending logs to the Log Transformer is enabled.
*/}}
{{- define "eric-adp-gui-aggregator-service.directLoggingEnabled" -}}
{{- $global := fromJson (include "eric-adp-gui-aggregator-service.global" .) -}}
{{- if .Values.log.streamingMethod -}}
    {{- if or (eq .Values.log.streamingMethod "direct") (eq .Values.log.streamingMethod "dual") -}}
        true
    {{- else -}}
        false
    {{- end -}}
{{- else if or (eq $global.log.streamingMethod "direct") (eq $global.log.streamingMethod "dual") -}}
    true
{{- else -}}
    false
{{- end -}}
{{- end -}}

{{/*
Create stdout log enabled.
*/}}
{{- define "eric-adp-gui-aggregator-service.stdoutLogEnabled" -}}
{{- $global := fromJson (include "eric-adp-gui-aggregator-service.global" .) -}}
{{- if .Values.log.streamingMethod -}}
    {{- if or (eq .Values.log.streamingMethod "indirect") (eq .Values.log.streamingMethod "dual") -}}
        true
    {{- else -}}
        false
    {{- end -}}
{{- else if or (eq $global.log.streamingMethod "indirect") (eq $global.log.streamingMethod "dual") -}}
    true
{{- else -}}
    false
{{- end -}}
{{- end -}}

{{/*
Pod match label for ingress config of eric-log-transformer Network Policies.
*/}}
{{- define "eric-adp-gui-aggregator-service.logtransformer.label" -}}
{{- if eq "true" (include "eric-adp-gui-aggregator-service.directLoggingEnabled" .) -}}
    eric-log-transformer-access: "true"
{{- end -}}
{{- end -}}

{{/*
Pod match label for Service Mesh sidecar container according to DR-D470217-001.
*/}}
{{- define "eric-adp-gui-aggregator-service.service-mesh.label" -}}
  sidecar.istio.io/inject: "false"
{{- end -}}

{{/*
Generate resource limits and requests for the main container.
*/}}
{{- define "eric-adp-gui-aggregator-service.mainResources" -}}
{{- with .Values.resources.main }}
limits:
  {{- if .limits.cpu }}
  cpu: {{ .limits.cpu | quote }}
  {{- end }}
  {{- if .limits.memory}}
  memory: {{ .limits.memory | quote }}
  {{- end }}
  {{- if (index .limits "ephemeral-storage") }}
  ephemeral-storage: {{ (index .limits "ephemeral-storage") | quote }}
  {{- end }}
requests:
  {{- if .requests.cpu }}
  cpu: {{ .requests.cpu | quote }}
  {{- end }}
  {{- if .requests.memory }}
  memory: {{ .requests.memory | quote }}
  {{- end }}
  {{- if (index .requests "ephemeral-storage") }}
  ephemeral-storage: {{ (index .requests "ephemeral-storage") | quote }}
  {{- end }}
{{- end -}}
{{- end -}}

{{/*
Define the apparmor annotation for main container
*/}}
{{- define "eric-adp-gui-aggregator-service.main-container.appArmorAnnotations" -}}
{{- if .Values.appArmorProfile -}}
{{- $profile := .Values.appArmorProfile -}}
{{- if index .Values.appArmorProfile "main" -}}
{{- $profile = index .Values.appArmorProfile "main" }}
{{- end -}}
{{- include "eric-adp-gui-aggregator-service.main-getApparmorAnnotation" (dict "profile" $profile "ContainerName" "main") }}
{{- end -}}
{{- end -}}

{{/*
Define the apparmor annotation creation based on input profile and container name
*/}}
{{- define "eric-adp-gui-aggregator-service.main-getApparmorAnnotation" -}}
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
Define the seccomp security context for main container
*/}}
{{- define "eric-adp-gui-aggregator-service.main-container.seccompProfile" -}}
{{- if .Values.seccompProfile }}
{{- $profile := .Values.seccompProfile }}
{{- if index .Values.seccompProfile "main" }}
{{- $profile = index .Values.seccompProfile "main" }}
{{- end }}
{{- include "eric-adp-gui-aggregator-service.main-getSeccompSecurityContext" (dict "profile" $profile) }}
{{- end -}}
{{- end -}}

{{/*
Define the seccomp security context creation based on input profile (no container name needed since it is already in the containers security profile)
*/}}
{{- define "eric-adp-gui-aggregator-service.main-getSeccompSecurityContext" -}}
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
Define the seccomp security annotation for the pod
*/}}
{{- define "eric-adp-gui-aggregator-service.pod.seccompAnnotations" -}}
{{- if .Values.seccompProfile }}
{{- $profile := .Values.seccompProfile }}
{{- if index .Values.seccompProfile "pod" }}
{{- $profile = index .Values.seccompProfile "pod" }}
{{- end }}
{{- include "eric-adp-gui-aggregator-service.pod-getSeccompAnnotation" (dict "profile" $profile) }}
{{- end -}}
{{- end -}}

{{/*
Define the seccomp security context creation based on input profile (no container name needed since it is already in the containers security profile)
*/}}
{{- define "eric-adp-gui-aggregator-service.pod-getSeccompAnnotation" -}}
{{- $profile := index . "profile" -}}
{{- if $profile.type -}}
{{- if eq "runtimedefault" (lower $profile.type) }}
seccomp.security.alpha.kubernetes.io/pod: "runtime/default"
{{- else if eq "unconfined" (lower $profile.type) }}
seccomp.security.alpha.kubernetes.io/pod: "unconfined"
{{- else if eq "localhost" (lower $profile.type) }}
{{- if $profile.localhostProfile }}
{{- $localhostProfileList := (splitList "/" $profile.localhostProfile) -}}
{{- if (last $localhostProfileList) }}
seccomp.security.alpha.kubernetes.io/pod: "localhost/{{ (last $localhostProfileList ) }}"
{{- end }}
{{- end }}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
    Define service account name
*/}}
{{- define "eric-adp-gui-aggregator-service.serviceAccountName" -}}
{{ include "eric-adp-gui-aggregator-service.name" . }}-serviceaccount
{{- end -}}

{{/*
    Define securityPolicy.rolekind
*/}}
{{- define "eric-adp-gui-aggregator-service.rolekind" -}}
{{- $rolekind := "" -}}
{{- if .Values.global -}}
    {{- if .Values.global.securityPolicy -}}
        {{- if hasKey .Values.global.securityPolicy "rolekind" -}}
            {{- $rolekind = .Values.global.securityPolicy.rolekind -}}
        {{- end -}}
    {{- end -}}
{{- end -}}
{{- $rolekind -}}
{{- end -}}

{{/*
    Define securityPolicy.rolekind initial
*/}}
{{- define "eric-adp-gui-aggregator-service.rki" -}}
{{- if eq (include "eric-adp-gui-aggregator-service.rolekind" .) "ClusterRole" -}}c{{- else if eq (include "eric-adp-gui-aggregator-service.rolekind" .) "Role" -}}r{{- end -}}
{{- end -}}

{{/*
Create dst collector url
*/}}
{{- define "eric-adp-gui-aggregator-service.otelExporterOtlpEndpoint" -}}
  {{- $global := fromJson (include "eric-adp-gui-aggregator-service.global" .) -}}
  {{- if .Values.dst.enabled -}}
    {{- print ($global.security.tls.enabled | ternary "https://" "http://") .Values.dst.collector.host ":" .Values.dst.collector.otlpHttpPort }}
  {{- else -}}
    {{- printf "" -}}
  {{- end -}}
{{- end -}}

{{/*
SIP-TLS root CA secret name.
*/}}
{{- define "eric-adp-gui-aggregator-service.rootSecretName" -}}
{{- $global := fromJson (include "eric-adp-gui-aggregator-service.global" .) -}}
{{- print $global.security.tls.trustedInternalRootCa.secret -}}
{{- end -}}

{{/*
Configuration to normalize user information fields received from IAM
*/}}
{{ define "eric-adp-gui-aggregator-service.iamFieldMappings" }}
{{- with .Values.configuration.userPermission }}
{{- if and .userInfo .userInfo.fieldMappings (or .userInfo.fieldMappings.username .userInfo.fieldMappings.lastLoginTime .userInfo.fieldMappings.userId) }}
"fieldMappings": {{ .userInfo.fieldMappings | toJson }},
{{- end }}
{{- end }}
{{- end }}

{{/*
Create tolerations (DR1120-061/60/67)
*/}}
{{- define "eric-adp-gui-aggregator-service.tolerations" -}}
  {{- $global := (list) -}}
  {{- $globalDict := fromJson (include "eric-adp-gui-aggregator-service.global" .) -}}
  {{- if $globalDict.tolerations -}}
    {{- $global = .Values.global.tolerations -}}
  {{- end -}}
  {{- $local := (list) -}}
  {{- if eq (typeOf .Values.tolerations) ("[]interface {}") -}}
    {{- $local = .Values.tolerations -}}
  {{- else if (.Values.tolerations).gas -}}
    {{- $local = .Values.tolerations.gas -}}
  {{- end -}}
  {{- $merged := (list) -}}
  {{- if $global -}}
      {{- $merged = $global -}}
  {{- end -}}
  {{- if $local -}}
    {{- range $i, $localToleration := $local -}}
      {{- $localValue := get $localToleration "key" -}}
      {{- range $g, $globalToleration := $merged -}}
        {{- $globalValue := get $globalToleration "key" -}}
        {{- if eq $localValue $globalValue -}}
          {{- $merged = without $merged $globalToleration -}}
        {{- end -}}
      {{- end -}}
    {{- end -}}
    {{- $merged = concat $merged $local -}}
  {{- end -}}
  {{- if $merged -}}
      {{- toYaml $merged -}}
  {{- end -}}
  {{- /* Do nothing if both global and local groups are not set */ -}}
{{- end -}}