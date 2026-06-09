async function request(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    sessionStorage.removeItem('pharma_user')
    window.location.href = '/login'
    return
  }

  const data = await res.json().catch(() => ({ error: res.statusText }))

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }

  return data
}

export const api = {
  get:  (path)       => request('GET',  path),
  post: (path, body) => request('POST', path, body),
}
