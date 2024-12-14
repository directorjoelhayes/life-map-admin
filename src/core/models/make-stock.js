/**
 * Creates a stock object with the provided properties.
 *
 * @param {Object} param0 - The stock properties.
 * @param {string} param0._id - The unique identifier for the stock.
 * @param {string} param0.s - The stock symbol.
 * @param {string} [param0.c=""] - The stock category.
 * @param {string} [param0.market=""] - The market where the stock is traded.
 * @param {string} [param0.typeOf=""] - The type of stock.
 * @param {number|null} [param0.price=null] - The current price of the stock.
 * @param {number} [param0.stop=0] - The stop loss value.
 * @param {string} [param0.sector=""] - The sector to which the stock belongs.
 * @param {number} [param0.trigger=0] - The trigger value for the stock.
 * @param {number|null} [param0.risk=null] - The risk associated with the stock.
 * @param {number|null} [param0.shares=null] - The number of shares.
 * @param {number} [param0.rank=0] - The rank of the stock.
 * @param {number} [param0.rs=0] - The relative strength of the stock.
 * @param {string} [param0.status="focus"] - The status of the stock.
 * @param {string|null} [param0.owner_id=null] - The ID of the owner of the stock.
 * @param {number} [param0.deleted=0] - The deletion status of the stock.
 * @returns {Object} The stock object.
 */

export function makeStock({
    _id,
    s,
    c = "",
    market = "",
    typeOf = "",
    price = null,
    stop = 0,
    sector = "",
    trigger = 0,
    risk = null,
    shares = null,
    rank = 0,
    rs = 0,
    status = "focus",
    owner_id = null,
    deleted = 0
} = {}) {

    if(!s) {
        throw new Error("Stock symbol is required.");
    }

    // Convert the stock symbol to uppercase and replace any forward slashes with periods.
    s = s.toUpperCase().split("/").join(".");

    return {
        _id,
        s,
        c,
        market,
        typeOf,
        price,
        stop,
        sector,
        trigger,
        risk,
        shares,
        rank,
        rs,
        status,
        owner_id,
        deleted
    };
}