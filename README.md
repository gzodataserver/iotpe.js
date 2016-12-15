JS IOT Process Engine
=====================

JavaScript IoT Process Engine (PE) is a lightweight engine that runs JavaScript
business rules. The engine runs on top of a MySQL database and authentication and
authorization is also handled with MySQL users. A PE account correlates to one
MySQL user.

Communication with the Process Engine is performed using MQTT which is a
pub/sub messaging architecture. PE is using [Mosca](http://www.mosca.io) for
MQTT communication.

Messaging
---------

MQTT Has three Quality Of Service (QoS) levels:

* QoS 0 - At most once delivery
* QoS 1 - At least once delivery
* QoS 2 - Exactly once delivery (Not supported)

Participants in a MQTT communication subscript and published messages in different topics.
Topics can be hierachic using slashes '/' as separators. The wildcard '+' (one level) and
'#' (all remaining leverls) are  allowed when subscribing.

Here is a simple example of a MQTT server and two clients.

```
# Install and start a mosca server
npm install mosca bunyan
./node_modules/mosca/bin/mosca |  ./node_modules/bunyan/bin/bunyan

# Subsrcibe to a topic
mqtt sub -t 'hello' -h 'localhost' -v

# Publish a message for this topic in another terminal
mqtt pub -t 'hello' -h 'localhost' -m 'Hello world'
```

User model and authorizations
-----------------------------

In PE are all messages addressed to one specific account.
The
[server can authenticate the client](http://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html#_Toc398718116).
This is performed in the CONNECT package with a username and password. There is no way for the
[client to authenticate the server](http://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html#_Toc398718118)
though. The MySQL username and password should be supplied when connecting to PE.

Messages can be sent to server accounts and clients can also send messages to other accounts
than their own. An ACL is used to control which topics an account is allowed to publish
and subscribe to.

The examples below assumes that the NodeJS `mqtt` client is installed: `npm install -g mqtt`

The Gizur [Odata server](https://github.com/gizur/odataserver2) provides a easy to use
mechanism for exposing tables as entities that can access an using HTTP REST API. It is
built on top of MySQL and provides an easy mechanism for creating accounts using an
email address. MySQL accounts can also be created the traditional way.

We'll assume that the accounts `3ea8f06baf64` and `6adb637f9cf2` exist in the database for
the example below.

```
# mosca has no authentication out of the box, so this will work

# Subsrcibe to a topic
mqtt sub --username '6adb637f9cf2' -P 'secret' -t '/3ea8f06baf64/hello' -h 'localhost' -v

# Publish a message for this topic in another terminal
mqtt pub --username '3ea8f06baf64' -P 'secret' -t '/3ea8f06baf64/hello' -h 'localhost' -m 'Hello world'
```

Granting and revoking privileges for publishing and subscribing to topics is performed like
this:

```
# Grant 6adb637f9cf2 the right to subscribe to the topic mytopic
mqtt pub --username '3ea8f06baf64' -P 'secret' -t '/3ea8f06baf64/grant_sub_topic' -h 'localhost' -m '{"name":"mytopic","accountId":"6adb637f9cf2"}'

# Grant 6adb637f9cf2 the right to publish to the topic mytopic
mqtt pub --username '3ea8f06baf64' -P 'secret' -t '/3ea8f06baf64/grant_pub_topic' -h 'localhost' -m '{"name":"mytopic","accountId":"6adb637f9cf2"}'


# Now 6adb637f9cf2 can both publish and subscribe to the topic 3ea8f06baf64/mytopic
mqtt sub --username '6adb637f9cf2' -P 'secret'  -t '/3ea8f06baf64/mytopic' -h 'localhost' -v
mqtt pub --username '6adb637f9cf2' -P 'secret'  -t '/3ea8f06baf64/mytopic' -h 'localhost' -m '{data: "My data"}'

# Revoke 6adb637f9cf2 the right to subscribe to the topic mytopic
mqtt pub --username '3ea8f06baf64' -P 'secret' -t '/3ea8f06baf64/revoke_sub_topic' -h 'localhost' -m '{"name":"mytopic","accountId":"6adb637f9cf2"}'

# Revoke 6adb637f9cf2 the right to publish to the topic mytopic
mqtt pub --username '3ea8f06baf64' -P 'secret' -t '/3ea8f06baf64/revoke_pub_topic' -h 'localhost' -m '{"name":"mytopic","accountId":"6adb637f9cf2"}'
```


Business Logic
--------------

Messages sent to the server are passed to the business logic. A JavaScript
script can be created for each topic, e.g. `3ea8f06baf64/mytopic` translates
to the script `3ea8f06baf64_mytopic.js`. The scripts runs in a NodeJS process.
All scripts are sandboxed using the NodeJS `vm` module. The scripts has access
to the MySQL account of the account and can also publish mqtt messages.
