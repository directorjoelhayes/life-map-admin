import { defineStore } from 'pinia'
import makeId from "../utils/make-id"
// useStore could be anything like useUser, useCart
// the first argument is a unique id of the store across your application
export const useNotifications = defineStore("notifications", {
    state: () => {
        return {
            items: []            
        }
    },
    getters: {
        getState(state) {
            // console.log(state.patches);
            return { ...test, number: fields.number, patches: state.patches };
        }
    },
    actions: {
        create({status, message, removal = 3000} = {}) {
            const id = makeId(10);

            this.items.push(
                {
                    id,
                    status,
                    message
                }
            )
                
            setTimeout(() => this.items.splice(
                this.items.findIndex((a) => a.id === id), 1
            ), removal)
        }
    }
})
