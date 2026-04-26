import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function sendMessage(message) {
  const response = await axios.post(`${API_URL}/chat`, { message });
  return response.data.data;
}

export async function getFaqs() {
  const response = await axios.get(`${API_URL}/faqs`);
  return response.data.data;
}
