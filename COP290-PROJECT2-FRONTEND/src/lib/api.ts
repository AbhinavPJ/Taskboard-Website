const BASE = 'http://localhost:3001/api';

//Below is a smart and centralized api fetch that we can use everywhere in our app!
export const apiFetch = async (endpoint: string, opt: RequestInit = {}) => {
  const res = await fetch(BASE + endpoint, {
    ...opt, //we add credentials and headers to the options
    credentials: 'include',
    headers: {'Content-Type': 'application/json', ...opt.headers},
  });
  if (!res.ok) {
    if (res.status === 401) console.error('Unauthorized');
    throw new Error(res.statusText);
  }
  return res.json();
};
