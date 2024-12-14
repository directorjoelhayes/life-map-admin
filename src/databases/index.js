import buildMakeDb from "./make-db"
import buildMakeUserDb from "./make-user-db"
import { v4 as uuid } from "uuid"
import axios from "axios"
import getCookie from "/src/utils/get-cookie.js"

const data = {
    errorManager: null,
    successManager: null
}

export const mount = (notifications) => {
    data.errorManager = (err) => {
        notifications.create({
            status: "error",
            message: err
        })
    }
    data.successManager = (message) => {
        notifications.create({
            status: "success",
            message
        })
    }
}

const makeDb = buildMakeDb(data)
const makeUserDb = buildMakeUserDb(data)

const api = import.meta.env.VITE_API_PATH

//get cookie


const auth = {
    token: getCookie("token")
}

const orderDb = makeDb({ baseUrl: `${api}/orders`, key: "data", auth })

Object.assign(orderDb, {
    newMethod() {
        console.log(this.auth)
    },
    async getClosedTrades(query = {}) {
        try {
            let params = new URLSearchParams(query).toString();
            if (params.length) params = `?${params}`

            const request = await axios({
                headers: {
                    'Authorization': `Bearer ${this.auth.token}`
                },
                method: 'get',
                url: `${api}/orders/generate-trade-groups${params}`
            });

            return request.data.data

        } catch (err) {
            throw err
        }
    },
    async getMyOrders(query = {}) {
        try {
            let params = new URLSearchParams(query).toString();
            if (params.length) params = `?${params}`

            const request = await axios({
                headers: {
                    'Authorization': `Bearer ${this.auth.token}`
                },
                method: 'get',
                url: `${this.baseUrl}/my-orders${params}`
            });

            if (this.key) {
                return request.data[this.key];
            } else {
                return request.data;
            }

        } catch (err) {
            throw err;
        }
    },
    async getOpenTrades(query = {}) {
        try {
            let params = new URLSearchParams(query).toString();
            if (params.length) params = `?${params}`

            const request = await axios({
                headers: {
                    'Authorization': `Bearer ${this.auth.token}`
                },
                method: 'get',
                url: `${this.baseUrl}/open-trades${params}`
            });

            if (this.key) {
                return request.data[this.key];
            } else {
                return request.data;
            }

        } catch (err) {
            throw err;
        }
    },
    async getRawOrder(orderId) {
        try {
            const request = await axios({
                headers: {
                    'Authorization': `Bearer ${this.auth.token}`
                },
                method: 'get',
                url: `${api}/oauth/raw-orders/${orderId}`
            });

            return request.data.data

        } catch (err) {
            throw err
        }
    }
})

const userDb = makeUserDb({ baseUrl: `${api}/users`, authentication: auth })
Object.assign(userDb, {
    async getRefreshTokenStatus() {
        try {
            console.log(this, "this");
            const request = await axios({
                headers: {
                    'Authorization': `Bearer ${this.authentication.token}`
                },
                method: 'get',
                url: `${api}/oauth/refresh-tokens`
            });

            return request.data.data

        } catch (err) {
            throw err
        }
    }
})

const importDb = makeDb({ baseUrl: `${api}/imports`, key: "data", auth })
Object.assign(importDb, {
    async getLatestPartial() {
        try {
            const request = await axios({
                method: 'get',
                url: `${api}/imports/latest-partial`,
                headers: {
                    'Authorization': `Bearer ${this.auth.token}`
                }
            });

            return request.data.data
        } catch (err) {
            throw err
        }
    }
})
export {
    orderDb,
    userDb,
    importDb
};
export const portfolioDb = makeDb({ baseUrl: `${api}/portfolio`, key: "data", auth })
export const tradesDb = makeDb({ baseUrl: `${api}/trades`, key: "data", auth })
export const strategyDb = makeDb({ baseUrl: `${api}/strategy`, key: "data", auth });
export const stockDb = {
    ...makeDb({ baseUrl: `${api}/stocks`, key: "data", auth }),
    getStockPrice: async (ticker) => {
        //needs auth
        try {
            const request = await axios({
                method: 'get',
                url: `${api}/stocks/price/${ticker}`
            });

            return request.data.data

        } catch (err) {
            throw err
        }
    },
}
export const globalValueDb = makeDb({ baseUrl: `${api}/global-value`, key: "data", auth })
export const balanceDb = makeDb({ baseUrl: `${api}/balance`, key: "data", auth })
export const listDb = makeDb({ baseUrl: `${api}/list`, key: "data", auth })

