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
    return function makeDb({ baseUrl, key, authentication }) {
        return {
            key,
            baseUrl,
            authentication,
            login:  async (data) => {
                try {
                    const request = await axios({
                        method: 'post',
                        url: `${baseUrl}/login`,
                        data
                    });

                    if(request.data.token) {
                        authentication.token = request.data.token;
                        document.cookie = "token=" + request.data.token;
                    }

                    return request.data

                } catch (err) {
                    throw err
                }
            },
            auth: async (data) => {
                try {
                    const request = await axios({
                        method: 'post',
                        headers: {
                            'Authorization': `Bearer ${authentication.token}`
                        },
                        url: `${baseUrl}/auth`,
                        data
                    });

                    console.log(request.data)

                    if(request.data.status !== "success") throw request.message

                    if (key) {
                        return request.data[key]
                    } else {
                        return request.data
                    }

                } catch (err) {
                    throw err
                }
            },
            post: async (data) => {
                try {
                    const request = await axios({
                        method: 'post',
                        url: `${baseUrl}`,
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
            update: async (data, message = "Successfully Updated") => {
                try {
                    const request = await axios({
                        method: 'put',
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
            }
        }
    }
}