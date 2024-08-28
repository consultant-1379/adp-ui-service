# Live Debugging

If the service shall be debugged in a live deployment, there are some trick to do it in place.

## Kubeconfig

First get access to the kubernetes cluster, add the connection parameters to your kubeconfig.
For convenience set the namespace in your context.
For more information, see [Organizing Cluster Access Using kubeconfig Files](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/)

```bash
# SSH into the cluster admin
ssh root@<FQDN of the admin server>
# get the cube-config
cat ~/.kube/config
# get the credentials for the kubernetes-admin, client-certificate-data, client-key-data

# logout
exit

# edit your local kubeconfig
vi ~/.kube/config

# add the cluster, the admin user, and create a context for them
# also add the namespace to the context to make kubectl commands easier

# switch to the new context
kubectl config switch-context <the-new-context>
```

From now kubectl commands will be executed on the remote cluster in the set namespace.
If namespace is not defined in the context then it is the `default` by default.

## Node REPL

After gaining access to the cluster, it is possible to log into the running container and execute
bash commands to test environment and connections. Note: the docker image and the user is very
limited due to security reasons.

```bash
kubectl exec -it deployment/eric-adp-gui-aggregator -- bash
```

In special cases it may be required to check the result of some NodeJS commands. One option to
start a [Node REPL](https://nodejs.org/api/repl.html) (Read-Eval-Print-Loop) session.

```bash
node
```

The REPL session provides a nodejs interpreter where JavaScript commands can be executed.
ESM modules can be imported with dynamic import statements, which is an async operation.

Example execution:

```bash
$ kubectl exec -it deployment/eric-adp-gui-aggregator -- bash
bash-4.4$ node
Welcome to Node.js v20.12.2.
Type ".help" for more information.
>
Error: Could not open history file.
REPL session history will not be persisted.
> let fetch = await import('node-fetch');
undefined
> let result = await fetch.default('https//<test-ip>:8080/config.package.json');
undefined
> await result.json();
...
```

If an issue happens using core modules, then sometime it is required to turn on the debug logs.
For that set the `NODE_DEBUG` env variable to the list of core modules to be debugged.
More info: <https://nodejs.org/api/cli.html#node_debugmodule>

```bash
export NODE_DEBUG='tls,http'
node
>
```

## Debugport

Complex errors may require to debug GAS directly with NodeJS debugger.

The debugport can be opened for an already running NodeJS process, by sending the `USR1` signal
to the process. By default it is opened at port `9229`.

```bash
# Log into the container
kubectl exec -it <podname> -- bash
# if there are more container, eg. sidecars, use the -c to specify the container

# find the process ID, eg with top
# exit with Q
top

# send the signal
kill -USR1 <pid>

# logout
exit
```

Create a port-forward for the debug port 9229, to make it available locally at localhost.

```bash
# The first, 3334 is the local port, the second 9229 is the port in the container to be forwarded
kubectl port-forward <podname> 3334:9229

# If only one port is provided, both the local and remote port will be the same.
kubectl port-forward <podname> 9229
```

## Chrome Debugger

Now the debugport is open in the container and tunneled locally.
Open up Chrome and go to url: <chrome://inspect>
If the local port is not the default 9229, then configure the network targets in the `Devices` section
and add it to the list.

After a while the process shall be visible in the `Remote Target` section.
Click on inspect to open up a Chrome debugger for Nodejs which is connected to the remote process.
The console will show messages written to the standard output, and all the executed sources are available
for inspection:

- open source files, add breakpoints and inspect variables
- monitor the standard output of the process on the console
- CPU profiling to find CPU intensive code fragments
- Memory profiling of the Heap to find memory leaks

## VSCode Debugger

If the source of the service is available locally, it is possible to attach the VSCode debugger
to the process.
Create a NodeJS (Attach) launch config and set the following parameters:

- `address` -> `localhost`
- `port` -> tunneled port
- `localRoot` -> the path to the project in the local workspace
- `remoteRoot` -> the absolute path to the program folder in the container

## Liveness Probe

However there is a caveat: breakpoints stop the nodejs process which won't be responsive for other
requests. If the `Liveness` probe is implemented in NodeJS then it won't send any response and
Kubernetes will kill and restart the container, resetting all of the steps above.

To circumvent this edit the liveness probe for the deployment or statefulset. Easiest to remove it totally.

```bash
# Get the list of deployments
kubectl get deployment
# Edit the deployment
kubectl edit deployment/<deployment-name>

# Get the list of statefulset
kubectl get statefulset
# Edit the statefulset
kubectl edit statefulset/<statefulset-name>
```

`kubectl edit` start a text editor with the content of the requested descriptor. When the file
is saved and the editor is closed, the kubectl will update the resource in Kubernetes.

To delete the liveness probe look for the `livenessProbe` attribute in the yaml. Remove the section
from the relevant container, and update the resource.

## Memory footprint

The debugger can increase the memory footprint of the NodeJS process during the debugging session.
It can be visible in the overall memory consumption of the container, eg. when checking the used
resources in Kubernetes monitoring tools. However the actual JS Heap size may remain low.

Depending on the executed action it can be several hundred MBs.

The debug mode cannot be switched off at runtime. Only way to kill the process and
have the kubernetes to restart the container: `kill -9 <pid>`.

## Swap image

After a debugging session it is possible that a quick fix is available and would it worth to try it
out in the live cluster. With the above kubectl edit command it is possible to change the used image
in the pod too.

1. make the changes in the code base
2. create a commit and push to Gerrit
3. the precodereview pipeline will build the temp image and upload it to ARM. Get the exact image
   version (instead of the drop number there is a hash)
4. edit the deployment with `kubectl edit` and change the `image` for the relevant container

?>**Note**: in some cluster the pull secret for the CI ARM repository is not deployed. In that case
add the pull secret to the namespace, and also configure it in the deployment descriptor.
More info: [Remote Cluster](kubernetes.md#remote-cluster)

## TLS debugging

Example debugging session: [ADPRS-5161](https://eteamproject.internal.ericsson.com/browse/ADPRS-5161)

To debug TLS issues between GAS and other service try to reproduce the issue locally. Log into the
GAS container and use some of the CLI tools to initiate connection to the target service.
The certificates for the connections are all available in the `main` container in the
`/run/secrets/` folders.

### CURL CLI

Using `cURL` in verbose mode. This is the easiest mode to verify integration and reproduce issues.

```bash
curl -v 'https://<service-name>:<port>/config.package.json'  \
  --cacert /run/secrets/root/ca.crt \
  --key /run/secrets/internalUi/key.pem \
  --cert /run/secrets/internalUi/cert.pem
```

In special cases use extra options, like enforcing `HTTP/2` or setting `ALPN` or similar to reproduce
the issue.

### Node CLI

Using [Node REPL](#node-repl) to execute requests from Nodejs. This mode is a bit more complicated,
but in very special cases curl with the default parameters may have different results compared with
nodeJS.

```bash
bash-4.4$ node
Welcome to Node.js v20.12.2.
Type ".help" for more information.
>
Error: Could not open history file.
REPL session history will not be persisted.
> let fetch = await import('node-fetch');
undefined
> let ca = fs.readFileSync('/run/secrets/root/ca.crt', 'utf-8');
undefined
> let key = fs.readFileSync('/run/secrets/internalUi/key.pem', 'utf-8');
undefined
> let cert = fs.readFileSync('/run/secrets/internalUi/cert.pem', 'utf-8');
undefined
> let ha = new https.Agent({ rejectUnauthorized: true, ca, key, cert });
undefined
> let result = await fetch.default('https://<service-name>:<port>/config.package.json', { agent: ha });
undefined // or the SSL exception if the connection failed.
> await result.json();
{
  modules: [
    ...
  ]
}
>
```

Also you may have to turn on debug logs for the `tls`, `http` `https` modules to get more details.

### OpenSSL CLI

Using `openssl` to debug TLS in more deeply. By this all the communications between server and clients
can be monitored to see which part of the TLS handshake failed or what can be the issue with the
certificates.

```bash
bash-4.4$ echo | openssl s_client -connect <server-name>:<port> -CAfile /run/secrets/root/ca.crt
```

In some cases it matters if `ALPN` is used. To turn on use `-alpn http/1.1` or other target protocols.
