/**
 * Module Dependencies
 */
// ...
// e.g.
// var _ = require('lodash');
// var mysql = require('node-mysql');
// ...
var fms = require('fms-js');
var formatter = require( './result-formatter' );
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

	var adapter = {

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
			// For example, MySQLAdapter might set its default port and host.
			port: 80,
			// host: 'localhost',
			// schema: true,
			// ssl: false,
			// customThings: ['eh']
		},



		/**
		 * generates a new Find Request given a where object and a fms-js layout
		 * @param layout
		 * @param where
		 * @returns fms-js findRequest
		 */
		newFindRequest : function(layout, where){

			var findRequest

			/*map operators */
			var operatorMap = {
				lessThan : 'lt',
					'<' : 'lt',
					'lessThanOrEqual' : 'lte',
					'<=' : 'lte',
					'greaterThan' : 'gt',
					'>' : 'gt',
					'greaterThanOrEqual' : 'gte',
					'>=' : 'gte',
					'like' : 'eq',  // add the string to the criteria ex  'this%Andthat'
					'contains' : 'cn',
					'startsWith' : 'bw',
					'endsWith' : 'ew',
			}


			/* handle different types of where  */
			if(_.isObject(where)) {
				/*noop*/
			}else if(where === null) {
				where = null
			}else{
				//TODO get the primary key from the model definition
				where = {
					'id' : where
				}
			}

			if(_.isObject(where)){
				var fieldNames = Object.keys(where)
				fieldNames.map(function(fieldName){
					var value  = where[fieldName];
					if ( _.isObject(value) ){
						var waterlineOperator = Object.keys(value)[0]
						var criteria = value[waterlineOperator];
						var opFieldName = fieldName + '.op'
						var operator = operatorMap[waterlineOperator]
						where[fieldName] = criteria
						where[opFieldName] = operator

					}
				})
			}
			if ( where === null) {
				findRequest = layout.findall()
			}else{
				findRequest = layout.find(where)
			}
			return findRequest
		},


		/**
		 *
		 * This method runs when a model is initially registered
		 * at server-start-time.  This is the only required method.
		 *
		 * @param  {[type]}   connection [description]
		 * @param  {[type]}   collection [description]
		 * @param  {Function} cb         [description]
		 * @return {[type]}              [description]
		 */
		registerConnection: function(connection, collections, cb) {

			if(!connection.identity) return cb(new Error('Connection is missing an identity.'));
			if(connections[connection.identity]) return cb(new Error('Connection is already registered.'));

			// Add in logic here to initialize connection
			// e.g. connections[connection.identity] = new Database(connection, collections);

			var dbConnection = fms.connection({
				url : '104.238.140.137' ,
				userName : 'admin',
				password : ''
			}).db("ContactsTest")

			connections[connection.identity] = {
				dbConnection : dbConnection,
				collections : collections
			}

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
			if(!connections[conn]) return cb();
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
		find: function (connection, collection, options, cb) {

			var request;
			var sort;
			var definition;
			var layout;

			definition = connections[connection].collections[collection].definition;
			sort = options.sort;

			layout = connections[connection]
				.dbConnection
				.layout('WaterLineTestData');

			request = this.newFindRequest(layout, options.where);


			if (sort) {
				var n = 1
				var sortFields = Object.keys(sort);
				sortFields.forEach(function (fieldName) {
					request
						.set('-sortfield.' + n, fieldName)
						.set('-sortorder.'+ n, 'ascend')

					n ++;
				})
			}

			return request.send(function(err, result){
				var data = [];
				if (err) return cb(err);
				if (result.error === '0' ){
					data = formatter.getResultsAsCollection(result.data, collection, null, definition)
				}
				return cb(null ,data )
			})

		},

		create: function (connection, collection, values, cb) {


			var definition = connections[connection].collections[collection].definition

			delete values.createdAt
			delete values.updatedAt

			return connections[connection]
				.dbConnection
				.layout('WaterLineTestData')
				.create(values).send(function(err, result){
					if (err) return cb(err);

					var collection = formatter.getResultsAsCollection(result.data, collection, null, definition);

					return cb(null , collection[0] )
				})
		},

		update: function (connection, collection, options, values, cb) {
			console.log(options, values)
			return cb();
		},

		destroy: function (connection, collection, options, cb) {

			var	where, layout, findRequest, deleteRequest;



			layout = connections[connection]
				.dbConnection
				.layout('WaterLineTestData')


			findRequest = this.newFindRequest(layout, options.where )



			deleteRequest = function(recid){
				return connections[connection]
					.dbConnection
					.layout('WaterLineTestData')
					.delete(recid)
			};

			findRequest.send(function(err, result){
				if (err) return cb(err);
				var records = result.data
				var deletedRecords = [];
				async.each(

					// array of records
					records,

					// iterator function to act on each record
					function(record, cb){
						deleteRequest(record.recid ).send(function(err){
							if (!err){
								// if it was deleted add it to the array
								deletedRecords.push(record)
							}
							cb(null)
						})
					},

					// finall callback when done
					function(err){
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

