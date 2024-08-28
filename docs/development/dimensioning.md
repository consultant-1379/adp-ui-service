# Dimensioning

This document collect aspect of the resource dimensioning for the microservice.

Reference to the [ADP Dimensioning Guidelines](https://eteamspace.internal.ericsson.com/display/AA/Kubernetes+Characteristics+and+Dimensioning+Guidelines).

## Scaling types

Kubernetes can provide _vertical_ and _horizontal_ scaling to handle increase in load.

The vertical scaling means that the service instances are getting more resources when the load is
higher. For this the service instances can specify a minium and a maximum resource requirement and
Kubernetes will start the instance on nodes where there are enough resource.

Horizontal scaling means that the replicas of a deployment is increased under higher load.
Currently GAS does not support horizontal automatic scaling.

## Resources

In Kubernetes there are several resources which can be limited for a pod or a container.
In case of GAS every container in a Pod can have separate resource configuration and can be
independently dimensioned.

Each resource can have a `request` and a `limit` parameter to tell the Kubernetes orchestrator how to
manage the containers. The `request` is the minimum value. The `limit` indicates a maximum value,
when more is used by the container Kubernetes can kill it.

To unset resource restrictions, it should be set to `null`.

### Quality of Service

For Guaranteed Quality of Service the following must be fulfilled:

- Every Container in the Pod must have a memory limit and a memory request.
- For every Container in the Pod, the memory limit must equal the memory request.
- Every Container in the Pod must have a CPU limit and a CPU request.
- For every Container in the Pod, the CPU limit must equal the CPU request.

## Containers

It is a general practice to have separate containers for the separate processes in the Pod.

### Determine resource over usage

If the Pod is killed and restarted always check the reasons.

Use `kubectl describe pod <pod-name>` to get a description of the currently running pod. If a container
was terminated because using too much resource then the result of the describe will contains information.

```bash
$ kubectl describe pod eric-adp-gui-aggregator-service-6cfc59b686-lxzwh
...
  main:
...
    State:          Running
      Started:      Tue, 21 Jun 2022 12:50:46 +0200
    Last State:     Terminated
      Reason:       OOMKilled
      Exit Code:    137
      Started:      Fri, 10 Jun 2022 15:01:06 +0200
      Finished:     Tue, 21 Jun 2022 12:50:45 +0200
    Ready:          True
    Restart Count:  1
```

A process can be killed for over stepping memory or storage limits.

### Auth proxy Oauth2

For the Auth proxy side car check the recommendations at the sidecar's [marketplace page](https://adp.ericsson.se/marketplace/authorization-proxy-oauth2/).

At the moment there isn't any GAS specific recommendation for the Oauth2 Proxy sidecar.

### Main container

The main container runs a NodeJS application, and this is the single process in the container.

#### CPU

CPU resource for the container is controlled by Kubernetes. At the moment there isn't any CPU
specific measurement to see what are the optimal settings for GAS.

**Note:** If GAS's "static asset proxying functionality is used, default values are not enough,
 higher CPU numbers (requested 500m, limit 1000m) shall be used by overriding the defaults.

#### Memory

Memory usage of the process can change depending on the incoming requests and other internal functionalities.
As the memory usage can grow over time, it is important to control it otherwise Kubernetes can
kill the container and the Pod.

The main process is started with the nodejs CLI, which provides some options to configure the memory
usage. Using the [--max-old-space-size](https://nodejs.org/api/cli.html#--max-old-space-sizesize-in-megabytes)
parameter, it is possible to set a limit for the Heap size of the runtime engine.

To make GAS light deployment consistent, the maximum allowed heap size is calculated from the main
container's memory limit. As the heap is not the only memory space used by the runtime, the limit
is set lower than the container limit.

The memory settings are done in the `entrypoint.sh` used by the docker image.
The `entrypoint.sh` contains a `NODEJS_RUNTIME_RESERVED_MEMORY` environment variable,
which is a reserved memory for `NodeJS runtime`, the default value is 75 MB, it can be configured
in `values.yaml/configuration/nodeJsRuntimeReservedMemory`.

For other tips: [NodeJs memory management](https://developer.ibm.com/articles/nodejs-memory-management-in-container-environments/)

#### Storage

Ephemeral storage requirement also should be configured for GAS Light. Ephemeral storage is a temporal
space on a kubernetes node, where the container can store files. Also Kubernetes uses this storage to
create the ConfigMap mounts and also the stdout is written into a file here, which is cleared based on
a retention policy.

In case of the sizing of the ephemeral storage, always calculate with the explicit and implicit
requirements. The size requirement of the stdout can vary on the cluster settings, so it is not
possible to set the limits properly at build time.

Check the details in the [ADP Characteristic Guide](https://eteamspace.internal.ericsson.com/display/AA/Kubernetes+Characteristics+and+Dimensioning+Guidelines#KubernetesCharacteristicsandDimensioningGuidelines-LocalEphemeral-Storage).
