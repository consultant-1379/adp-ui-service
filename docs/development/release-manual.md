# Plus Release Creation

To release GUI Aggregator a '+' version of the service must be created with the Release pipeline.
However before the pipeline can be started there may be some required manual approval steps from the
3PP Coordinator and the Trade Expert.

In the following steps use the common CI users to log into the product handling systems.
For password see [Tokens](https://eteamspace.internal.ericsson.com/display/EIT/Tokens).

0. Pre-requisites:

   - check the `docs/release/content/release_notes.md` to be up-to-date.
     - If needed, fill manually the release notes based on commits added since the last release.
     - Suggestions:
       - Check the bullet points from end user perspective.
       - Check the `Migration` part: write here if there is any manual change needed from end user due
         to a non-backward compatible change (ask the team).
       - Under `Bugfixes` list production code or customer document related bug cards.
   - check the EUI-SDK R-State in `plms/product_structure.yaml` to be up-to-date.
     - Since last + release if any @eui dependency in our package.json file(s) has either
       been uplifted by us, or in case of ^ version a new release has been delivered by EUI-SDK,
       then most probably already a new major version of EUI-SDK is used by us (e.g. 2.6.0).
     - Each major EUI-SDK version has an R-State in PRIM, which is to be reflected in our product structure.
     - If needed, follow the instruction in `plms/product_structure.yaml` and update the R-State.
     - Note! Double-check if both RS and DS codes are set properly for the new R-State:
       [see EUI-SDK product in PRIM](https://product.internal.ericsson.com/gup/find?prodNo=CNA4033599).
   - check if the drop version planned to be used for release is passed all staging CIs
     - [SMI Custom Staging (generates some necessary test documents for example)](https://spinnaker.rnd.gic.ericsson.se/#/applications/adp-smart-insights/executions?pipeline=eric-adp-gui-aggregator-service-Custom-Flow)
     - [ADP Staging](https://spinnaker.rnd.gic.ericsson.se/#/applications/adp-e2e-cicd-reusable/executions?q=ga&pipeline=eric-adp-gui-aggregator-service-E2E-Flow)
     - [EEA4](https://spinnaker.rnd.gic.ericsson.se/#/applications/adp-e2e-cicd-reusable/executions?q=ga&pipeline=eric-adp-gui-aggregator-service-E2E-Flow)
     - [OSS Base](https://spinnaker.rnd.gic.ericsson.se/#/applications/adp-e2e-cicd-reusable/executions?q=ga&pipeline=eric-adp-gui-aggregator-service-E2E-Flow)

1. Log into [Mimer](https://mimer.internal.ericsson.com/home) to see the current product status.

   - If you do not have rights request access on MySupport [page](https://ericsson-dwp.onbmc.com/dwp/app/#/itemprofile/26309).
     (DataReader role is enough for browsing)
   - Search for `Lightweight GUI Aggregator` in the top right search box.
   - Check all Designations: select e.g. `Lightweight GUI Aggregator Service`, select the `InWork` version,
     then click on the appearing `Compliance Dashboard` in the left menu panel.
   - If `FOSS Usage`, `Encryption` or `Trade Compliance` are Yellow,
     then a manual approval is needed for all Designations at this version.
   - At first ask approval for `FOSS Usage` and `Encryption`.
     - Tibor Harcsa <tibor.harcsa@ericsson.com> (Teams OK)
   - If there were no 3pp and encryption change, `Trade Compliance` will get automatic approval,
     when `FOSS Usage` and `Encryption` turn to Green. Otherwise ask for Trade Expert approval.
     - György Sándor <gyorgy.sandor@ericsson.com> (Email OK)
   - After the approvals check again the Compliance Dashboards, and you can proceed,
     when `FOSS Usage`, `Encryption` and `Trade Compliance` are all Green.
     (A possible Warning at `Product restriction` is not blocking the release.)

2. Make sure all required documents are available in Eridoc

   - Release pipeline will look for documents to approve them. If a document is not found,
     the pipeline fails. Note that these documents are generated previously by successful Drop
     and SMI Custom Staging builds.
   - Open [GUI Aggregator Eridoc folder](https://eridoc.internal.ericsson.com/eridoc/?docbase=eridoca&locateId=0b004cffc6b574c5).
   - Check if every document exists in `DPI documents` folder that are configured
     in `docs/release/config/eridoc/release-dpi-documents.yaml`.
   - Check if every document exists in `Test documents` folder that are configured
     in below files and verify that the title of test reports contains the proper version.
     - `docs/release/config/eridoc/release-test-documents.yaml`
     - `docs/release/config/eridoc/release-characteristics-report.yaml`
     - `docs/release/config/eridoc/release-k8s-report.yaml`
   - Contents of `Release documents` and `Security documents` folders are not prerequisites
     for the release pipeline.

3. Start the [characteristics pipeline](https://seliius27190.seli.gic.ericsson.se:8443/view/Presentation/job/adp-ui-service-athena-report/)
   to get characteristics report to the release candidate drop version.

   Set the following parameters to the pipeline:

   - Drop version to the version that is about to be released.
   - Response threshold to 1000.
   - Include Static Assets
   - Publish Athena Report
   - Save Detailed Report

   In case the pipeline fails, investigate if there is any performance drop since last release.
   If so (e.g. there is threshold breach even after re-running the pipeline),
   either postpone the release or create a JIRA ticket about the performance issue.

   If Athena report creation failed, go to [Athena troubleshooting chapter](#athena-job-troubleshooting).

4. Start the [adp-ui-service-release](https://seliius27190.seli.gic.ericsson.se:8443/view/Presentation/job/adp-ui-service-release/)
   pipeline in Jenkins.

   - Set the `RELEASE_CANDIDATE` to the drop version which should be released (e.g. 0.7.2-45).
   - `VERSION_UPDATE`: the version increase method after the release. An automatic commit is created
     with the version increase after a successful release. This version will be the **next** release
     version. (Usually `MINOR` is to be used, this will uplift e.g. from 0.3.0 to 0.4.0.)
   - `DRY_RUN`: use for development purposes, stages won't do permanent changes.
   - `RUN_STAGES`: by default it is `all`. Can be used to restart the release with only a subset of
     the stages, see [partial run chapter](#partial-run).
   - `GERRIT_REFSPEC`: the patchset used for the release pipeline _CI Code_. At this stage GUI Aggregator
     artifacts are fetched from ARM repositores and not rebuilt from GIT.

5. The released '+' version of GAS is automatically deployed to the demo cluster.
   If not, manually start the [adp-smi-staging-demo](https://seliius27190.seli.gic.ericsson.se:8443/view/Presentation/job/adp-smi-staging-demo)
   pipeline in Jenkins.

   - Set the `GAS_VERSION` to the released version (e.g. 2.4.0+21).
   - Set `latest release` as `HA_TYPE`.
   - Set `adp-ui-service` as `DEMO_INGRESS_PATH`. Note that in the URL it will be converted to `adp_ui_service`.
   - Set a namespace name in `DEMO_NAMESPACE` parameter. To avoid being removed by the weekend
     namespace cleanup job, make sure it does not end with number. Note that the demo deploy
     pipeline uses custom namespace labels and based on these it automatically
     removes the previous demo namespace.

6. After the plus release is successfully out, ask an administrator of
   `ADPRS` JIRA project to update the component version:

   - Open [JIRA Component Release Administration](https://eteamproject.internal.ericsson.com/projects/ADPRS?selectedItem=net.brokenbuild.subcomponents:component-versions-organizer)
   - Locate `GAS Light` component and rename `GAS Light Upcoming Release` component version to
     `GAS Light x.y.z+k` (e.g. `GAS Light 2.4.0+21`),
     set `Release Date` and set it to `RELEASED` (Green)
   - Create a new `GAS Light Upcoming Release` component version
   - You can check if your changes are reflected on the [Releases page](https://eteamproject.internal.ericsson.com/projects/ADPRS?selectedItem=com.atlassian.jira.jira-projects-plugin:release-page&status=no-filter&contains=GAS)

After a successful run a new '+' version of GUI Aggregator should be published with all the relevant
artifacts:

- source: docker image, helm charts are uploaded into ARM release repository
- Certified archives in GitCA and ACA
- documentation for the release version at ADP Marketplace
- release documents uploaded to Eridoc
- In Mimer, PRIM, EVMS the release candidate version is marked as released

## Increase major version

If the major version is planned to be changed there are extra manual steps to do:

1. call the last release pipeline with version increase step set to `major`
2. after the release master will contain the increased major version in `VERSION_PREFIX`
3. manually log into Eridoc and copy-paste all GAS documents, increase the `/x` in the document numbers
   to the new major version (e.g. `1/abc de-APR 201 088/x`)
4. update document numbers in marketplace configs, Eridoc upload configs and `product_structure.yaml`

## Troubleshooting

If the pipeline fails it can be restarted after the issue is resolved, but note that
some build stages should probably be skipped by starting a [partial run](#partial-run):

- Skip `Register to EVMS` stage, if it was green in the previous execution.
- Skip `Set artifact in Munin` stage, if it was green in the previous execution.
- In case of `Release product` stage a re-triggered pipeline in most cases can continue
  where Mimer processing was stopped (e.g. if Trade Expert review was missing, then after an approval
  the pipeline can be re-triggered). If revert or version delete is required in Mimer,
  ask Tibor Harcsa on Teams.
- If version is already released in Mimer, several stages must be skipped before re-running the pipeline,
  see [bookmarking issue](#bookmarking-issue) chapter below.
- Note that Eridoc documents are not needed to be withdrawn any more,
  the script can handle if document is already approved.

The following chapters cover some typical error cases.

### 3PP issue in input data

In case the `FOSSA Usage` turns from Green to Yellow in Mimer dashboard during release pipeline,
it may indicate some mismatch or glitch in the input data of one or more 3PPs.

- Open the FOSS report in Mimer and find the problematic 3PP's.
- Double-check the blocks of the particular 3PP's in `dependencies_foss_auto.yaml`,
  especially the `mimer:` part.
- If needed, create a new commit with the fix. Note that to avoid failing PreCodeReview,
  you need to withdraw the Test Report in Eridoc. Also a check out and check in is needed.
- To apply the fix, either have the commit submitted and wait for the Drop pipeline,
  or use its Gerrit refspec when re-running the release pipeline. But before re-running the pipeline
  don't forget to withdraw PRI approval in Eridoc and to ask manual FOSS Usage approve again.

### Bookmarking Issue

A known issue is when the pipeline stops at the `Create bookmarks` step with an error message:

```text
16:40:22  2023-03-13 15:40:18,523 [munin] [ERROR] {
16:40:22      "results": [
16:40:22          {
16:40:22              "operation": "Policy",
16:40:22              "code": "POLICY_ERROR",
16:40:22              "correlationId": "8669044a_16377849134314636",
16:40:22              "messages": [
16:40:22                  "validate:bookmarks:",
16:40:22                  "bookmarks:primTargetIdentifier - primTargetIdentifier is readOnly and
cannot be changed"
16:40:22              ]
16:40:22          }
16:40:22      ]
16:40:22  }
```

Contact Tibor Harcsa on Teams and ask for help. After manual fix in
Munin the pipeline can be restarted with the selected steps. In Jenkins in the RUN_STAGES section
delete the default value "all" and add these (remove the extra whitespaces after copy and paste):

```text
Install npm dependencies,Fetch artifact checksums,Get approved document versions,
Generate PRI and approve it,Generate and update docs to ARM and marketplace,
Create PRA Git Tag,Increment version prefix,Update Changelog,Email
```

Note that PRI withdrawal and other resets are not needed.

### Issue with releasing in Mimer

If pipeline fails at `Release product` stage, check the possible reason in job log:

- In case there is some issue with our input (3PP approvals, licenses, `product_structure.yaml`, etc.),
  consult with Tibor Harcsa and if needed create a fix and re-trigger with the patchset.
- In case it seems a generic issue with Mimer or PRIM, check ADP Teams channels
  or create a ticket if needed.
- In case it is temporary environment issue (e.g. timeout or `null` code values from PRIM),
  you may re-trigger with below partial steps.

To re-run the pipeline after failed product release step, in Jenkins in the RUN_STAGES section
delete the default value "all" and add these (remove the extra whitespaces after copy and paste).
Please note that the `Release product` step requires a merged dependencies file, so
the `Prepare FOSS dependencies` step is also a prerequisite:

```text
Install npm dependencies,Fetch artifact checksums,Prepare FOSS dependencies,Get approved document versions,
Generate PRI and approve it,Release product,Create bookmarks,Generate and update docs to ARM and marketplace,
Create PRA Git Tag,Increment version prefix,Update Changelog,Email
```

### Athena job troubleshooting

In case characteristics report can't be generated due to metric collection issue,
look these logs for errors or warnings:

- debug log of Athena in job workspace under `load-test\output\logs` folder in Jenkins
- kubectl logs of `eric-pm-server` and `eric-pm-node-exporter` in the job namespace

If further investigation is needed regarding metrics, forward the 9090 port of `eric-pm-server-0`
to localhost with kubectl and check the followings in Prometheus UI:

- in Graph menu try to query `eric_adp_*` metrics in different periods
- double-check if basic `container_*` and `machine_*` metrics are available
  (refer to [cAdvisor documentation](https://github.com/google/cadvisor/blob/master/docs/storage/prometheus.md))

If any of these metrics is missing, and you see `forbidden`
or `eric-pm-server-kube-state-metrics not found` errors in PM logs,
check roles and role bindings in the cluster:

```bash
# verify the role binding defined by cluster-wide-pm-rolebinding.yaml chart
kubectl -n jenkins-adp-ui-service-athena-report-*** get clusterrolebindings | grep cluster-wide

# check the name of ClusterRole, by default "eric-pm-server-kube-state-metrics"
kubectl -n jenkins-adp-ui-service-athena-report-*** describe clusterrolebinding cluster-wide-pm-rolebinding-***

# check if the ClusterRole with the required name is available in the cluster
kubectl get clusterrole | grep eric-pm-server
```

In case the required ClusterRole is missing from the cluster, create it from a chart file
with `kubectl create -f <some yaml>` command. Try this content:

```text
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: eric-pm-server-kube-state-metrics
rules:
- apiGroups: [""]
  resources:
  - nodes
  - nodes/proxy
  - services
  - endpoints
  - pods
  verbs: ["get", "list", "watch"]
- apiGroups:
  - extensions
  resources:
  - ingresses
  verbs: ["get", "list", "watch"]
- nonResourceURLs: ["/metrics"]
  verbs: ["get"]
```

If ready, check again the default `container_*` metrics in Prometheus, and if metrics are appearing,
you may restart the Athena pipeline.

If none of these help, contact the `ADP / Robustness and Characteristics` channel in Teams.

## Partial run

The pipeline can be partially executed with the `RUN_STAGES` parameter. Just add the name of the stage
to a comma separated list. Use the exact same name what is visible on the Jenkins UI, the same string
as set in the stage('...name...') parts in the `Release.jenkinsfile`.

However currently it requires a deeper understanding of the pipeline as there can be dependency
between stages and in these cases all the prerequisite stages must be added to the list
(e.g. Marketplace docs requires the SVL generation step).
Otherwise a later stage may fail because it can't found the output of an earlier stage.

As reference here are all the stages (remove the line breaks after copy and paste):

```text
Cleanup,Init,Validate Structured Data with Drop Artifacts,Install npm dependencies,
Publish released Docker Images,Publish released helm chart,Fetch artifact checksums,
Prepare FOSS dependencies,Register to EVMS,Set artifact in Munin,
Auto approve Eridoc documents,Get approved document versions,Generate PRI and approve it,
Register artifacts in ACA,Release product,Create bookmarks,Generate and update docs to ARM and marketplace,
Create PRA Git Tag,Increment version prefix,Update Changelog,Email
```

## PRI manual content

The PRI document is built from [PRI template](https://gerrit-gamma.gic.ericsson.se/plugins/gitiles/adp-cicd/bob-adp-release-auto/+/master/pri/configs/1.8/templates/pri_template.html).
The content is semi-automated, because most of the chapters are created automatically, but there are
some manual content from the `plms/pri_manual_input.json`. The relevant items are the following
(these are shall be filled in extreme cases):

**`Release_criteria_unfulfillments`**: If one of the release criteria is not fulfilled from the
[PRA checklist](https://erid2rest.internal.ericsson.com/d2rest/repositories/eridoca/eridocument/download?number-part=15311-APR201088UEN&REVISION=A),
then it shall be listed here in a string list.

**`Exemptions`**: If there is a security issue in the actual release or not fixed TR or backward
incompatibilities or unsupported Upgrade/rollback paths, then it shall be mentioned in a string list.

**`Upgrade_Information`**: If there is a highlighted upgrade information, then it shall be listed here
in a string list.

The PRI generation is based on Jira requests and git commits. The Jira queries and the git message
format are configured in the `plms/config_adpprg.json` configuration file.
