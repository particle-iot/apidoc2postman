# apidoc2postman

> Use [apiDoc](http://apidocjs.com/) to create a [Postman](https://www.getpostman.com) collection.

This library uses the [apidoc-core](https://github.com/apidoc/apidoc-core) library.

## How It Works

By putting `apiDoc` inline comments in the source code, you will get a `postman.json` file which can be imported into the [Postman App](https://www.getpostman.com/apps) to create a new collection.

E.g.

```js
/**
 * @api {GET} /user/id Request User information
 * @apiName GetUser
 * @apiGroup User
 * @apiPermission basic
 *
 * @apiParam {Number} id Users unique ID.
 *
 * @apiSuccess {String} firstname Firstname of the User.
 * @apiSuccess {String} lastname  Lastname of the User.
 */
```

## Installation

`npm install apidoc2postman`

## Features

`apidoc2postman` takes full advantage of [Postman environment variables](https://www.getpostman.com/docs/v6/postman/environments_and_globals/variables) for the following aspects

### API URL

### Authentication

### Body

`apidoc2postman` will setup `Postman` to use `application/json` body format and will create a template body based on the `@apiParam` `Body` group.

E.g.
```js
/**
 * @apiParam (Body) {Number} id ID of the User.
 * @apiParam (Body) {String} name Name of the User.
 */
```
will translate to the following template body
```json
{
  "id": 0,
  "name": "string"
}
```

## Example

`apidoc2postman -i example/ -o doc/`

Have a look at [apiDoc](http://apidocjs.com/#params) for full functionality overview and capabilities of apiDoc.

### Base Postman Environment setup

```json
{
  "base_url": "https://localhost:8000/api/v1",
  "basic_username": "basic_auth_username",
  "basic_password": "basic_auth_password",
  "user_token": "a.user.bearer.token"
}
```
