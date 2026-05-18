import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Paper, Typography, Box, Card, CardContent, Avatar,
  Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, LinearProgress, TextField, Button,
  Alert, CircularProgress
} from '@mui/material';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import ImageIcon from '@mui/icons-material/Image';
import SearchIcon from '@mui/icons-material/Search';
import api from '../services/api';

const APP_TITLE = "DarkWeb Sentinel - AI-Powered Threat Intelligence Platform";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalThreats: 0,
    highRiskThreats: 0,
    activeScrapers: 3,
    detectionRate: 0,
  });
  const [recentThreats, setRecentThreats] = useState([]);
  const [threatTrends, setThreatTrends] = useState([]);
  const [threatDistribution, setThreatDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onionUrl, setOnionUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState(null);
  const [scrapeError, setScrapeError] = useState(null);
  const [torStatus, setTorStatus] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchTorStatus();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTorStatus = async () => {
    try {
      const res = await api.getTorStatus();
      setTorStatus(res.data.running);
    } catch (err) {
      console.error('Tor status error:', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const scrapesRes = await api.getRecentScrapes(50);
      const scrapes = scrapesRes.data.scrapes || [];
      
      const totalThreats = scrapes.length;
      const highRiskThreats = scrapes.filter(s => s.threat_level === 'HIGH').length;
      const detectionRate = totalThreats > 0 ? (highRiskThreats / totalThreats * 100).toFixed(1) : 0;
      
      const gunCount = scrapes.filter(s => s.prediction === 'gun').length;
      const drugCount = scrapes.filter(s => s.prediction === 'drug').length;
      const poisonCount = scrapes.filter(s => s.prediction === 'poison').length;
      
      if (totalThreats > 0 && (gunCount > 0 || drugCount > 0 || poisonCount > 0)) {
        const distData = [];
        if (gunCount > 0) distData.push({ name: 'Firearms', value: gunCount, color: '#ff4081' });
        if (drugCount > 0) distData.push({ name: 'Drugs', value: drugCount, color: '#ff9800' });
        if (poisonCount > 0) distData.push({ name: 'Poison', value: poisonCount, color: '#00bcd4' });
        setThreatDistribution(distData);
      } else {
        setThreatDistribution([]);
      }
      
      const last7Days = [...Array(7)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dayScrapes = scrapes.filter(s => {
          const scrapeDate = new Date(s.timestamp);
          return scrapeDate.toDateString() === date.toDateString();
        });
        return {
          day: dateStr,
          threats: dayScrapes.length,
          highRisk: dayScrapes.filter(s => s.threat_level === 'HIGH').length,
        };
      });
      setThreatTrends(last7Days);
      setRecentThreats(scrapes.slice(0, 10));
      
      setStats({
        totalThreats,
        highRiskThreats,
        activeScrapers: 3,
        detectionRate: parseFloat(detectionRate),
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const handleScrapeOnion = async () => {
    if (!onionUrl.trim()) {
      setScrapeError('Please enter a .onion URL');
      return;
    }
    
    setScraping(true);
    setScrapeError(null);
    setScrapedData(null);
    
    try {
      console.log('🌐 Scraping URL:', onionUrl);
      const response = await api.scrapeOnion(onionUrl, true);
      console.log('📦 Response:', response.data);
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        setScrapedData(result);
        await fetchDashboardData();
      } else {
        setScrapeError('No results returned.');
      }
    } catch (err) {
      setScrapeError('Scraping failed: ' + (err.message));
    } finally {
      setScraping(false);
    }
  };

  const getThreatColor = (level) => {
    switch (level) {
      case 'HIGH': return '#ff4081';
      case 'MEDIUM': return '#ff9800';
      case 'LOW': return '#4caf50';
      default: return '#9ca3af';
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ bgcolor: '#111827', height: '100%', border: '1px solid #1f2937' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="#9ca3af" variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ color: color || '#fff', mt: 1, fontWeight: 700 }}>
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}20`, color: color }}>{icon}</Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const COLORS = ['#ff4081', '#ff9800', '#00bcd4'];

  if (loading) {
    return (
      <Container sx={{ mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, color: '#fff', textAlign: 'center' }}>Loading dashboard...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, color: '#00bcd4', textAlign: 'center' }}>
          {APP_TITLE}
        </Typography>
        <Typography variant="body1" sx={{ color: '#9ca3af', textAlign: 'center', mt: 1 }}>
          Real-time dark web threat intelligence using Graph Neural Networks (GNN) and Vision Transformers (ViT)
        </Typography>
      </Box>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>Threat Intelligence Dashboard</Typography>
          <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5 }}>Live dark web monitoring and AI-powered threat analysis</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label={torStatus ? "Tor: Connected" : "Tor: Disconnected"} sx={{ bgcolor: torStatus ? '#4caf50' : '#ff4081', color: '#fff' }} />
          <Tooltip title="Refresh Data"><IconButton onClick={fetchDashboardData} sx={{ color: '#00bcd4' }}><RefreshIcon /></IconButton></Tooltip>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Threats Detected" value={stats.totalThreats} icon={<WarningIcon />} color="#ff4081" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="High Risk Threats" value={stats.highRiskThreats} icon={<SecurityIcon />} color="#ff9800" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Active Scrapers" value={stats.activeScrapers} icon={<CheckCircleIcon />} color="#4caf50" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Detection Rate" value={`${stats.detectionRate}%`} icon={<TrendingUpIcon />} color="#00bcd4" />
        </Grid>
      </Grid>

      {/* Scraper Section */}
      <Paper sx={{ p: 3, bgcolor: '#111827', border: '1px solid #1f2937', mb: 4 }}>
        <Typography variant="h6" sx={{ color: '#00bcd4', mb: 1 }}>🌐 Dark Web Intelligence Collector</Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af', mb: 2 }}>
          Enter a .onion URL to scrape content and classify threats using trained GNN and ViT models
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField 
            fullWidth 
            placeholder="Enter .onion URL (e.g., facebookcorewwwi.onion)" 
            value={onionUrl} 
            onChange={(e) => setOnionUrl(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && handleScrapeOnion()} 
            sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: '#1f2937' } } }} 
          />
          <Button 
            variant="contained" 
            onClick={handleScrapeOnion} 
            disabled={scraping || !onionUrl.trim()} 
            startIcon={scraping ? <CircularProgress size={20} /> : <SearchIcon />}
            sx={{ bgcolor: '#00bcd4', '&:hover': { bgcolor: '#ff4081' }, minWidth: 180 }}
          >
            {scraping ? 'Analyzing Dark Web...' : 'Threat Intelligence Scan'}
          </Button>
        </Box>

        {scraping && <LinearProgress sx={{ mb: 2 }} />}
        {scrapeError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setScrapeError(null)}>{scrapeError}</Alert>}

        {/* Tor Not Running Warning */}
        {!torStatus && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            ⚠️ Tor is not running. Please start Tor to scrape real .onion sites.
          </Alert>
        )}

        {/* Scraped Results */}
        {scrapedData && (
          <Box sx={{ mt: 2 }}>
            {/* Images Section */}
            {scrapedData.images && scrapedData.images.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#00bcd4', mb: 2 }}>
                  📸 Downloaded Images ({scrapedData.images.length} images)
                </Typography>
                <Grid container spacing={2}>
                  {scrapedData.images.map((img, idx) => (
                    <Grid item xs={6} sm={4} md={3} key={idx}>
                      <Card sx={{ bgcolor: '#1f2937' }}>
                        {img.base64 ? (
                          <img 
                            src={img.base64} 
                            alt={img.filename} 
                            style={{ width: '100%', height: 150, objectFit: 'cover' }} 
                          />
                        ) : (
                          <Box sx={{ height: 150, bgcolor: '#0a0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ImageIcon sx={{ color: '#00bcd4', fontSize: 50 }} />
                          </Box>
                        )}
                        <CardContent sx={{ p: 1 }}>
                          <Typography variant="caption" display="block" sx={{ color: '#00bcd4', textAlign: 'center' }}>
                            {img.classification?.prediction?.toUpperCase()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Classification Results */}
            {scrapedData.text_classification && (
              <Paper sx={{ p: 2, bgcolor: '#0a0f1a', border: `2px solid ${getThreatColor(scrapedData.threat_level)}` }}>
                <Typography variant="subtitle2" sx={{ color: '#00bcd4', mb: 2 }}>🎯 Threat Analysis Results</Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>Threat Classification</Typography>
                    <Chip label={scrapedData.text_classification?.prediction?.toUpperCase()} sx={{ bgcolor: getThreatColor(scrapedData.threat_level), color: '#fff' }} />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>Confidence Score</Typography>
                    <Typography variant="h6" sx={{ color: '#00bcd4' }}>{(scrapedData.text_classification?.confidence * 100).toFixed(1)}%</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>Risk Assessment</Typography>
                    <Typography variant="h6" sx={{ color: '#ff4081' }}>{scrapedData.overall_risk?.toFixed(0)}%</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>Threat Level</Typography>
                    <Chip label={scrapedData.threat_level} sx={{ bgcolor: getThreatColor(scrapedData.threat_level), color: '#fff' }} />
                  </Grid>
                </Grid>

                <Typography variant="caption" sx={{ color: '#00bcd4' }}>📄 Extracted Content</Typography>
                <Paper sx={{ p: 2, mt: 1, bgcolor: '#0a0f1a', maxHeight: 200, overflow: 'auto' }}>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    {scrapedData.text_content || 'No content extracted'}
                  </Typography>
                </Paper>
              </Paper>
            )}
          </Box>
        )}
      </Paper>

      {/* Charts */}
      {stats.totalThreats > 0 && threatDistribution.length > 0 ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, bgcolor: '#111827' }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>Threat Detection Trends</Typography>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={threatTrends}>
                  <defs>
                    <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff4081" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ff4081" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="day" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #00bcd4' }} />
                  <Legend />
                  <Area type="monotone" dataKey="threats" stroke="#ff4081" fill="url(#colorThreats)" name="Total Threats" />
                  <Area type="monotone" dataKey="highRisk" stroke="#ff9800" fill="none" name="High Risk" />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, bgcolor: '#111827' }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>Threat Distribution</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={threatDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {threatDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      ) : stats.totalThreats === 0 ? (
        <Paper sx={{ p: 4, bgcolor: '#111827', textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: '#9ca3af' }}>
            📊 No threat data available yet. Use the Threat Intelligence Scan above to start analyzing onion sites.
          </Typography>
        </Paper>
      ) : null}

      {/* Recent Threats Table */}
      <Paper sx={{ p: 3, bgcolor: '#111827', mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>Recent Threat Intelligence</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#9ca3af' }}>URL</TableCell>
                <TableCell sx={{ color: '#9ca3af' }}>Threat Type</TableCell>
                <TableCell sx={{ color: '#9ca3af' }}>Risk Score</TableCell>
                <TableCell sx={{ color: '#9ca3af' }}>Threat Level</TableCell>
                <TableCell sx={{ color: '#9ca3af' }}>Images</TableCell>
                <TableCell sx={{ color: '#9ca3af' }}>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentThreats.map((threat, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ color: '#00bcd4' }}>{threat.url?.substring(0, 40)}...</TableCell>
                  <TableCell><Chip label={threat.prediction?.toUpperCase()} size="small" sx={{ bgcolor: getThreatColor(threat.threat_level), color: '#fff' }} /></TableCell>
                  <TableCell sx={{ color: '#ff4081' }}>{threat.risk?.toFixed(0)}%</TableCell>
                  <TableCell><Chip label={threat.threat_level} size="small" sx={{ bgcolor: getThreatColor(threat.threat_level), color: '#fff' }} /></TableCell>
                  <TableCell>{threat.images || 0}</TableCell>
                  <TableCell sx={{ color: '#9ca3af' }}>{new Date(threat.timestamp).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {recentThreats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ color: '#9ca3af', py: 4 }}>
                    No threats detected yet. Use the collector above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default Dashboard;