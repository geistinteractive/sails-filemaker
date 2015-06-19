/**
 * Created by toddgeist on 6/19/15.
 */

var _ = require('lodash');


module.exports = {

    /**
     * generates a new Find Request given a where object and a fms-js layout
     * @param layout
     * @param where
     * @returns fms-js findRequest
     */
    newFindRequest: function (layout, where) {

        var findRequest

        /*map operators */
        var operatorMap = {
            lessThan: 'lt',
            '<': 'lt',
            'lessThanOrEqual': 'lte',
            '<=': 'lte',
            'greaterThan': 'gt',
            '>': 'gt',
            'greaterThanOrEqual': 'gte',
            '>=': 'gte',
            'like': 'eq',  // add the string to the criteria ex  'this%Andthat'
            'contains': 'cn',
            'startsWith': 'bw',
            'endsWith': 'ew',
        }


        /* handle different types of where  */
        if (_.isObject(where)) {
            /*noop*/
        } else if (where === null) {
            where = null
        } else {
            //TODO get the primary key from the model definition
            where = {
                'id': where
            }
        }

        if (_.isObject(where)) {
            var fieldNames = Object.keys(where)
            fieldNames.map(function (fieldName) {
                var value = where[fieldName];
                if (_.isObject(value)) {
                    var waterlineOperator = Object.keys(value)[0]
                    var criteria = value[waterlineOperator];
                    var opFieldName = fieldName + '.op'
                    var operator = operatorMap[waterlineOperator]
                    where[fieldName] = criteria
                    where[opFieldName] = operator

                }
            })
        }
        if (where === null) {
            findRequest = layout.findall()
        } else {
            findRequest = layout.find(where)
        }
        return findRequest
    },

    deleteRequest : function (fmLayout, recid) {
        return fmLayout.delete(recid)
    }






}