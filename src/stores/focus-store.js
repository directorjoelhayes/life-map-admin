import { defineStore } from 'pinia'
import { v4 as uuid } from "uuid"
import { getSummary } from '../utils/finance-formulas'
import { useGlobalStore } from "./global-store"

const globalState = {
    instance: uuid(),
    loaded: false,
    lists: [],
    sortOrder: {}
}

const actions = {
    setValue(key, value) {
        this[key] = value;
    },
    addList(value) {
        this.lists.push(value)
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
    removeFromListById(listId, stockId) {
        const updateList = this.lists.find((list) => list._id === listId);
        if (!updateList) return;
        const index = updateList.stocks.findIndex((stk) => stk._id === stockId);
        if (index === -1) return;
        updateList.stocks.splice(index, 1);
    },
    addToList(listId, index, item) {
        const updateList = this.lists.find((list) => list._id === listId);
        if (!updateList) return;

        if (updateList.stocks.map((a) => a.s).includes(item.s)) return;
        updateList.stocks.splice(index, 0, item);
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
    sortList(listId, field) {
        const ctx = this;
        const globalStore = useGlobalStore();
        const list = this.lists.find((item) => item._id === listId);
        if (!list) return;
        list.stocks.sort(sortMethods(field));

        function sortMethods(field) {

            let order = "asc";

            if (ctx.sortOrder[field]) {
                ctx.sortOrder[field] = false;
            } else {
                ctx.sortOrder[field] = true;
                order = "desc"
            }

            const methods = {
                "rank": {
                    "desc": (a, b) => b.rank - a.rank,
                    "asc": (a, b) => a.rank - b.rank
                },
                "rs": {
                    "desc": (a, b) => b.rs - a.rs,
                    "asc": (a, b) => a.rs - b.rs
                },
                "ticker": {
                    "asc": (a, b) => {
                        if (a.s < b.s) return 1;
                        if (a.s > b.s) return -1;
                        return 0;
                    },
                    "desc": (a, b) => {
                        if (a.s < b.s) return -1;
                        if (a.s > b.s) return 1;
                        return 0;
                    },
                },
                "%stop": {
                    "asc": (a, b) => getStopPercent(a) - getStopPercent(b),
                    "desc": (a, b) => getStopPercent(b) - getStopPercent(a)
                },
                "trigger" :  {
                    "asc": (a, b) => {
                        return (
                            getTriggerAlert(a, globalStore.getStockPrice(a.s)) -
                            getTriggerAlert(b, globalStore.getStockPrice(b.s))
                        )
                    },
                    "desc": (a, b) => {
                        return (
                            getTriggerAlert(b, globalStore.getStockPrice(b.s)) -
                            getTriggerAlert(a, globalStore.getStockPrice(a.s))
                        )
                    }
                },
                "sector": {
                    "asc": (a, b) => {
                        if (a.sector < b.sector) return -1;
                        if (a.sector > b.sector) return 1;
                        return 0;
                    },
                    "desc": (a, b) => {
                        if (a.sector < b.sector) return 1;
                        if (a.sector > b.sector) return -1;
                        return 0;
                    },
                }
            }

            function getStopPercent(data) {
                if (data.stop === 0 || data.trigger === 0) return 0.00;
                const number = (data.trigger - data.stop) / data.trigger;
                return Number((number * 100).toFixed(2));
            }
            function getTriggerAlert(el, price) {
                if(Math.abs(el.trigger - price) < .04 * el.trigger) return 1;
                else return -1
            }

            return methods[field][order]
        }
    },
    clearList(listId) {
        const list = this.lists.find((item) => item._id === listId);
        list.stocks = [];
    }
}

export const useFocusStore = defineStore("focusStore", {
    state: () => {
        return globalState
    },
    getters: {
        getList: (state) => (id) => {
            return state.lists.find((list) => list._id === id);
        },
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
        },
        
        ignoreUpdate(action, args) {
            const method = actions[action].bind(this);
            if (Array.isArray(args)) {
                method(...args);
            } else {
                method(args);
            }
        }
    }
})
