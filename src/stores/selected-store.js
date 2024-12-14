import { defineStore } from 'pinia'

export const makeSelectedStore = (name) => {
    return defineStore(name, {
        state: () => {
            return {
                list: []
            }
        },
        getters: {
            getSelected(state) {
                return (id) => {
                    return state.list.findIndex(({ _id }) => _id === id) !== -1
                }
            },
            getAllSelected(state) {
                return (lst) => {
                    //if some are not selected, all selected is false
                    return !lst
                        .some(({ _id }) => {
                            //return true if any items on list are not selected
                            return !state.list
                                .find((item) => _id === item._id)
                        })
                }
            }
        },
        actions: {
            addSelected(obj) {
                this.list.push(obj);
            },
            removeSelected(id) {
                const index = this.list.findIndex(({ _id }) => _id === id)
                this.list.splice(index, 1);
            },
            selectAll(list) {
                this.list = list
            },
            unselectAll() {
                this.list = []
            },
            handleSelectedUpdate(e, trade) {
                if (e) this.addSelected(trade);
                else this.removeSelected(trade._id);
            },
            dispose() {
                // Get the Pinia instance
                const pinia = getActivePinia()

                // Remove this store instance from Pinia
                if (pinia) {
                    pinia._s.delete(name)
                }
            }
        }
    })
}
