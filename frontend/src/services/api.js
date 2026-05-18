import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Training APIs
export const getTrainingStatus = () => {
  return api.get('/training/status');
};

export const getTrainingLogs = (modelType) => {
  return api.get(`/training/logs/${modelType}`);
};

export const uploadTextDataset = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/training/upload-text', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const uploadCategoryImages = (category, formData) => {
  return api.post(`/training/upload-images/${category}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const startTraining = (modelType, dataPath, epochs) => {
  return api.post('/training/start', {
    model_type: modelType,
    data_path: dataPath,
    epochs: epochs,
    batch_size: 32,
    learning_rate: 0.001,
  });
};

// Prediction APIs
export const predictText = (text) => {
  return api.post('/predict/text', { text });
};

export const predictImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/predict/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Onion Scraper APIs
export const scrapeOnion = (url, downloadImages = true) => {
  return api.post('/onion/scrape', {
    urls: [url],
    download_images: downloadImages,
  });
};

export const getRecentScrapes = (limit = 10) => {
  return api.get(`/onion/recent?limit=${limit}`);
};

export const getTorStatus = () => {
  return api.get('/tor/status');
};

export default {
  getTrainingStatus,
  getTrainingLogs,
  uploadTextDataset,
  uploadCategoryImages,
  startTraining,
  predictText,
  predictImage,
  scrapeOnion,
  getRecentScrapes,
  getTorStatus,
};