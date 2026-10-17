import { useEffect, useState } from 'react'
import axios from 'axios'
import { API } from '../api'

// Loads a private image (payment screenshot) with the admin's token, since <img src> cannot send headers.
export default function SecureImage({ orderId, token, alt, style }) {
  const [url, setUrl] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let objectUrl = ''
    let cancelled = false
    setUrl(''); setFailed(false)
    axios.get(`${API}/orders/${orderId}/screenshot`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
    })
      .then(res => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(res.data)
        setUrl(objectUrl)
      })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [orderId, token])

  if (failed) return <p style={{ fontSize: 12, opacity: 0.6, padding: 12 }}>Screenshot unavailable</p>
  if (!url) return <p style={{ fontSize: 12, opacity: 0.5, padding: 12 }}>Loading…</p>
  return <img src={url} alt={alt} style={style} />
}
