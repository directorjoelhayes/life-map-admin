import axios from "axios"

function objectToQueryString(obj) {
    const queryParams = [];

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];

            if (value !== undefined) {
                queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
            }
        }
    }

    return queryParams.join('&');
}

export default function buildMakeDb(dependencies) {
    return function makeDb({ baseUrl, key, auth } = {}) {
        const obj = {
            axios,
            baseUrl,
            key,
            auth,
            async post(data) {
                try {
                    const request = await axios({
                        method: 'post',
                        headers: {
                            'Authorization': `Bearer ${this.auth.token}`
                        },
                        url: `${this.baseUrl}`,
                        data
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
            async update(data, message = "Successfully Updated") {
                try {
                    const request = await axios({
                        method: 'put',
                        headers: {
                            'Authorization': `Bearer ${this.auth.token}`
                        },
                        url: `${this.baseUrl}/${data._id}`,
                        data
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
            async delete(id) {
                try {
                    const request = await axios({
                        method: 'delete',
                        headers: {
                            'Authorization': `Bearer ${this.auth.token}`
                        },
                        url: `${this.baseUrl}/${id}`
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
            async get(query) {
                try {
                    const request = await axios({
                        method: 'get',
                        headers: {
                            'Authorization': `Bearer ${this.auth.token}`
                        },
                        url: `${this.baseUrl}${query ? "?" + objectToQueryString(query) : ""}`
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
            async getById(id) {
                try {
                    const request = await axios({
                        method: 'get',
                        headers: {
                            'Authorization': `Bearer ${this.auth.token}`
                        },
                        url: `${this.baseUrl}/${id}`
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
            async bulkInsert(items) {
                try {
                    const request = await axios({
                        method: 'post',
                        headers: {
                            'Authorization': `Bearer ${this.auth.token}`
                        },
                        url: `${this.baseUrl}/bulk`,
                        data: {
                            items
                        }
                    });

                    if (this.key) {
                        return request.data[this.key];
                    } else {
                        return request.data;
                    }

                } catch (err) {
                    throw err;
                }
            }
        };

        return obj;
    }
}