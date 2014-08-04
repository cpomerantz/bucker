/**
 * Loggly transport
 * @Author: Chris Moyer <cmoyer@newstex.com>
 *
 * Configuring Loggly:
 *    loggly: {
 *      token: 'YOUR LOGGLY TOKEN',
 *      subdomain: 'YOURSUBDOMAIN',
 *      tags: [ 'Optional', 'Tags'],
 *    }
 */
'use strict';

var BaseTransport = require('../lib/baseTransport');
var Loggly = BaseTransport.extend(function () {
    require('loggly');
});


/**
 * Verify the options are configured properly
 */
Loggly.prototype.validate = function (options, callback) {
    var loggly = require('loggly');
    this.client = loggly.createClient(options);
    callback();
};

/**
 * Send a message to Loggly
 */
Loggly.prototype._send = function (level, name, timestamp, tags, data) {
    var self = this;
    var payload = {
        '@timestamp': timestamp.toISOString(),
        '@level': level,
        '@name': name,
        '@tags': tags,
    };

    if (typeof data === 'object'){
        Object.keys(data).forEach(function(k){
            payload[k] = data[k];
        });
    } else {
        payload.message = data;
    }

    self.client.log(JSON.stringify(payload));
};

Loggly.prototype.stat = function (name, timestamp, tags, data) {
    this._send('stat', name, timestamp, tags, data);
};

Loggly.prototype.debug = function (name, timestamp, tags, data) {
    this._send('debug', name, timestamp, tags, data);
};

Loggly.prototype.info = function (name, timestamp, tags, data) {
    this._send('info', name, timestamp, tags, data);
};

Loggly.prototype.warn = function (name, timestamp, tags, data) {
    this._send('warn', name, timestamp, tags, data);
};

Loggly.prototype.error = function (name, timestamp, tags, data) {
    this._send('error', name, timestamp, tags, data);
};

Loggly.prototype.exception = function (name, timestamp, tags, data) {
    this._send('exception', name, timestamp, tags, data);
};

Loggly.prototype.access = function (name, timestamp, tags, data) {
    this._send('access', name, timestamp, tags, data);
};

module.exports = Loggly;
