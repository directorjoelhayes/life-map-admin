import { defineStore } from 'pinia'
import { v4 as uuid } from "uuid"

// useStore could be anything like useUser, useCart
// the first argument is a unique id of the store across your application

const globalState = {
    // all these properties will have their type inferred automatically
    // number: 5,
    instance: uuid(),
    user: false
}

const actions = {
    setValue(key, value) {
        this[key] = value;
    },
}

export const useUserStore = defineStore("userStore", {
    state: () => {
        return globalState
    },
    getters: {
        getUser(state) {
            state.user
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
