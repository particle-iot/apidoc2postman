const _ = require('lodash');
const h2p = require('html2plaintext');
const {
  getReasonPhrase,
} = require('http-status-codes');
const collectionSchema = {
  info: {
    name: '',
    description: '',
    version: '',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/'
  },
  item: []
};
let apiRoot = '{{url}}';
let sortByType = 'verbs';

const HTTP_VERBS = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'copy',
  'head',
  'options',
  'link',
  'unlink',
  'purge',
  'lock',
  'unlock',
  'propfind',
  'view'
];

function toCollection(apidocJson, projectJson, appOption) {
  sortByType = appOption.sortby || 'verbs';
  // Create Postman collection to be returned - starting from collectionSchema
  const collection = _.cloneDeep(collectionSchema);
  setInfo(collection, projectJson);
  setItems(collection, apidocJson);
  setVariables(collection, projectJson);
  setAuth(collection);
  return collection;
}

function setInfo(collection, projectJson) {
  _.set(collection, 'info.name', projectJson.name);
  _.set(collection, 'info.description', projectJson.description);
  _.set(collection, 'info.version', projectJson.version);
}
function setVariables(collection, projectJson) {
  collection.variables = [
    {
      key: 'url',
      value: projectJson.url
    }
  ];
}
function setAuth(collection) {
  collection.auth = {
    type: 'bearer',
    bearer: [
      {
        key: 'token',
        value: '{{access_token}}',
        type: 'string'
      }
    ]
  };
}

function setItems(collection, apidocJson) {
  const apiFolders = _.groupBy(apidocJson, item => _folderName(item));
  _.set(
    collection,
    'item',
    _.chain(apiFolders)
      .map((apis, groupName) => _mapApiFolder(groupName, apis))
      .filter((f) => f.item.length > 0)
      .value()
  );
}
function _folderName(item) {
  const group = item?.group.replace(/\.\d*$/, '');
  return `${item.private ? 'PRIVATE - ' : ''}${group}`;
}
function _getSuccessStatusCode(fields) {
  if (fields) {
    const status = _.keys(fields)[0].split(' ');
    const code = _.isUndefined(status[1]) ? status[0] : status[1];

    return {
      status: getReasonPhrase(code),
      code: code,
    };
  }
}
function _mapApiFolder(groupName, apis) {
  return {
    name: groupName,
    item: _.chain(apis)
      .filter((a) => HTTP_VERBS.includes(a.type.toLowerCase()))
      .sortBy((a) => _apiSorter(a, sortByType))
      .map(_mapApiItem)
      .value()
  };
}

function _mapApiItem(apiItem) {
  return {
    name: apiItem.title,
    request: {
      auth: _mapAuth(apiItem),
      method: apiItem.type.toUpperCase(),
      header: _mapHeader(apiItem),
      body: _mapBody(apiItem),
      url: {
        'raw': apiRoot + apiItem.url,
        'host': [
          apiRoot
        ],
        'path': apiItem?.url?.split('/').filter(Boolean),
        'query': mapQuery(apiItem?.query),
        'variables': mapQuery(apiItem?.parameter?.fields?.Parameter)
      },
      description: h2p(apiItem?.description)
    },
    response: _.map(
      apiItem.success?.examples,
      (success, index) => ({
        name: `Response`,
        originalRequest: {
          method: apiItem.type.toUpperCase(),
          header: [
            {
              key: 'Content-Type',
              value: 'application/json'
            }
          ],
          body: _mapBody(apiItem),
          url: {
            'raw': apiRoot + apiItem.url,
            'host': [
              apiRoot
            ],
            path: apiItem?.url?.split('/').filter(Boolean),
          }
        },
        ..._getSuccessStatusCode(apiItem.success.fields),
        _postman_previewlanguage: 'json',
        header: [
          {
            key: 'Content-Type',
            value: 'application/json',
          }
        ],
        body: success.content
      })

    )

  };
}

function _contentType(apiItem) {
  if (Array.isArray(apiItem?.header?.fields?.Header)) {
    return apiItem.header.fields.Header.find((item) => item.field === 'Content-Type')?.defaultValue;
  }
}

function _mapHeader(apiItem) {
  let headers = [];
  if (Array.isArray(apiItem?.header?.fields?.Header)) {
    headers = apiItem.header.fields.Header.map((item) => {
      return {
        key: item.field,
        value: item.defaultValue || item.type,
        description: h2p(item.description)
      };
    });
  }
  const hasContentType = !!_contentType(apiItem);
  if (!hasContentType && _hasBody(apiItem)) {
    headers.push({
      key: 'Content-Type',
      value: 'application/json'
    });
  }
  return headers;
}

function _mapAuth(apiItem) {
  const none = apiItem?.description?.includes('does not require an access token');
  const oauthBasic = apiItem?.description?.includes('OAuth client ID and secret in HTTP Basic Auth');
  const oauthNoSecretBasic = apiItem?.description?.includes('OAuth client ID in HTTP Basic Auth');
  const basic = apiItem?.description?.includes('HTTP Basic Auth');
  if (none) {
    return {
      type: 'noauth'
    };
  }
  if (oauthBasic) {
    return {
      type: 'basic',
      basic: [
        {
          key: 'username',
          value: '{{oauth_client_id}}',
          type: 'string'
        },
        {
          key: 'password',
          value: '{{oauth_client_secret}}',
          type: 'string'
        }
      ]
    };
  }
  if (oauthNoSecretBasic) {
    return {
      type: 'basic',
      basic: [
        {
          key: 'username',
          value: '{{oauth_client_id}}',
          type: 'string'
        }
      ]
    };
  }
  if (basic) {
    return {
      type: 'basic',
      basic: [
        {
          key: 'username',
          value: '{{username}}',
          type: 'string'
        },
        {
          key: 'password',
          value: '{{password}}',
          type: 'string'
        }
      ]
    };
  }

  return null;
}

function _mapParamTypeToObject(apiFieldType) {
  switch (apiFieldType.toLowerCase()) {
    case 'number':
    case 'int':
    case 'integer':
    case 'float':
      return 0;
    case 'bit':
    case 'bit(0/1)':
      return 0;
    case 'boolean':
    case 'bool':
      return false;
    case 'array':
    case 'int[]':
      return [0, 1];
    case 'date':
    case 'datetime':
      return new Date().toISOString();
    case 'string':
      return 'string';
    case 'string[]':
      return ['string', 'string'];
    case 'object':
      return {
        key: 'value'
      };
    case 'point':
      return {
        Lat: 'value',
        Lng: 'value'
      };
    case 'object[]':
      return [
        {
          key: 'value'
        },
        {
          key: 'value'
        }
      ];
  }
}
function _hasBody(apiItem) {
  return ['put', 'post', 'patch'].includes(apiItem.type.toLowerCase());
}

function _mapBody(apiItem) {
  if (!_hasBody(apiItem)) {
    return null;
  }
  // console.log(apiItem)
  if (_.has(apiItem, 'body')) {
    const contentType = _contentType(apiItem);
    if (contentType === 'application/x-www-form-urlencoded') {
      const mappedBody = apiItem.body.map(bodyItem => ({
        key: bodyItem.field,
        value: _mapParamTypeToObject(bodyItem.type),
        disabled: bodyItem.optional
      }));
      return {
        mode: 'urlencoded',
        urlencoded: mappedBody
      };
    } else {
      const mappedBody = _.reduce(
        apiItem.body,
        (acc, bodyItem) =>
          _.set(acc, bodyItem.field, _mapParamTypeToObject(bodyItem.type)),
        {}
      );
      return {
        mode: 'raw',
        raw: JSON.stringify(mappedBody, undefined, 2)
      };
    }
  }
  return null;
}

function mapQuery(params) {
  if (params) {
    return params.map((param) => {
      return {
        key: param.field,
        value: _mapParamTypeToObject(param.type),
        description: h2p(param.description),
        disabled: param.optional
      };
    });
  }
  return [];
}

function _apiSorter(apiItem, type) {
  switch (type) {
    case 'name':
      return _nameSorter(apiItem);
    case 'title':
      return _titleSorter(apiItem);
    case 'verbs':
      return _httpVerbSorter(apiItem);
    default:
      return _httpVerbSorter(apiItem);
  }
}

function _httpVerbSorter(apiItem) {
  return HTTP_VERBS.findIndex((verbs) => verbs === apiItem.type.toLowerCase());
}
function _nameSorter(apiItem) {
  return apiItem.name.toLowerCase();
}
function _titleSorter(apiItem) {
  return apiItem.title.toLowerCase();
}

module.exports = {
  toCollection: toCollection
};
