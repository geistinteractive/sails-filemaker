![image_squidhome@2x.png](http://i.imgur.com/RIvu9.png)

# sails-filemaker

Provides easy access to [FileMaker](http://www.filemaker.com) Databases hosted on a FileMaker Server from Sails.js & Waterline.

FileMaker is a different sort of database then typically used with Sails.js. This adapter is connects through FileMaker Server's Custom Web Publishing interface. [see guide](https://fmhelp.filemaker.com/docs/14/en/fms14_cwp_guide.pdf).

### Installation

To install this adapter, run:

```sh
$ npm install sails-filemaker
```

### Usage

This adapter exposes the following methods:

###### `find()`

+ **Status**
  + implemented

###### `create()`

+ **Status**
  + implemented

###### `update()`

+ **Status**
  + implemented

###### `destroy()`

+ **Status**
  + implemented


### Interfaces


This adapter implements the [semantic]() interfaces.
For more information, check out this repository's [FAQ](./FAQ.md) and the [adapter interface reference](https://github.com/balderdashy/sails-docs/blob/master/adapter-specification.md) in the Sails docs.

### FileMaker Specific Usage

In `config/connections.js` create an entry for your FileMaker Server and Database, like any other adapter

```javascript
'MyFMDataBase' : {
  host: '<your server address>',
  database : 'DatabaseName',
  userName: '<userName>',
  password : '<password>'
}
```

You can create more then one connection to the same server. Perhaps you need to connect to a second Database...

```javascript
'MyOtherFMDataBase' : {
  host: '<your server address>',
  database : 'AnotherDatabaseName',
  userName: '<userName>',
  password : '<password>'
}
```

FileMaker's Custom Web Publishing uses Layouts to access the underlying tables. So Sails models for filemaker connect to Layouts not Tables. Layouts are sort of like views in that they specify a table, and a set of fields. They can even specify a set of related records and fields.  But they do not specify queries.

This adapter follows the Sails convention of using the file name to derive the layout name. So a User.js model file will connect to a User layout in FileMaker.  If you want to use a different name for your layout, you can set the "tableName" property on the model.

For example

```json
tableName : 'webContacts'
```
Would tell the model to connect to a layout named "webContacts", regardless of it's file name.

This is useful for FileMaker, since it is a common practice to use naming conventions to denote layouts that are only used for web access.



Check out **Connections** in the Sails docs, or see the `config/connections.js` file in a new Sails project for information on setting up adapters.

### Running the tests

You will need to load the ContactsTest.fmp12 file on to your FileMaker Server. There is a copy of this file in `test/fixtures/ContactsTest.fmp12`

If your Server is not on localhost you will need to change the config in `test/integration/runner.js`

```javascript
  // Default adapter config to use.
  config: {
    schema: false,
    host: '<localhost>', // change to your server
    database: 'ContactsTest',
    userName: 'admin',
    password: ''
  }
  ```


Then in your adapter's directory, run:

```sh
$ npm test
```



### Questions?

See [`FAQ.md`](./FAQ.md).



### More Resources

- [Stackoverflow](http://stackoverflow.com/questions/tagged/sails.js)
- [#sailsjs on Freenode](http://webchat.freenode.net/) (IRC channel)
- [Twitter](https://twitter.com/sailsjs)
- [Professional/enterprise](https://github.com/balderdashy/sails-docs/blob/master/FAQ.md#are-there-professional-support-options)
- [Tutorials](https://github.com/balderdashy/sails-docs/blob/master/FAQ.md#where-do-i-get-help)
- <a href="http://sailsjs.org" target="_blank" title="Node.js framework for building realtime APIs."><img src="https://github-camo.global.ssl.fastly.net/9e49073459ed4e0e2687b80eaf515d87b0da4a6b/687474703a2f2f62616c64657264617368792e6769746875622e696f2f7361696c732f696d616765732f6c6f676f2e706e67" width=60 alt="Sails.js logo (small)"/></a>


### License

**[MIT](./LICENSE)**
&copy; 2015 [toddgeist](http://github.com/toddgeist)
[Todd Geist](http://twitter.com/toddgeist), [geist interactive](http://www.geistinteractive.com)

[Sails](http://sailsjs.org) is free and open-source under the [MIT License](http://sails.mit-license.org/).


