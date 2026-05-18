# Cyber Threat Intelligence System

## Unified Threat Intelligence Platform with GCN and ViT Models

### Features
- **Text Threat Detection**: GCN model trained on 3 categories (gun, drug, poison)
- **Image Threat Detection**: ViT model trained on 3 categories (drugs, firearms, poison)
- **Dark Web Scraper**: Tor-based .onion scraping with automatic threat classification
- **Unified Interface**: Single dashboard for model training and threat intelligence

### Quick Start

1. **Install Dependencies**
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install