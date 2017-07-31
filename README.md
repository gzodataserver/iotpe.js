JS IOT Process Engine
=====================

JavaScript IoT Process Engine (PE) is a lightweight engine that runs JavaScript
business rules. The engine runs on top of a MySQL database and authentication and
authorization is also handled with MySQL users. A PE account correlates to one
MySQL user.

Communication with the Process Engine is performed using MQTT which is a
pub/sub messaging architecture. PE is using [Mosca](http://www.mosca.io) for
MQTT communication.


Getting started
---------------

Check out `config.js` and make sure that MySQL `hostname` is correct.
Also check the `port` for MQTT so it isn't used by some other process.
Create a MySQL user, if you don't have one already, so you have something to
play around with.

Install the mqtt client (used for testing purposes): `npm install -g mqtt`

Start the server: `npm start`

Run the tests: `npm test`

Subscribe to messages: `mqtt sub --username 'mysql_user' --password 'secret' -t '/mysql_user/calc' -h 'hostname' -v`

Publish a message: `mqtt pub --username 'mysql_user' -P 'homeend' -t '/mysql_user/calc' -h 'hostname' -m 'Hello world'`

Scripts can be loaded into mysql with a script:
`./load_script.sh <mysql_username> <mysql_password> calc ./scripts/calc.js`

List the scripts in the database: `./list_script.sh <mysql_username> <mysql_password>`


**Docker Executable**

1) Build the image with

    `npm run docker-build`

2) Run the image as containter

    `npm run docker-run`


    Additionally, you can clean or remove all related image and container `npm run docker-clean`.
    To access the container just run `npm run docker-prompt`

For production
--------------

A process manager is needed when running in production. Scripts developed by
users can crash the process so it needs to be monitored and restarted in this
case. Two alternatives is [supervisord](http://supervisord.org) and
[pm2](http://pm2.keymetrics.io) (there are many, it does not matter which one
that is used).

I'll show how to use `pm2` here:

```
# install pm2 globally
npm install -g pm2

# start a process
pm2 start iotpe.js

# show running processes (managed by pm2)
pm2 list

# show logs (streaming), ctrl-c to break out
pm2 logs


# restart a process, for instance after changing some configuration
pm2 restart iotpe

# stop the process
pm2 stop iotpe
```


Messaging
---------

MQTT Has three Quality Of Service (QoS) levels:

* QoS 0 - At most once delivery
* QoS 1 - At least once delivery
* QoS 2 - Exactly once delivery (Not supported)

Participants in a MQTT communication subscript and published messages in different topics.
Topics can be hierachic using slashes '/' as separators. The wildcard '+' (one level) and
'#' (all remaining leverls) are  allowed when subscribing.


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
# Subsrcibe to a topic
mqtt sub --username '6adb637f9cf2' -P 'secret' -t '/3ea8f06baf64/hello' -h 'localhost' -v

# Publish a message for this topic in another terminal
mqtt pub --username '3ea8f06baf64' -P 'secret' -t '/3ea8f06baf64/hello' -h 'localhost' -m 'Hello world'
```

Business Logic
--------------

Messages sent to the server are passed to the business logic. A JavaScript
script can be created for each topic, e.g. `/3ea8f06baf64/run/myscript` will
run the script named `myscript` in the database. IT is also possible to run scripts
stored in files like this: `/3ea8f06baf64/runfile/myscript` . The scripts runs in a NodeJS process.
All scripts are sandboxed using the NodeJS `vm` module. The scripts have access
to the MySQL account of the account and can also publish mqtt messages.


Todo
----

**WORK IN PROGRESS**

Granting and revoking privileges for publishing and subscribing to topics is
performed like this:

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
