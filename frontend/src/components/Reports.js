import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, Grid, Card, CardContent, Button, Box } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import api from '../services/api';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const scrapes = await api.getRecentScrapes(100);
      setReports(scrapes.data.scrapes || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const generateReport = () => {
    const report = {
      date: new Date().toISOString(),
      totalThreats: reports.length,
      highRisk: reports.filter(r => r.threat_level === 'HIGH').length,
      mediumRisk: reports.filter(r => r.threat_level === 'MEDIUM').length,
      lowRisk: reports.filter(r => r.threat_level === 'LOW').length,
      threatsByType: {
        gun: reports.filter(r => r.prediction === 'gun').length,
        drug: reports.filter(r => r.prediction === 'drug').length,
        poison: reports.filter(r => r.prediction === 'poison').length,
      }
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threat_report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ color: '#00bcd4' }}>Threat Intelligence Reports</Typography>
        <Button variant="contained" onClick={generateReport} startIcon={<DescriptionIcon />} sx={{ bgcolor: '#00bcd4' }}>Export Report</Button>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, bgcolor: '#111827' }}>
            <Typography variant="h6" sx={{ color: '#00bcd4', mb: 2 }}>Summary Statistics</Typography>
            <Typography>Total Threats: {reports.length}</Typography>
            <Typography>High Risk: {reports.filter(r => r.threat_level === 'HIGH').length}</Typography>
            <Typography>Medium Risk: {reports.filter(r => r.threat_level === 'MEDIUM').length}</Typography>
            <Typography>Low Risk: {reports.filter(r => r.threat_level === 'LOW').length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, bgcolor: '#111827' }}>
            <Typography variant="h6" sx={{ color: '#00bcd4', mb: 2 }}>Threat Breakdown</Typography>
            <Typography>Firearms: {reports.filter(r => r.prediction === 'gun').length}</Typography>
            <Typography>Drugs: {reports.filter(r => r.prediction === 'drug').length}</Typography>
            <Typography>Poison: {reports.filter(r => r.prediction === 'poison').length}</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Reports;