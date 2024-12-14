import { defineStore } from 'pinia'
import { v4 as uuid } from "uuid"
import { socket } from '../socket'
import { getSummary } from '../utils/finance-formulas'

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
    lists: []
}

const actions = {
    setValue(key, value) {
        this[key] = value;
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
    updateOrder(order) {
        if(!order?._id) return;
        const trade = this.trades.find((trade) => order.trade === trade._id)
        const updateOrder = trade.orders.find(({ _id }) => order._id === _id);
        if(!updateOrder) return;
        Object.assign(updateOrder, order);
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
    removeTrade({ _id }) {
        const index = this.trades.findIndex((trade) => trade._id === _id);
        if(index === -1) return;
        this.trades.splice(index, 1);
    },
    addStock(key, value) {
        if (!this.stocks[key]) {
            this.stocks[key] = value;
            socket.emit("request", key)
        }
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
    }
}

export const useOpenTrades = defineStore("openTradesStore", {
    state: () => {
        return globalState
    },
    getters: {
        getState(state) {
            // console.log(state.patches);
            return { ...test, number: fields.number, patches: state.patches };
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
                    return isEqual(trade.portfolios, strategy.portfolios);
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
            return (strategyId, { endDate }) => {
                const strategy = state.strategies.find((strat) => {
                    return strategyId === strat._id;
                })

                console.log(strategy, "strategy")

                if (!strategy) return [];

                return state.trades.filter((trade) => {
                    return isEqual(trade.portfolios, strategy.portfolios);
                }).map((trade) => {
                    const orders = trade.orders.filter((order) => {
                        //remove off orders after end date
                        return order.date <= endDate
                    })

                    return getSummary(orders).trades.map((filtered) => {

                        filtered.orders.sort((a, b) => a.date - b.date);

                        return {
                            ...filtered,
                            ...trade,
                            orders: filtered.orders
                        }
                    })
                }).flat(1)
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
