import { defineStore } from 'pinia'
import { v4 as uuid } from "uuid"
import { socket } from '../socket'
import { getSummary } from '../utils/finance-formulas'
import { portfolioDb } from '../databases'

const globalState = {
    instance: uuid(),
    loaded: false,
    rFactor: 2,
    data: {

    },
    stocks: {},
    strategies: [],
    portfolios: [],
}

const actions = {

    setValue(key, value) {
        this[key] = value;
    },
    updateValue(key, value) {
        this.data[key].value = value
    },
    setStrategy(value) {
        console.log(value, "value");
        this.strategy = value;
    },
    addStock(key, value) {
        //add stock and make live
        console.log(value.status, "status")
        if (value?.status === "false") {
            this.stocks[key] = value
            return
        }

        if (!this.stocks[key]) {
            this.stocks[key] = value;
            socket.emit("request", key)
        } else if (this.stocks?.[key]?.active === false) {
            this.stocks[key].active = true;
            socket.emit("request", key)
        }
    },
    removeStock(key) {
        //stop receiving data stock and make live
        if (this.stocks[key]) {
            this.stocks[key].active = false;
            socket.emit("unrequest", key)
        }
    },
    clearStocks() {
        Object.keys(this.stocks).map((key) => {
            socket.emit("unrequest", key)
            this.stocks[key].active = false;
        })

    },
    updateStock(ticker, values) {

        const stock = this.stocks[ticker];
        if (!stock) return;
        for (const key in values) {
            stock[key] = values[key];
        }
    },
    addStockPriceUpdate(update) {
        //if length + 1 is equal to limit than x, delete first element of array
        const limit = 10;
        const currentStock = this.stocks[update.symbol];
        if (!currentStock) return;
        if (this.stocks?.[update.symbol]?.priceUpdates?.length + 1 === limit) {
            //remove fist
            currentStock.priceUpdates.splice(0, 1)
        }

        currentStock.priceUpdates.push(update)

    },
    async fetchPortfolios() {
        try {
            if(!this.portfolios.length) {
                const data =  await portfolioDb.get()
                this.portfolios = data;
                return data;
            } else {
                return this.portfolios
            }
        } catch(err) {
            return this.portfolios;
        }
        
    }
}

export const useGlobalStore = defineStore("globalStore", {
    state: () => {
        return globalState
    },
    getters: {
        // #FEATURE clean up getters
        getValue(state) {
            return (key) => {
                if (!state.data[key]) return "";
                const val = { ...state.data[key] };
                if (val.type === "number") return parseFloat(val.value)
            }
        },
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
        getPortfolios(state) {
            return state.portfolios;
        },
        getPortfolioList(state) {
            return state.portfolios.map((item) => {
                return {
                    title: item.name,
                    value: item._id
                }
            })
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
                if (!state.stocks[ticker]) return NaN;
                else return state.stocks[ticker].price;
            }
        },
        getStock(state) {
            return (ticker) => {
                return state.stocks[ticker];
            }
        }
    },
    actions: {
        ...actions,
        socketUpdate(action, args) {
            const method = actions[action].bind(this);
            
            if (Array.isArray(args)) {
                method(...args);
            } else {
                method(args);
            }
        },
        ignoreUpdate(action, args) {
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
