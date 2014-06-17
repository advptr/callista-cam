callista-cam
============

Pure HTML5, JavaScript camera stream share application (Google Chrome only)

#### Install

First [node.js](http://nodejs.org/) is required.

```
$ npm install
```


#### Start Server

````
$ node server.js [ --port <port> ] --secret <password>
    port: HTTP listening port, default is 8080
    secret: the secret to enter to access the Web Application. For simplicity basic auth is used and the secret might be given  as username or password.
```
  
#### Connect using a Google Chrome Browser

Open [http://localhost:8080](http://localhost:8080)




