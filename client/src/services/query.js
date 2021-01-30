export function asQueryParams(params) {
    return '?' + Object.entries(params)
        .map(([key, value]) => 
            ![null, undefined, ''].includes(value) &&
            [key, value].map(encodeURIComponent).join('=')
        )
        .filter(Boolean)
        .join('&');
}

export function query(url, params, options) {
    return fetch(`${url}${asQueryParams(params)}`, options)
        .then(response => response.json());
}