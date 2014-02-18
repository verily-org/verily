# Overview
The web service allows questions to be added, updated and removed. Comments can be added to questions for remarks on the content of the question. Answers can be added to questions in response to a question posed. Comments can also be added to answers for remarks on the content of the answer.

Cache validation is supported through the use of ETags on the server-side and the HTTP header "If-None-Match" in client requests to the Web Service.


# Installation
The following steps aim to provide a brief guide on how to set up the web service on Ubuntu Server LTS 12.04.

1. Install Node.js

        sudo apt-get update
        sudo apt-get install build-essential
        sudo apt-get install curl
        echo 'export PATH=$HOME/local/bin:$PATH' >> ~/.bashrc
        . ~/.bashrc
        mkdir ~/local
        mkdir ~/node-latest-install
        cd ~/node-latest-install
        curl http://nodejs.org/dist/node-latest.tar.gz | tar xz --strip-components=1
        ./configure --prefix=~/local
        make install
        curl https://npmjs.org/install.sh | sh

2. Install and updated required packages with ```npm update```

# Usage

## Run
To run the server with the existing database use:

```node index```

When the server has started, in a new shell you can issue HTTP requests, via cURL for example.

On the first run, there will be no existing database, so this is equivalent to running from a clean start.

## Run from clean start
To run the server with an empty database use:

```node index -r```

For the first run, the ```-r``` option is not necessary.

# API
For documentation of the API with endpoints and examples, see [```doc/api.html```](doc/api.html) or [```doc/api.md```](doc/api.md).

# Test
To run the system testing script, ensure the web service server is not running, then execute:

```npm test```

This starts the web service server from a clean start and tests questions, question comments, answers and answer comments and the integration of such.

The test script can also be executed in a two-step process with 2 shells:

    node index -r
    node test

## Shell script
A shell script, ```bin/demo.sh```, provides a series of cURL commands that request each endpoint of the web service.

## JSLint conformance script
To test the conformance of the code to JSLint, run ```bin/jslint-check.sh```.
Before running, ensure you have globally installed JSLint: ```npm install jslint -g```.

