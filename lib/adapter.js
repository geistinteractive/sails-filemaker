/**
 * Module Dependencies
 */
// ...
// e.g.
// var _ = require('lodash');
// var mysql = require('node-mysql');
// ...
var fms = require('fms-js');
var formatter = require('./result-formatter');
var newFindRequest = require('./utils').newFindRequest;
var newDeleteRequest = require('./utils').deleteRequest;
var async = require('async');
var _ = require('lodash');


/**
 * waterline-filemaker
 *
 * Most of the methods below are optional.
 *
 * If you don't need / can't get to every method, just implement
 * what you have time for.  The other methods will only fail if
 * you try to call them!
 *
 * For many adapters, this file is all you need.  For very complex adapters, you may need more flexiblity.
 * In any case, it's probably a good idea to start with one file and refactor only if necessary.
 * If you do go that route, it's conventional in Node to create a `./lib` directory for your private submodules
 * and load them at the top of the file with other dependencies.  e.g. var update = `require('./lib/update')`;
 *
 */


module.exports = (function () {


  // You'll want to maintain a reference to each connection
  // that gets registered with this adapter.
  var adapter;
  var connections = {};


  // You may also want to store additional, private data
  // per-connection (esp. if your data store uses persistent
  // connections).
  //
  // Keep in mind that models can be configured to use different databases
  // within the same app, at the same time.
  //
  // i.e. if you're writing a MariaDB adapter, you should be aware that one
  // model might be configured as `host="localhost"` and another might be using
  // `host="foo.com"` at the same time.  Same thing goes for user, database,
  // password, or any other config.
  //
  // You don't have to support this feature right off the bat in your
  // adapter, but it ought to get done eventually.
  //

  adapter = {

    // Set to true if this adapter supports (or requires) things like data types, validations, keys, etc.
    // If true, the schema for models using this adapter will be automatically synced when the server starts.
    // Not terribly relevant if your data store is not SQL/schemaful.
    //
    // If setting syncable, you should consider the migrate option,
    // which allows you to set how the sync will be performed.
    // It can be overridden globally in an app (config/adapters.js)
    // and on a per-model basis.
    //
    // IMPORTANT:
    // `migrate` is not a production data migration solution!
    // In production, always use `migrate: safe`
    //
    // drop   => Drop schema and data, then recreate it
    // alter  => Drop/add columns as necessary.
    // safe   => Don't change anything (good for production DBs)
    //
    syncable: false,


    // Default configuration for connections
    defaults: {
      schema: false,
      ssl: false
    },


    /**
     *
     * This method runs when a model is initially registered
     * at server-start-time.  This is the only required method.
     *
     * @param  {[type]}   connection        the default configs from all levels
     * @param  {[type]}   collections   all the models
     * @param  {Function} cb            [description]
     * @return {[type]}                 [description]
     */
    registerConnection: function (connection, collections, cb) {

      var connectionIdentity;

      //the unique name of the connection as specified in connections/config.js
      connectionIdentity = connection.identity


      if (!connectionIdentity) return cb(new Error('Connection is missing an identity.'));
      if (connections[connectionIdentity]) return cb(new Error('Connection is already registered.'));


      // create the FileMaker DB Object
      var fmDB = fms.connection({
        url: connection.host,
        userName: connection.userName,
        password: connection.password
      }).db(connection.database);


      //store the connection object, a reference to collections, and and a reference to the connection config
      connections[connectionIdentity] = {
        fmDB: fmDB,
        collections: collections,
        config: connection
      };

      cb();
    },


    /**
     * Fired when a model is unregistered, typically when the server
     * is killed. Useful for tearing-down remaining open connections,
     * etc.
     *
     * @param  {Function} cb [description]
     * @return {[type]}      [description]
     */
    // Teardown a Connection
    teardown: function (conn, cb) {

      if (typeof conn == 'function') {
        cb = conn;
        conn = null;
      }
      if (!conn) {
        connections = {};
        return cb();
      }
      if (!connections[conn]) return cb();
      delete connections[conn];
      cb();
    },

    // Return attributes
    describe: function (connection, collection, cb) {
      // Add in logic here to describe a collection (e.g. DESCRIBE TABLE logic)
      return cb();
    },

    /**
     *
     * REQUIRED method if integrating with a schemaful
     * (SQL-ish) database.
     *
     */
    define: function (connection, collection, definition, cb) {
      // Add in logic here to create a collection (e.g. CREATE TABLE logic)
      return cb();
    },

    /**
     *
     * REQUIRED method if integrating with a schemaful
     * (SQL-ish) database.
     *
     */
    drop: function (connection, collection, relations, cb) {
      // Add in logic here to delete a collection (e.g. DROP TABLE logic)
      return cb();
    },

    /**
     *
     * REQUIRED method if users expect to call Model.find(), Model.findOne(),
     * or related.
     *
     * You should implement this method to respond with an array of instances.
     * Waterline core will take care of supporting all the other different
     * find methods/usages.
     *
     */
    find: function (connectionIdentity, collection, options, cb) {

      var connection;
      var definition;
      var layoutName;
      var fmLayout;
      var fmFindRequest;
      var sort;
      var skip;
      var limit


      // get the connection
      connection = connections[connectionIdentity];

      // get the model definition
      definition = connection.collections[collection].definition;

      // the layoutName is the collection
      layoutName = collection;

      //create an FileMaker Find Request
      fmLayout = connection.fmDB.layout(layoutName);
      fmFindRequest = newFindRequest(fmLayout, options.where);

      // add the sort options if their are any
      sort = options.sort;
      if (sort) {
        var n = 1
        var sortFields = Object.keys(sort);
        sortFields.forEach(function (fieldName) {
          fmFindRequest
            .set('-sortfield.' + n, fieldName)
            .set('-sortorder.' + n, 'ascend');
          n++;
        })
      }

      // add skip if there is any
      skip = options.skip;
      if ( skip ){
        fmFindRequest.set('-skip', skip );
      }

      // add max if there is any
      limit = options.limit;
      if ( limit ){
        fmFindRequest.set('-max', limit );
      }


      //send the find request
      return fmFindRequest.send(function (err, result) {
        var data = [];
        if (err) return cb(err);
        if (result.error === '0') {
          data = formatter.getResultsAsCollection(result.data, collection, null, definition)
        }
        return cb(null, data)
      })

    },


    /**
     * Waterline calls this on create
     *
     * @param connectionIdentity    the uniqueID of the connection
     * @param collection            the name of the collection. 'user'
     * @param values                the values that are being used to create
     * @param cb                    the function that will be called
     * @returns {*}
     */
    create: function (connectionIdentity, collection, values, cb) {

      var connection;
      var definition;
      var layoutName;
      var createRequest;

      // get the connection
      connection = connections[connectionIdentity];

      // get the model definition
      definition = connection.collections[collection].definition;

      // the layoutName is the collection
      layoutName = collection;

      // hacky - but for now I am only using FMs built in facililty for timeStamps
      delete values.createdAt
      delete values.updatedAt


      // get a create Request
      createRequest = connection
        .fmDB
        .layout(layoutName)
        .create(values);

      //send the create request
      return createRequest.send(function (err, result) {
        if (err) return cb(err);
        var collection = formatter.getResultsAsCollection(result.data, collection, null, definition);
        return cb(null, collection[0])
      })
    },

    update: function (connectionIdentity, collection, options, values, cb) {

      var connection;
      var layoutName;
      var fmLayout;
      var findRequest;


      // we are relying on FM to do this
      delete values.updatedAt

      // get the connection
      connection = connections[connectionIdentity];

      // get the model definition
      definition = connection.collections[collection].definition;

      // the layoutName is the collection
      layoutName = collection;
      fmLayout = connection.fmDB.layout(layoutName);

      findRequest = newFindRequest(fmLayout, options.where);
      findRequest.send(function (err, result) {
        var records;


        if (err) return cb(err);
        records = result.data;
        var updatedRecords = [];
        async.each(
          // array of records
          records,

          // iterator function to act on each record
          function (record, cb) {
            /*
             if the modid is being passed in then we need to overwrite in on the found record
             the modid is used as currency control. If it doesn't match the update will fail
             so if a values contains an out of date recid we need to make sure it causes the failure
             if the modid is not included in the values then the update will go through even if it is
             of date

             if(values.modid){
             record.modid = values.modid
             }*/

            var valuesToUpdate = _.cloneDeep(values);
            valuesToUpdate['-recid'] = record.recid;

            var updateRequest = fmLayout.edit(valuesToUpdate);
            updateRequest.send(function (err, result) {
              if (!err) {
                // if it was updated add it to the array
                updatedRecords.push(result.data[0])
              }
              cb(null)
            })
          },

          // finall callback when done
          function (err) {
            if (err) return cb(err);
            var data = formatter.getResultsAsCollection(updatedRecords, collection, null, definition)
            return cb(null, data)
          }
        )


      });

    },

    destroy: function (connectionIdentity, collection, options, cb) {


      var connection;
      var layoutName;
      var fmLayout;
      var findRequest;


      // get the connection
      connection = connections[connectionIdentity];

      // the layoutName is the collection
      layoutName = collection;
      fmLayout = connection.fmDB.layout(layoutName);
      findRequest = newFindRequest(fmLayout, options.where)


      findRequest.send(function (err, result) {
        if (err) return cb(err);
        var records = result.data
        var deletedRecords = [];
        async.each(
          // array of records
          records,

          // iterator function to act on each record
          function (record, cb) {
            var deleteRequest = newDeleteRequest(fmLayout, record.recid)
            deleteRequest.send(function (err) {
              if (!err) {
                // if it was deleted add it to the array
                deletedRecords.push(record)
              }
              cb(null)
            })
          },

          // finall callback when done
          function (err) {
            if (err) return cb(err);
            return cb(null, deletedRecords)
          }
        )


      });

    }

    /*

     // Custom methods defined here will be available on all models
     // which are hooked up to this adapter:
     //
     // e.g.:
     //
     foo: function (collectionName, options, cb) {
     return cb(null,"ok");
     },
     bar: function (collectionName, options, cb) {
     if (!options.jello) return cb("Failure!");
     else return cb();
     destroy: function (connection, collection, options, values, cb) {
     return cb();
     }

     // So if you have three models:
     // Tiger, Sparrow, and User
     // 2 of which (Tiger and Sparrow) implement this custom adapter,
     // then you'll be able to access:
     //
     // Tiger.foo(...)
     // Tiger.bar(...)
     // Sparrow.foo(...)
     // Sparrow.bar(...)


     // Example success usage:
     //
     // (notice how the first argument goes away:)
     Tiger.foo({}, function (err, result) {
     if (err) return console.error(err);
     else console.log(result);

     // outputs: ok
     });

     // Example error usage:
     //
     // (notice how the first argument goes away:)
     Sparrow.bar({test: 'yes'}, function (err, result){
     if (err) console.error(err);
     else console.log(result);

     // outputs: Failure!
     })


*/




  };


  // Expose adapter definition
  return adapter;

})();

