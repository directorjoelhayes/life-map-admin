import { v4 as uuid } from 'uuid';

export function makeOrder({
    type,
    orderType,
    shares,
    status = "FILLED",
    date,
    orderId, 
    symbol, 
    stop = 0,
    fee = 0,
    importType = "AUTOMATIC",
    price,
    portfolioId,
    userId,
    _id = uuid()
} = {}) {
    if (importType !== "AUTOMATIC" && importType !== "MANUAL") {
        throw new Error('Import type must be either AUTOMATIC or MANUAL');
    }
    if (!type) {
        throw new Error('Type is required');
    }  
    if (typeof shares !== 'number') {
        throw new Error('Shares must be a number');
    }
    if (!status) {
        throw new Error('Status is required');
    }
    if (!date) {
        throw new Error('Date is required');
    }
    if (!symbol) {
        throw new Error('Symbol is required');
    }
    if (typeof stop !== 'number') {
        throw new Error('Stop must be a number');
    }
    if (typeof price !== 'number') {
        throw new Error('Price must be a number');
    }
    if (!portfolioId) {
        throw new Error('Portfolio ID is required');
    }
    if (!userId) {
        throw new Error('User ID is required');
    }

    return {
        _id,
        type,
        orderType,
        shares,
        status,
        date,
        orderId,
        symbol,
        stop,
        price,
        fee,
        importType,
        portfolioId,
        userId
    };
}

