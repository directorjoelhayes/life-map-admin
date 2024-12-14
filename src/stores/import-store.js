import { defineStore, getActivePinia } from 'pinia'
import { formatDate } from "/src/utils/number-format";
import { makeImport } from "/src/core/models/make-import";
import { importDb } from "/src/databases";

// useStore could be anything like useUser, useCart
// the first argument is a unique id of the store across your application
export const makeImportStore = (name) => {
    return defineStore(name, {
        state: () => {
            return {
                ...makeImport({
                    data: {
                        rows: [],
                        header: [],
                        map: {},
                        mapOptions: undefined,
                        replaceList: false,
                        mappedRows: [],
                        portfolio: "5f05ba36-7122-4c9c-802a-2ed0478ea65e",
                        mappedHeader: [
                            ["symbol", "Symbol", "toUpperCase", "toUpperCase"],
                            ["shares", "Quantity", "Number"],
                            ["date", "Date", "stringToDate", "formatDate"],
                            ["price", "Price", "stringToNumber"],
                            // ["amount", "Amount", "stringToNumber"],
                            ["fee", "Fees", "stringToNumber"],
                            ["type", "Action", "toUpperCase"],
                        ],
                    }
                })
            }

        },
        getters: {
            // getState(state) {
            //     return { ...test, number: fields.number, patches: state.patches };
            // }
        },
        actions: {
            updateKey(key, value) {
                this.data[key] = value;
            },
            updateStep(value) {
                this.step = value;
            },
            updateStatus(value) {
                this.status = value;
            },
            updateMapItem(index, value) {
                this.data.map[index] = value;
            },
            updateMap(index, value) {
                this.data.map[index] = value;
            },
            dispose() {
                // Get the Pinia instance
                const pinia = getActivePinia()

                // Remove this store instance from Pinia
                if (pinia) {
                    pinia._s.delete(name)
                }
            },
            async save() {
                try {
                    //upsert the data
                    importDb.update(makeImport(this));
                } catch (error) {
                   throw error;
                }
            },
            reset() {
                const resetImport = makeImport({
                    data: {
                        rows: [],
                        header: [],
                        map: {},
                        mapOptions: undefined,
                        replaceList: false,
                        mappedRows: [],
                        portfolio: "5f05ba36-7122-4c9c-802a-2ed0478ea65e",
                        mappedHeader: [
                            ["symbol", "Symbol", "toUpperCase", "toUpperCase"],
                            ["shares", "Quantity", "Number"],
                            ["date", "Date", "stringToDate", "formatDate"],
                            ["price", "Price", "stringToNumber"],
                            // ["amount", "Amount", "stringToNumber"],
                            ["fee", "Fees", "stringToNumber"],
                            ["type", "Action", "toUpperCase"],
                        ],
                    }
                });

                Object.keys(resetImport).forEach(key => {
                    this[key] = resetImport[key];
                });
                
            },
            updateFromPending(pendingImport) {
                // Iterate through all properties of the pending import and update the store
                Object.keys(pendingImport).forEach(key => {
                    if (key in this) {
                        this[key] = pendingImport[key];
                    }
                });
            },
        }
    })
}
