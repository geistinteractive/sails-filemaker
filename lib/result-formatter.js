/*
utility for processing results into an instance of the model

from - https://github.com/zohararad/sails-rest/blob/master/SailsRest.js

*/

var _ = require('lodash');


/**
 *
 * @param result
 * @param collectionName
 * @param config
 * @param definition
 * @returns {*}
 */
function formatResult(result, collectionName, config, definition) {
	/*if (_.isFunction(config.beforeFormatResult)) {
		result = config.beforeFormatResult(result, collectionName, config, definition);
	}*/

	_.each(definition, function(def, key) {
		var value = result[key] || null;

		if (def.type.match(/date/i)) {
			result[key] = new Date( value);
		}else if (def.type === 'boolean') {
			if (value === 'true' || value === 1 || value === '1')
				result[key] = true
			else{
				result[key] = false
			}
		}else if(def.type === 'float'){
			if(value === null){
				result[key] = null
			}else{
				result[key] = parseFloat( value )
			}
		}else if(def.type === 'integer'){
			if(value === null){
				result[key] = null
			}else{
				result[key] = parseInt( value )
			}
		}else{
			result[key] = value
		}

	});

	if (result.createdAt) {
		result.createdAt = new Date(result.createdAt);
	}

	if (result.updatedAt) {
		result.updatedAt = new Date(result.updatedAt);
	}

	/*if (_.isFunction(config.afterFormatResult)) {
		result = config.afterFormatResult(result, collectionName, config, definition);
	}*/

	return result;
}

/**
 * Format results according to schema
 * @param {Array} results - objects (model instances)
 * @param {String} collectionName - collection the result object belongs to
 * @param {Object} config - connection configuration
 * @param {Object} definition - collection definition
 * @returns {Array}
 */
function formatResults(results, collectionName, config, definition) {
	/*if (_.isFunction(config.beforeFormatResults)) {
		results = config.beforeFormatResults(results, collectionName, config, definition);
	}*/

	results.forEach(function(result) {
		formatResult(result, collectionName, config, definition);
	});

	/*if (_.isFunction(config.afterFormatResults)) {
		results = config.afterFormatResults(results, collectionName, config, definition);
	}*/

	return results;
}

/**
 * Ensure results are contained in an array. Resolves variants in API responses such as `results` or `objects` instead of `[.....]`
 * @param {Object|Array} data - response data to format as results array
 * @param {String} collectionName - collection the result object belongs to
 * @param {Object} config - connection configuration
 * @param {Object} definition - collection definition
 * @returns {Object|Array}
 */
function getResultsAsCollection(data, collectionName, config, definition) {
	var d = (data.objects || data.results || data),
		a = _.isArray(d) ? d : [d];

	return formatResults(a, collectionName, config, definition);
}


module.exports = {
	getResultsAsCollection : getResultsAsCollection,
	getResultAsInstance : formatResult
};
