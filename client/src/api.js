// src/api.js — เรียก backend API (เดียวกับต้นฉบับ แต่ห่อเป็น helper สำหรับ React)
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const getApiUrl = (url) => /^https?:\/\//i.test(url) ? url : `${API_URL}${url}`;

async function request(method, url, body) {
  const opts = { method, headers: {}, credentials: 'include' };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(getApiUrl(url), opts);
  let data = {};
  try { data = await res.json(); } catch (e) { data = {}; }
  if (!res.ok) {
    const err = new Error(data.error || 'เกิดข้อผิดพลาด');
    err.status = res.status;
    throw err;
  }
  return data;
}

const Api = {
  get: (url) => request('GET', url),
  post: (url, body) => request('POST', url, body || {}),
  put: (url, body) => request('PUT', url, body || {}),
  del: (url) => request('DELETE', url)
};

export default Api;
