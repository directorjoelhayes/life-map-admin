import { defineStore } from 'pinia'
import { v4 as uuid } from "uuid"
import { getSummary } from '../utils/finance-formulas'
// useStore could be anything like useUser, useCart
// the first argument is a unique id of the store across your application

const globalState = {
    // all these properties will have their type inferred automatically
    // number: 5,
    instance: uuid(),
    loaded: false,
    //DOM elements
    mounted: {},
    stocks: {},
    strategies: [],
    portfolios: [],
    trades: [],
    orders: [],
    lists: [],
    sortOrder: {},
    sortMethod: (a, b) => a - b
}

const actions = {
    removeTrade({ _id }) {
        const index = this.trades.findIndex((trade) => trade._id === _id);
        if (index === -1) return;
        this.trades.splice(index, 1);
    },
    setValue(key, value) {
        this[key] = value;
    },
    setOrderValue(value, order, field) {
        const trade = this.trades.find((trd) => trd._id === order.trade);
        if (!trade) return;
        const updateOrder = trade.orders.find((item) => item._id === order._id);
        if (!updateOrder) return;
        updateOrder[field] = value;

    },
    addList(value) {
        this.lists.push(value)
    },
    setOrderValue(value, order, field) {
        const trade = this.trades.find((trd) => trd._id === order.trade);
        if (!trade) return;
        const updateOrder = trade.orders.find((item) => item._id === order._id);
        if (!updateOrder) return;
        updateOrder[field] = value;

    },
    deleteOrder(order) {
        const trade = this.trades.find((trd) => trd._id === order.trade);
        if (!trade) return;
        const index = trade.orders.findIndex((item) => item._id === order._id);
        if (index === -1) return;
        trade.orders.splice(index, 1);
    },
    addOrder(order) {
        const trade = this.trades.find((trd) => trd._id === order.trade);
        if (!trade) return;
        trade.orders.push(order);
    },
    setTradeValue(value, trade, field) {
        const updateTrade = this.trades.find((trd) => trd._id === trade._id);
        if (!updateTrade) return;
        updateTrade[field] = value;
    },
    setStrategy(value) {
        console.log(value, "value");
        this.strategy = value;
    },
    updateStock(ticker, values) {
        const stock = this.stocks[ticker];
        if (!stock) return;
        for (const key in values) {
            stock[key] = values[key];
        }
    },
    reorderList(listId, to, from) {
        const updateList = this.lists.find((list) => list._id === listId);
        if (!updateList) return;
        const item = updateList.stocks.splice(from, 1)[0];
        updateList.stocks.splice(to, 0, item);
    },
    removeFromList(listId, index) {
        const updateList = this.lists.find((list) => list._id === listId);
        if (!updateList) return;
        updateList.stocks.splice(index, 1);
    },
    addToList(listId, index, item) {
        const updateList = this.lists.find((list) => list._id === listId);
        if (!updateList) return;
        updateList.stocks.splice(index, 0, item);
    },
    removeListStock() {

    },
    replaceListStock(item, listId) {
        const list = this.lists.find((ls) => ls._id === listId)
        const index = list.stocks.findIndex((stk) => stk._id === item._id);
        list.stocks.splice(index, 1, item);
    },
    updateListStock(value, listId, stockId, key) {
        const updateList = this.lists.find((list) => list._id === listId)
        if (!updateList) return;
        const stock = updateList.stocks.find((stk) => stk._id === stockId);
        if (!stock) return;
        stock[key] = value;
    },
    updateListValue(key, value, listId) {
        const list = this.lists.find((item) => item._id === listId);
        if (!list) return;
        list[key] = value;
    },
    sortTrades(strategyId, field) {

        const ctx = this;

        const strategy = ctx.strategies.find((strat) => {
            return strategyId === strat._id;
        })

        if (!strategy) return [];

        const dates = {
            closeDate(a) {
                return a.orders[
                    a.orders.length - 1
                ].date
            },
            openDate(a) {
                return a.orders[0].date
            }
        }

        const sortByDate = (fieldName) => {
            return {
                "desc": (a, b) => {
                    if (!isEqual(a.portfolios, strategy.portfolios)) {
                        return 0;
                    }

                    return dates[fieldName](b) - dates[fieldName](a)
                },
                "asc": (a, b) => {
                    if (!isEqual(a.portfolios, strategy.portfolios)) {
                        return 0;
                    }
                    return dates[fieldName](a) - dates[fieldName](b)

                }
            }
        }

        const sortMethods = (field) => {

            let order = "asc";

            if (ctx.sortOrder[field]) {
                ctx.sortOrder[field] = false;
            } else {
                ctx.sortOrder[field] = true;
                order = "desc"
            }

            const methods = {
                "openDate": sortByDate('openDate'),
                "closeDate": sortByDate('closeDate')
            }


            return methods[field][order]
        }



        this.sortMethod = sortMethods(field);

        function isEqual(a, b) {
            if (a.length != b.length) return false;
            return !a.map((item) => {
                return b.includes(item)
            }).includes(false);
        }
    },
}

export const useClosedTrades = defineStore("closedTradesStore", {
    state: () => {
        return globalState
    },
    getters: {
        getState(state) {
            // console.log(state.patches);
            return { ...test, number: fields.number, patches: state.patches };
        },
        getTradeById(state) {
            return (id) => state.trades.find(({ _id }) => _id === id);
        },
        getStrategyName(state) {
            return (id) => {
                const strategy = state.strategy.find((strat) => strat._id === id);
                if (strategy) return strategy.name;
                else return "";
            }
        },
        getPortfolioName(state) {
            return (id) => {
                const portfolio = state.portfolios.find((port) => port._id === id || port.id === id);
                if (portfolio) return portfolio.name;
                else return "";
            }
        },
        getPortfolio(state) {
            return (id) => {
                const portfolio = state.portfolios.find((port) => port._id === id || port.id === id);
                if (portfolio) return portfolio;
                else return "";
            }
        },
        getOrdersByTrade(state) {
            return (id) => {
                state.orders.filter((order) => {
                    return order._id === id;
                })
            }
        },
        getTradesByStrategy(state) {
            return (strategyId) => {
                const strategy = state.strategies.find((strat) => {
                    return strategyId === strat._id;
                })

                if (!strategy) return [];

                return state.trades.filter((trade) => {
                    return (
                        isEqual(trade.portfolios, strategy.portfolios) &&
                        trade.status !== "error"
                    )
                })
            }

            function isEqual(a, b) {
                if (a.length != b.length) return false;
                return !a.map((item) => {
                    return b.includes(item)
                }).includes(false);
            }
        },
        getFlatTradesByStrategy(state) {
            return ({
                strategyId, dateFilter, limit } = {}) => {

                console.log("hello")

                const {
                    startDate,
                    endDate
                } = dateFilter

                const strategy = state.strategies.find((strat) => {
                    return strategyId === strat._id;
                })

                console.log(strategy, "strat!!")

                if (!strategy) return []

                if (!limit) limit = strategy.length;

                console.log(strategy, "strategy")

                return state.trades.filter((trade) => {
                    return isEqual(trade.portfolios, strategy.portfolios);
                })
                    .map((trade) => {
                        if (trade.status === "error") return trade;
                        try {
                            const orders = trade.orders.filter((order) => {
                                //remove off orders after end date
                                return order.date <= endDate
                            })

                            const summary = getSummary(orders).trades.map((filtered) => {

                                filtered.orders.sort((a, b) => a.date - b.date);

                                return {
                                    ...filtered,
                                    ...trade,
                                    orders: filtered.orders
                                }
                            })

                            return summary;
                        } catch (err) {
                            return trade
                        }

                    })
                    .flat(1)
                    .sort(state.sortMethod)
                    .slice(0, limit)

            }

            function isEqual(a, b) {
                if (a.length != b.length) return false;
                return !a.map((item) => {
                    return b.includes(item)
                }).includes(false);
            }

        },
        getStrategies(state) {
            return state.strategies
        },
        getPriceMovement(state) {
            return (ticker) => {
                if (!state.stocks[ticker]) return false;
                else return state.stocks[ticker].priceMovement;
            }
        },
        getStockPrice(state) {
            return (ticker) => {
                if (!state.stocks[ticker]) return 0;
                else return state.stocks[ticker].price;
            }
        },
        getFlatSummary(state) {
            return (tradeId, dateRange) => {
                try {
                    // find id
                    const trade = state.trades.find(({ _id }) => tradeId === _id)
                    if (!trade) throw "Couldn't find trade"
                    const summary = getSummary(trade.orders, dateRange)
                    return summary;
                } catch (err) {
                    return err
                }

            }
        }
    },
    actions: {
        ...actions,
        socketUpdate(action, args) {
            console.log(action);
            const method = actions[action].bind(this);
            if (Array.isArray(args)) {
                method(...args);
            } else {
                method(args);
            }
        }
    }
})
