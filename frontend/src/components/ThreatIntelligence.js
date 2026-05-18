import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Grid, Button, TextField, Box, LinearProgress,
  Alert, Chip, Card, CardContent, Accordion, AccordionSummary, AccordionDetails,
  Slider, FormControl, InputLabel, Select, MenuItem, IconButton, List, ListItem,
  ListItemText, ListItemIcon, Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SecurityIcon from '@mui/icons-material/Security';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ImageIcon from '@mui/icons-material/Image';
import api from '../services/api';

const ThreatIntelligence = () => {
  const [trainingStatus, setTrainingStatus] = useState({ text_gnn: { trained: false }, image_vit: { trained: false } });
  const [training, setTraining] = useState(false);
  const [selectedModel, setSelectedModel] = useState('text_gnn');
  const [epochs, setEpochs] = useState(50);
  const [textFile, setTextFile] = useState(null);
  const [imageFiles, setImageFiles] = useState({ drugs: [], firearms: [], poison: [] });
  const [uploading, setUploading] = useState(false);
  const [onionUrl, setOnionUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState(null);
  const [recentScrapes, setRecentScrapes] = useState([]);
  const [predictText, setPredictText] = useState('');
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainingStatus();
    fetchRecentScrapes();
    const interval = setInterval(fetchTrainingStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTrainingStatus = async () => {
    try {
      const res = await api.getTrainingStatus();
      setTrainingStatus(res.data);
      setLoading(false);
    } catch (err) {
      setError('Cannot connect to backend');
      setLoading(false);
    }
  };

  const fetchRecentScrapes = async () => {
    try {
      const res = await api.getRecentScrapes();
      setRecentScrapes(res.data.scrapes || []);
    } catch (err) {}
  };

  const handleStartTraining = async () => {
    setTraining(true);
    try {
      const dataPath = selectedModel === 'text_gnn' ? 'uploads/text/corrected_text_data.csv' : 'uploads/images';
      await api.startTraining(selectedModel, dataPath, epochs);
      await fetchTrainingStatus();
      alert('Training completed!');
    } catch (err) {
      setError('Training failed');
    } finally {
      setTraining(false);
    }
  };

  const handleUploadText = async () => {
    if (!textFile) return;
    setUploading(true);
    try {
      await api.uploadTextDataset(textFile);
      alert('Text dataset uploaded!');
      setTextFile(null);
    } catch (err) {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadImages = async () => {
    setUploading(true);
    try {
      for (const [category, files] of Object.entries(imageFiles)) {
        if (files.length > 0) {
          const formData = new FormData();
          files.forEach(file => formData.append('files', file));
          await api.uploadCategoryImages(category, formData);
        }
      }
      alert('Images uploaded!');
      setImageFiles({ drugs: [], firearms: [], poison: [] });
    } catch (err) {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleScrapeOnion = async () => {
    if (!onionUrl.trim()) return;
    setScraping(true);
    setError(null);
    setScrapedData(null);
    try {
      console.log('Scraping URL:', onionUrl);
      const response = await api.scrapeOnion(onionUrl, true);
      console.log('Full response:', response.data);
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        console.log('Result:', result);
        console.log('Text content:', result.text_content);
        console.log('Images:', result.images);
        setScrapedData(result);
      } else {
        setError('No results returned');
      }
      await fetchRecentScrapes();
    } catch (err) {
      console.error('Error:', err);
      setError('Scraping failed: ' + err.message);
    } finally {
      setScraping(false);
    }
  };

  const handlePredictText = async () => {
    if (!predictText.trim()) return;
    try {
      const response = await api.predictText(predictText);
      setPredictionResult(response.data);
    } catch (err) {
      setError('Prediction failed');
    }
  };

  const getThreatColor = (level) => {
    switch (level) {
      case 'HIGH': return '#ff4081';
      case 'MEDIUM': return '#ff9800';
      case 'LOW': return '#4caf50';
      default: return '#00bcd4';
    }
  };

  const isTextTrained = trainingStatus.text_gnn?.trained;
  const isImageTrained = trainingStatus.image_vit?.trained;
  const bothReady = isTextTrained && isImageTrained;

  if (loading) {
    return (
      <Container sx={{ mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, color: '#fff' }}>Connecting to backend...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <SecurityIcon sx={{ fontSize: 40, color: '#00bcd4' }} />
        <Typography variant="h4" sx={{ color: '#00bcd4', flexGrow: 1 }}>🛡️ Threat Intelligence Center</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label={isTextTrained ? 'Text GNN: ✅' : 'Text GNN: ❌'} sx={{ bgcolor: isTextTrained ? '#00bcd4' : '#ff4081', color: '#fff' }} />
          <Chip label={isImageTrained ? 'Image ViT: ✅' : 'Image ViT: ❌'} sx={{ bgcolor: isImageTrained ? '#00bcd4' : '#ff4081', color: '#fff' }} />
          <Chip label={bothReady ? '✅ Ready' : '⚠️ Train First'} sx={{ bgcolor: bothReady ? '#00bcd4' : '#ff4081', color: '#fff' }} />
        </Box>
      </Box>

      <Alert severity={bothReady ? 'success' : 'warning'} sx={{ mb: 3 }}>
        {bothReady ? '✅ Both models trained! Ready to scrape.' : '⚠️ Train Text GNN and Image ViT models first.'}
      </Alert>

      <Grid container spacing={3}>
        {/* LEFT COLUMN - Training */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, bgcolor: '#1e293b' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <ModelTrainingIcon sx={{ color: '#00bcd4' }} />
              <Typography variant="h6" sx={{ color: '#00bcd4' }}>🤖 Model Training</Typography>
            </Box>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: '#00bcd4' }}>Select Model</InputLabel>
              <Select value={selectedModel} onChange={(e) => { setSelectedModel(e.target.value); setEpochs(e.target.value === 'text_gnn' ? 50 : 10); }} sx={{ color: '#fff' }}>
                <MenuItem value="text_gnn">📝 Text GNN (50 epochs)</MenuItem>
                <MenuItem value="image_vit">🖼️ Image ViT (10 epochs)</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ color: '#fff' }}>Epochs: {epochs}</Typography>
              <Slider value={epochs} onChange={(e, v) => setEpochs(v)} min={1} max={selectedModel === 'text_gnn' ? 50 : 10} step={1} sx={{ color: '#00bcd4' }} />
            </Box>

            {selectedModel === 'text_gnn' ? (
              <Box>
                <Button variant="outlined" component="label" fullWidth startIcon={<TextFieldsIcon />} sx={{ borderColor: '#00bcd4', color: '#00bcd4' }}>
                  Select CSV File
                  <input type="file" hidden accept=".csv" onChange={(e) => setTextFile(e.target.files[0])} />
                </Button>
                {textFile && <Chip label={textFile.name} onDelete={() => setTextFile(null)} sx={{ mt: 1 }} />}
                <Button fullWidth variant="contained" onClick={handleUploadText} disabled={!textFile || uploading} sx={{ mt: 2, bgcolor: '#00bcd4' }}>
                  {uploading ? 'Uploading...' : 'Upload Text Dataset'}
                </Button>
              </Box>
            ) : (
              <Box>
                {['drugs', 'firearms', 'poison'].map(cat => (
                  <Button key={cat} variant="outlined" component="label" fullWidth startIcon={<ImageIcon />} sx={{ mb: 1, borderColor: '#00bcd4', color: '#00bcd4' }}>
                    Upload {cat.toUpperCase()} Images
                    <input type="file" hidden multiple accept="image/*" onChange={(e) => setImageFiles({ ...imageFiles, [cat]: Array.from(e.target.files) })} />
                  </Button>
                ))}
                <Button fullWidth variant="contained" onClick={handleUploadImages} disabled={uploading} sx={{ mt: 1, bgcolor: '#00bcd4' }}>
                  {uploading ? 'Uploading...' : 'Upload All Images'}
                </Button>
              </Box>
            )}

            <Button fullWidth variant="contained" startIcon={<PlayArrowIcon />} onClick={handleStartTraining} disabled={training} sx={{ mt: 2, bgcolor: '#ff4081' }}>
              {training ? 'Training...' : `Train ${selectedModel === 'text_gnn' ? 'Text GNN' : 'Image ViT'}`}
            </Button>

            <Grid container spacing={1} sx={{ mt: 2 }}>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: '#0f172a' }}>
                  <CardContent>
                    <Typography variant="caption">Text GNN</Typography>
                    <Typography variant="h6" sx={{ color: isTextTrained ? '#00bcd4' : '#ff4081' }}>{isTextTrained ? '✓ Trained' : '✗ Not Trained'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: '#0f172a' }}>
                  <CardContent>
                    <Typography variant="caption">Image ViT</Typography>
                    <Typography variant="h6" sx={{ color: isImageTrained ? '#00bcd4' : '#ff4081' }}>{isImageTrained ? '✓ Trained' : '✗ Not Trained'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* RIGHT COLUMN - Dark Web Scraper */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, bgcolor: '#1e293b' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
              <DarkModeIcon sx={{ color: '#00bcd4' }} />
              <Typography variant="h6" sx={{ color: '#00bcd4' }}>🌐 Dark Web Intelligence (Tor)</Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField 
                fullWidth 
                placeholder="Enter .onion URL" 
                value={onionUrl} 
                onChange={(e) => setOnionUrl(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && handleScrapeOnion()} 
                sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: '#00bcd4' } } }} 
              />
              <Button 
                variant="contained" 
                onClick={handleScrapeOnion} 
                disabled={scraping || !onionUrl.trim() || !bothReady} 
                sx={{ bgcolor: bothReady ? '#00bcd4' : '#ff4081' }}
              >
                {scraping ? 'Scraping...' : '🔍 Scrape & Classify'}
              </Button>
            </Box>

            {scraping && <LinearProgress sx={{ mb: 2 }} />}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Quick Text Analysis */}
            <Accordion sx={{ bgcolor: '#0f172a', mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#00bcd4' }} />}>
                <Typography sx={{ color: '#00bcd4' }}>📝 Quick Text Analysis</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TextField fullWidth multiline rows={2} placeholder="Enter text..." value={predictText} onChange={(e) => setPredictText(e.target.value)} sx={{ mb: 1 }} />
                <Button variant="contained" onClick={handlePredictText} disabled={!predictText} fullWidth sx={{ bgcolor: '#00bcd4' }}>Analyze</Button>
                {predictionResult && (
                  <Box sx={{ mt: 2 }}>
                    <Divider />
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                      <Chip label={predictionResult.prediction?.toUpperCase()} sx={{ bgcolor: getThreatColor(predictionResult.threat_level), color: '#fff' }} />
                      <Chip label={`Confidence: ${(predictionResult.confidence * 100).toFixed(1)}%`} sx={{ bgcolor: '#00bcd4', color: '#fff' }} />
                      <Chip label={`Risk: ${predictionResult.risk_score?.toFixed(0)}%`} sx={{ bgcolor: '#ff4081', color: '#fff' }} />
                      <Chip label={`Level: ${predictionResult.threat_level}`} sx={{ bgcolor: getThreatColor(predictionResult.threat_level), color: '#fff' }} />
                    </Box>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>

            {/* SCRAPED RESULTS - WITH TEXT AND IMAGES */}
            {scrapedData && (
              <Card sx={{ bgcolor: '#0f172a', mb: 2, border: '1px solid #00bcd4' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ color: '#00bcd4', mb: 1 }}>🎯 Threat Analysis Results</Typography>
                  
                  {/* Classification Stats */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption">Prediction</Typography>
                      <Chip label={scrapedData.text_classification?.prediction?.toUpperCase()} sx={{ bgcolor: getThreatColor(scrapedData.threat_level), color: '#fff', mt: 1 }} />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption">Confidence</Typography>
                      <Typography variant="h6">{(scrapedData.text_classification?.confidence * 100).toFixed(1)}%</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption">Risk Score</Typography>
                      <Typography variant="h6">{scrapedData.overall_risk?.toFixed(0)}%</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption">Threat Level</Typography>
                      <Chip label={scrapedData.threat_level} sx={{ bgcolor: getThreatColor(scrapedData.threat_level), color: '#fff', mt: 1 }} />
                    </Grid>
                  </Grid>
                  
                  {/* SCRAPED TEXT CONTENT - SHOW THE ACTUAL TEXT */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ color: '#00bcd4' }}>📄 Scraped Text Content:</Typography>
                    <Paper sx={{ p: 2, mt: 1, bgcolor: '#0a1929', maxHeight: 200, overflow: 'auto' }}>
                      <Typography variant="body2" sx={{ color: '#ccc', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {scrapedData.text_content || 'No text content scraped'}
                      </Typography>
                    </Paper>
                  </Box>
                  
                  {/* SCRAPED IMAGES - SHOW THE ACTUAL IMAGES */}
                  {scrapedData.images && scrapedData.images.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" sx={{ color: '#00bcd4' }}>📸 Downloaded Images ({scrapedData.images.length}):</Typography>
                      <Grid container spacing={1} sx={{ mt: 1 }}>
                        {scrapedData.images.map((img, idx) => (
                          <Grid item xs={6} sm={4} md={3} key={idx}>
                            <Card sx={{ bgcolor: '#1e293b' }}>
                              {img.base64 ? (
                                <Box 
                                  component="img" 
                                  src={img.base64} 
                                  alt={img.filename} 
                                  sx={{ 
                                    width: '100%', 
                                    height: 100, 
                                    objectFit: 'cover',
                                    borderBottom: `2px solid ${getThreatColor(img.classification?.threat_level)}`
                                  }} 
                                />
                              ) : (
                                <Box sx={{ height: 100, bgcolor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <ImageIcon sx={{ color: '#00bcd4' }} />
                                </Box>
                              )}
                              <CardContent sx={{ p: 1 }}>
                                <Typography variant="caption" display="block" sx={{ color: '#00bcd4', fontWeight: 'bold' }}>
                                  {img.classification?.prediction?.toUpperCase()}
                                </Typography>
                                <Typography variant="caption" display="block" sx={{ color: '#ff4081' }}>
                                  Risk: {img.classification?.risk_score?.toFixed(0)}%
                                </Typography>
                                <Chip 
                                  label={img.classification?.threat_level || 'LOW'} 
                                  size="small" 
                                  sx={{ bgcolor: getThreatColor(img.classification?.threat_level), color: '#fff', fontSize: '0.6rem' }} 
                                />
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                  
                  {/* LINKS */}
                  {scrapedData.links && scrapedData.links.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" sx={{ color: '#00bcd4' }}>🔗 Links Found ({scrapedData.links.length}):</Typography>
                      <Box sx={{ maxHeight: 80, overflow: 'auto', mt: 1 }}>
                        {scrapedData.links.slice(0, 10).map((link, idx) => (
                          <Typography key={idx} variant="caption" display="block" sx={{ color: '#888', fontSize: '0.7rem' }}>
                            {link}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent Scrapes */}
            <Typography variant="subtitle2" sx={{ color: '#00bcd4', mb: 1 }}>📜 Recent Intelligence</Typography>
            <List sx={{ maxHeight: 280, overflow: 'auto', bgcolor: '#0f172a', borderRadius: 1 }}>
              {recentScrapes.slice(0, 6).map((scrape, idx) => (
                <ListItem key={idx} sx={{ borderBottom: '1px solid #333', cursor: 'pointer' }} onClick={() => setOnionUrl(scrape.url)}>
                  <ListItemIcon><Chip label={scrape.threat_level} size="small" sx={{ bgcolor: getThreatColor(scrape.threat_level), color: '#fff', width: 55 }} /></ListItemIcon>
                  <ListItemText 
                    primary={scrape.url} 
                    secondary={`Risk: ${scrape.risk?.toFixed(0)}% | ${scrape.prediction?.toUpperCase()} | Images: ${scrape.images || 0}`} 
                    primaryTypographyProps={{ sx: { color: '#00bcd4' } }} 
                  />
                  <IconButton size="small"><PlayArrowIcon sx={{ color: '#00bcd4' }} /></IconButton>
                </ListItem>
              ))}
              {recentScrapes.length === 0 && <Typography sx={{ textAlign: 'center', py: 3, color: '#666' }}>No scrapes yet</Typography>}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ThreatIntelligence;