var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');

var File = module.exports = function (opts, name) {
    if (!(this instanceof File)) return new File(opts, name);
    this.json = opts.hasOwnProperty('json') && opts.json;
    this.timestamp = opts.hasOwnProperty('timestamp') ? opts.timestamp : 'YYYY-MM-DDTHH:mm:ss';
    this.defaultFormat = name ? ':time :name.:level:tags: :data' : ':time :level: :data';
    this.format = opts.hasOwnProperty('format') ? opts.format : this.defaultFormat;
    this.accessFormat = opts.hasOwnProperty('accessFormat') ? opts.accessFormat : ':remote - - [:time] ":method :url HTTP/:http_ver" :status :length :res_time ":referer" ":agent"';
    this.defaultExceptionFormat = name ? ':time :name.:level:tags: :message\n :stack' : ':time :level: :message\n :stack';
    this.exceptionFormat = opts.hasOwnProperty('exceptionFormat') ? opts.exceptionFormat : this.defaultExceptionFormat;
    this.defaultStatFormat = name ? ':time :name.:level:tags: :statName(:type):value' : ':time :level:tags: :statName(:type):value';
    this.statFormat = opts.hasOwnProperty('statFormat') ? opts.statFormat : this.defaultStatFormat;
    this.filename = typeof opts === 'string' ? opts : opts.filename;
    mkdirp.sync(path.dirname(this.filename));
    this.filestream = fs.createWriteStream(this.filename, { encoding: 'utf8', flags: 'a+' });
    this.name = name || '';

    var self = this;
    this.objMap = {
        ':name': function(module) {
            return module || self.name;
        },
        ':remote': function(module, data) {
            return data.remote_ip
        },
        ':time': function(module, data) {
            return self.timestamp ? data.time.format(self.timestamp) : data.time.toDate().toUTCString();
        },
        ':method': function(module, data) {
            return data.method;
        },
        ':url': function(module, data) {
            return data.url;
        },
        ':http_ver': function(module, data) {
            return data.http_ver;
        },
        ':status': function(module, data) {
            return data.status;
        },
        ':res_time': function(module, data) {
            return data.response_time;
        },
        ':length': function(module, data) {
            return data.length;
        },
        ':referer': function(module, data) {
            return data.referer;
        },
        ':agent': function(module, data) {
            return data.agent;
        },
        ':tags': function(module, data, tags) {
            return tags.length ? ('[' + tags.join(',') + ']') : '';
        }
    };
    if (this.json) {
        if (typeof(this.accessFormat) === 'object') {
            var accessTransformFuncs = [];
            for (var key in this.accessFormat) {
                var valFunc = this.objMap[this.accessFormat[key]];
                accessTransformFuncs.push({
                    key: key,
                    valFunc: valFunc
                });
            }
            this.accessTransform = function(target, module, data, tags) {
                accessTransformFuncs.forEach(function(trans) {
                    target[trans.key] = trans.valFunc(module, data, tags);
                });
            }
        }
    }
};

File.prototype.log = function (time, level, module, data, tags) {
    var line = this.format;
    var name = module || this.name;
    var tagstring;

    if (name) line = line.replace(':name', name);
    line = this.timestamp ? line.replace(':time', time.format(this.timestamp)) : line.replace(':time ', '');
    line = line.replace(':level', level);
    line = line.replace(':data', data);
    tagstring = tags.length ? ('[' + tags.join(',') + ']') : '';
    line = line.replace(':tags', tagstring);
    this.filestream.write(line);
};

File.prototype.access = function (module, data, tags) {
    var line;
    if (this.json) {
        var target = {};
        this.accessTransform(target, module, data, tags);
        line = JSON.stringify(target);
    } else {
        line = this.accessFormat;
        var name = module || this.name;
        var tagstring = tags.length ? ('[' + tags.join(',') + ']') : '';

        if (name) line = line.replace(':name', name);
        line = line.replace(':remote', data.remote_ip);
        line = line.replace(':time', this.timestamp ? data.time.format(this.timestamp) : data.time.toDate().toUTCString());
        line = line.replace(':method', data.method);
        line = line.replace(':url', data.url);
        line = line.replace(':http_ver', data.http_ver);
        line = line.replace(':status', data.status);
        line = line.replace(':res_time', data.response_time);
        line = line.replace(':length', data.length);
        line = line.replace(':referer', data.referer);
        line = line.replace(':agent', data.agent);
        line = line.replace(':tags', tagstring);
    }
    this.filestream.write(line + '\n');
};

File.prototype.exception = function (time, module, err, tags) {
    var line = this.exceptionFormat;
    var name = module || this.name;
    var tagstring = tags.length ? ('[' + tags.join(',') + ']') : '';

    if (name) line = line.replace(':name', name);
    line = this.timestamp ? line.replace(':time', time.format(this.timestamp)) : line.replace(':time ', '');
    line = line.replace(':level', 'exception');
    line = line.replace(':message', err.message);
    line = line.replace(':stack', err.stack);
    line = line.replace(':tags', tagstring);
    this.filestream.write(line + '\n');
};

File.prototype.stat = function (time, module, statName, type, value, tags) {
    var line = this.statFormat;
    var name = module || this.name;
    var tagstring = tags.length ? ('[' + tags.join(',') + ']') : '';

    if (name) line = line.replace(':name', name);
    line = this.timestamp ? line.replace(':time', time.format(this.timestamp)) : line.replace(':time ', '');
    line = line.replace(':level', 'stat');
    line = line.replace(':statName', statName);
    line = line.replace(':type', type);
    line = line.replace(':value', value);
    line = line.replace(':tags', tagstring);
    this.filestream.write(line + '\n');
};
