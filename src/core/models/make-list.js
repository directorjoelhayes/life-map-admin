

/**
 * Factory function to create a makeList function.
 * 
 * @returns {Function} A function that creates a list object.
 * 
 * @function makeList
 * @param {Object} [params={}] - The parameters for creating the list.
 * @param {string} [params._id] - The unique identifier for the list.
 * @param {string} [params.name="Untitled List"] - The name of the list.
 * @param {string} [params.type="complex"] - The type of the list.
 * @param {Array.<string|Object>} [params.stocks=[]] - The stocks in the list, either as strings or objects.
 * @param {Object|null} [params.customData=null] - Custom data associated with the list.
 * @param {number} [params.deleted=0] - Flag indicating if the list is deleted.
 * 
 * @returns {Object} The created list object.
 * @returns {string} return._id - The unique identifier for the list.
 * @returns {string} return.name - The name of the list.
 * @returns {string} return.type - The type of the list.
 * @returns {Array.<string>} return.stocks - The stocks in the list as strings.
 * @returns {Object|null} return.customData - Custom data associated with the list.
 * @returns {number} return.deleted - Flag indicating if the list is deleted.
 */

export function buildMakeList() {
    return function makeList({
        _id,
        name = "Untitled List",
        type = "complex",
        stocks = [],
        customData = null,
        deleted = 0
    } = {}) {

        if (stocks.length !== 0) {
            //takes an array of string or object and returns an array of strings
            stocks = stocks.map((stock) => {
                if (typeof stock === 'string') return stock;
                else if (typeof stock === 'object') {
                    return stock.s ? stock.s : stock.symbol;
                }
            });
        }

        return {
            _id,
            name,
            type,
            stocks,
            customData,
            deleted,
            // createdOn,
            // updatedOn
        };
    };
}
