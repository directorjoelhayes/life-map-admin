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
    return function makeDb({ baseUrl, key, auth, methods = [] } = {}) {
        const obj = {
            axios,
            baseUrl, 
            key, 
            auth,
            post: async (data) => {
                try {
                    const request = await axios({
                        method: 'post',
                        headers: {
                            'Authorization': `Bearer ${auth.token}`
                        },
                        url: `${baseUrl}`,
                        data
                    });

                    if (key) {
                        return request.data[key]
                    } else {
                        return request.data
                    }

                } catch (err) {
                    throw err;
                }
            },
            update: async (data, message = "Successfully Updated") => {
                try {
                    const request = await axios({
                        method: 'put',
                        headers: {
                            'Authorization': `Bearer ${auth.token}`
                        },
                        url: `${baseUrl}/${data._id}`,
                        data
                    });

                    if (key) {
                        return request.data[key]
                    } else {
                        return request.data
                    }

                } catch (err) {
                    throw err
                }
            },
            delete: async (id) => {
                try {
                    const request = await axios({
                        method: 'delete',
                        headers: {
                            'Authorization': `Bearer ${auth.token}`
                        },
                        url: `${baseUrl}/${data._id}`
                    });

                    if (key) {
                        return request.data[key]
                    } else {
                        return request.data
                    }
                } catch (err) {
                    throw err
                }
            },
            get: async (query) => {
                try {
                    //string encode query
                    const request = await axios({
                        method: 'get',
                        headers: {
                            'Authorization': `Bearer ${auth.token}`
                        },
                        url: `${baseUrl}${query ? "?" + objectToQueryString(query) : ""}`
                    });

                    if (key) {
                        return request.data[key]
                    } else {
                        return request.data
                    }

                } catch (err) {
                    throw err
                }
            },
            getById: async (id) => {
                try {
                    //string encode query
                    const request = await axios({
                        method: 'get',
                        headers: {
                            'Authorization': `Bearer ${auth.token}`
                        },
                        url: `${baseUrl}/${id}`
                    });

                    if (key) {
                        return request.data[key]
                    } else {
                        return request.data
                    }

                } catch (err) {
                    throw err
                }
            },
            bulkInsert: async function  (trades) {
                try {
                    const request = await axios({
                        method: 'post',
                        headers: {
                            'Authorization': `Bearer ${auth.token}`
                        },
                        url: `${baseUrl}/bulk`,
                        data: {
                            trades
                        }
                    });
            
                    if (key) {
                        return request.data[key]
                    } else {
                        return request.data
                    }
            
                } catch (err) {
                    throw err;
                }
            }
        }

        // Add custom methods to the object
        methods.forEach(method => {
            method.bind(obj)
            obj[method.name] = method;
        });

        return obj;
    }
}