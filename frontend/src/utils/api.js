export const apiCreate = async (url, bodyData) => {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
    })

    const data = await res.json();
    return data;
}

export const apiRead = async (url) => {
    const res = await fetch(url, {
        method: 'GET',
    })

    const data = await res.json();
    return data;
}

export const apiUpdate = async (url, bodyData) => {
    const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
    })

    const data = await res.json();
    return data;
}
