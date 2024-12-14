import deepClone from "../../utils/deep-clone"

const avrg = (list) => {
    const reduced = list.reduce((a, b) => a += b, 0);
    if (reduced === 0) return 0;
    return reduced / list.length
}
const sum = (list) => {
    return list.reduce((a, b) => a += b, 0)
}

// TODO calculate fees

export const average = avrg;
export const total = sum;

export const averageBuyPrice = (orders) => {
    //takes in orders, and averag
    return avrg(
        orders.filter((a) => a.type === "Buy")
            .map((a) => a.price)
    )
}

export const averageSellPrice = (orders) => {
    return avrg(
        orders.filter((a) => a.type === "Sell")
            .map((a) => a.price)
    )
}

const tradeSummary = (orderData, dateRange = false, FIFO = true) => {

    const orders = deepClone(orderData)

    const sells = orders.filter((order) => {
        return order.type === "Sell"
    })

    //clone buy orders, so you don't override data when substracting shares
    const buys = orders.filter((order) => {
        return order.type === "Buy"
    }).map((order) => { return { ...order } })

    if (!FIFO) buys.reverse();

    const reducedTrades = sells.reduce((acc, sellOrder) => {

        let shares = Math.abs(sellOrder.shares);

        const trade = {
            ticker: sellOrder.s,
            profit: 0,
            proceeds: 0,
            cost: 0,
            sellPrice: sellOrder.price,
            buyPriceRange: [],
            orders: [{ ...sellOrder }]
        }

        for (let i = 0; shares > 0; i++) {

            const order = buys[i]

            console.log(order, i, "order!!")

            if (!order) {
                //ran out of stocks, something went wrong
                console.error("Sold more than owned! Something went wrong!");
                throw "Sold more than owned! Something went wrong!"
            }

            if (!trade.orders.filter(a => a._id === order._id).length) {
                //add orders to associated trade, if not found already
                const originalOrder = orders.find(({ _id }) => order._id === _id)
                if (!originalOrder) acc = null;
                trade.orders.push({ ...originalOrder })
            }

            if (order.shares === 0) continue;

            const difference = order.shares - shares;

            if (difference >= 0) {
                //fulfilled order
                if (
                    !dateRange ||
                    (sellOrder.date >= dateRange.startDate && sellOrder.date <= dateRange.endDate)
                ) {
                    trade.profit += (shares * sellOrder.price) - (shares * order.price);
                    trade.proceeds += shares * sellOrder.price;
                    trade.cost += shares * order.price;
                    if (!trade.buyPriceRange.includes(order.price)) trade.buyPriceRange.push(order.price);
                }

                order.shares = order.shares - shares;

                acc.push(trade)
                shares = 0;
            } else {
                //need to keep fulfilling

                //only count stats if within daterange
                if (
                    !dateRange ||
                    (sellOrder.date >= dateRange.startDate && sellOrder.date <= dateRange.endDate)
                ) {
                    trade.profit += (order.shares * sellOrder.price) - (order.shares * order.price);
                    trade.proceeds += order.shares * sellOrder.price;
                    trade.cost += shares * order.price;
                    if (!trade.buyPriceRange.includes(order.price)) trade.buyPriceRange.push(order.price);
                }

                order.shares = 0;
                shares = Math.abs(difference);
            }
        }
        return acc;

    }, [])

    return reducedTrades.reduce((acc, trade) => {
        acc.profit += trade.profit;
        acc.proceeds += trade.proceeds;
        acc.cost += trade.cost;
        acc.sellPriceRange.push(trade.sellPrice);
        acc.buyPriceRange.push(...trade.buyPriceRange);
        acc.orders = [...acc.orders, trade.orders];
        acc.trades.push(trade)
        return acc;
    }, {
        trades: [],
        profit: 0,
        proceeds: 0,
        cost: 0,
        sellPriceRange: [],
        buyPriceRange: [],
        orders: []
    })
}

export const getProfits = (orders, FIFO = true) => {


    const portfolios = orders.reduce((dict, order) => {
        if (!dict[order.portfolio]) {
            dict[order.portfolio] = {}
        }
        return dict;
    }, {

    })

    for (const key in portfolios) {

        const portfolioOrders = orders.filter((order) => {
            return order.portfolio === key
        })

        portfolios[key] = tradeSummary(portfolioOrders)

    }

    console.log(portfolios, "test-data")

    console.log(Object
        .keys(portfolios)
        .map((key) => portfolios[key])
        .flat()
        .map((a) => a.profit), "test-data", "map")

    const total = sum(Object
        .keys(portfolios)
        .map((key) => portfolios[key])
        .flat()
        .map((a) => a.profit))

    return total;

}

export const getWinLossR = ({
    profit,
    cost,
    orders,
    trades
}) => {

    const R = trades.map((trade) => {
        const buyOrders = trade.orders.filter((order) => {
            return order.type === "Buy"
                && order.stop
        })

        console.log(buyOrders, "buy orders")

        if (!buyOrders.length) return 0;

        const stopAveragePercent = buyOrders.reduce((acc, order) => {
            acc += (order.price - order.stop) / order.price;
            return acc;
        }, 0) / buyOrders.length;

        console.log(stopAveragePercent, "average percent")

        const profitPercent = trade.profit / trade.cost;
        console.log(profitPercent / stopAveragePercent, "R");
        return profitPercent / stopAveragePercent
    }).filter((r) => r)

    return R;
}

export const averageLossR = (trades) => {
    return Math.abs(avrg(
        trades.map((trade) => {
            return getWinLossR(tradeSummary(trade.orders))
        })
            .flat(1)
            .filter(winLoss => winLoss < 0))
    )
}

export const averageWinR = (trades) => {
    return avrg(
        trades
            .map((trade) => {
                console.log(trade, "trade")
                return getWinLossR(tradeSummary(trade.orders))
            })
            .flat(1)
            .filter(winLoss => winLoss > 0)
    )
}

export const averageProfit = (trades) => {
    return avrg(
        trades.map((trade) => {
            return tradeSummary(trade.orders).trades
        })
            .flat(1)
            .map((trade) => {
                return trade.profit / trade.cost
            })
            .filter((profit) => profit > 0)
    ) * 100
}

export const averageStop = (trades) => {
    const stops = trades
        .map((trade) => trade.orders)
        .flat(1)
        .filter((order) => order.type === "Buy" && order.stop)
        .map((order) => (order.price - order.stop) / order.price)

    console.log(stops, "stops")
    return avrg(
        stops
    )
}

export const averageLoss = (trades) => {
    return Math.abs(avrg(
        trades.map((trade) => {
            return tradeSummary(trade.orders).trades
        })
            .flat(1)
            .map((trade) => {
                console.log(trade.profit, trade.cost, "hello!!!")
                return trade.profit / trade.cost
            })
            .filter((profit) => profit < 0)
    ) * 100)
}

function getHoldTime(orders) {

    const first = Math.min(...orders.map((a) => a.date));
    const last = Math.max(...orders.map((a) => a.date));
    console.log(last - first, "differences")
    return last - first
}

export const averageHoldWin = (trades) => {
    return avrg(
        trades.map((trade) => {
            return tradeSummary(trade.orders).trades
        })
            .flat(1)
            .filter((trade) => trade.profit > 0)
            .map((trade) => {
                return getHoldTime(trade.orders)
            })
            .filter((time) => time > 0)
    )
}

export const averageHoldLoss = (trades) => {
    return avrg(
        trades.map((trade) => {
            return tradeSummary(trade.orders).trades
        })
            .flat(1)
            .filter((trade) => trade.profit < 0)
            .map((trade) => {
                return getHoldTime(trade.orders)
            })
            .filter((time) => time > 0)
    )
}

export const battingAverage = (trades) => {
    const summary = trades.map((trade) => {
        return tradeSummary(trade.orders).trades
    })

    const wins = summary.flat(1).filter((trade) => trade.profit > 0)
    return wins.length / summary.length
}

export const getRelativeStrength = (stockPrices, marketPrices, period) => {
    // Ensure the arrays are of the same length
    if (stockPrices.length !== marketPrices.length) {
        return 0;
    }

    // Calculate the percentage change over the specified period
    const calculatePercentageChange = (prices) => {
        return prices.map((price, index) => {
            if (index >= period) {
                const startPrice = prices[index - period];
                return ((price - startPrice) / startPrice) * 100;
            }
            return null;
        });
    };

    const stockReturns = calculatePercentageChange(stockPrices.map(a => a.price).slice(Math.max(stockPrices.length - 5, 0)));
    const marketReturns = calculatePercentageChange(marketPrices.map(a => a.price).slice(Math.max(marketPrices.length - 5, 0)));

    // Calculate relative strength as the ratio of stock returns to market returns
    const relativeStrength = stockReturns.map((stockReturn, index) => {
        if (stockReturn !== null && marketReturns[index] !== null) {
            return stockReturn - marketReturns[index];
        }
        return null;
    }).filter((a) => a);



    return relativeStrength.reduce((acc, price) => acc += price, 0) / relativeStrength.length;
}

export const getHeat = (trades, stocks) => {
    console.log(trades, "trades");
    if (!trades) return 0;
    return trades.reduce((total, trade) => {
        if (!stocks[trade.s]) return 0;
        total += (trade.currentStop - stocks[trade.s].price) * sum(trade.orders.map((a) => a.shares))
        return total
    }, 0)

}

export const getExposure = (trades, stocks) => {
    if (!trades) return 0;
    return trades.reduce((total, trade) => {
        if (!stocks[trade.s]) return 0;
        total += stocks[trade.s].price * sum(trade.orders.map((a) => a.shares))
        return total
    }, 0)
}

export const buildTradeDateRules = (trade, order) => {

    return [
        //no sells can be before first buy
        (val) => {

            //see if order is sell
            if (order.type !== "Sell") return true

            const date = new Date(val);
            val = date.getTime();


            const { date: firstDate } = trade.orders[0]

            //first trade
            if (date < firstDate) return "Can't sell before you buy!"

            return true;
        },
        //can't be in the future
        // (val) => {

        // }
    ]
}

export const getSummary = (orderData, dateRange) => {
    try {
        const summary = tradeSummary(orderData, dateRange)
        return summary;
    } catch (err) {
        return new Error(err)
    }
}

export const ordersToTradeGroups = (orders) => {
    return orders.reduce((acc, order) => {

        acc.shares += order.shares;

        if (acc.index !== 0 && acc.shares === 0) {
            //sold all shares
            acc.index = 0;
            
            //push order to last trade
            acc.trades[acc.trades.length - 1].push(order);
            return acc;
        } else {
            //create new trade, with first order
            if (acc.index === 0) acc.trades.push([order])
            //add order to new trade
            else acc.trades[acc.trades.length - 1].push(order);
        }

        acc.index++
        return acc;

    }, { index: 0, shares: 0, trades: [] }).trades
}
