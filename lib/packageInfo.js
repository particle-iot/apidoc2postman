/*
 * apidoc
 * http://apidocjs.com
 *
 * Copyright (c) 2013-2016 inveris OHG
 * Author Peter Rottmann <rottmann@inveris.de>
 * Licensed under the MIT license.
 */

const _ = require('lodash');
const fs = require('fs');
const path = require('path');

module.exports = class PackageInfo {
  constructor(_app) {
    this.app = _app;
  }

  get() {
    let result = {};

    const packageJson = this._readData('package.json');

    if (packageJson.apidoc) {
      result = packageJson.apidoc;
    }

    if (!result.name) {
      result.name = '';
    }
    if (!result.version) {
      result.version = '0.0.0';
    }
    if (!result.description) {
      result.description = '';
    }

    // read apidoc.json (and overwrite package.json information)
    const apidocJson = this._readData('apidoc.json');

    // apidoc.json has higher priority
    _.extend(result, apidocJson);

    // options.packageInfo overwrites packageInfo
    _.extend(result, this.app.options.packageInfo);

    // replace header footer with file contents
    _.extend(result, this._getHeaderFooter(result));

    if (Object.keys(apidocJson).length === 0 && !packageJson.apidoc) {
      this.app.log.warn('Please create an apidoc.json configuration file.');
    }

    return result;
  }

  _readData(filename) {
    let result = {};
    const dir = this._getSrcPath();
    const defaultFileName = path.join(dir, filename);
    let jsonFileName = '';

    if (fs.existsSync(defaultFileName)) {
      jsonFileName = defaultFileName;
    } else {
      const configFileName = path.join(this.app.options.config, filename);
      if (fs.existsSync(configFileName)) {
        jsonFileName = configFileName;
      } else {
        this.app.log.debug(filename + ' not found!');
      }
    }

    if (jsonFileName) {
      try {
        result = JSON.parse(fs.readFileSync(jsonFileName, 'utf8'));
        this.app.log.debug('read: ' + jsonFileName);
      } catch (e) {
        throw new Error('Can not read: ' + filename + ', please check the filename format (e.g. missing comma).');
      }
    }

    return result;
  }

  _getHeaderFooter(json) {
    const parseData = (key) => {
      if (json[key] && json[key].filename) {
        const dir = this._getSrcPath();
        let filename = path.join(dir, json[key].filename);

        if (!fs.existsSync(filename)) {
          filename = path.join('./', json[key].filename);
        }

        try {
          this.app.log.debug('read header file: ' + filename);
          const content = fs.readFileSync(filename, 'utf8');
          return {
            title: json[key].title,
            content: this.app.markdownParser ? this.app.markdownParser.render(content) : content
          };
        } catch (e) {
          throw new Error('Can not read: ' + filename + '.');
        }
      }
    };
    return {
      header: parseData('header'),
      footer: parseData('footer'),
    };
  }

  _getSrcPath() {
    let dir = './';

    if (this.app.options.src instanceof Array) {
      if (this.app.options.src.length === 1) {
        dir = this.app.options.src[0];
      }
    } else {
      if (this.app.options.src) {
        dir = this.app.options.src;
      }
    }
    return dir;
  }
};


