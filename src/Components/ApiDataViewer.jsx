import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid
} from '@mui/material';

/**
 * Slide 13: Call API với Axios (GET & POST, Async/Await, Loading/Error States)
 */
export default function ApiDataViewer() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    // Call Mock API hoặc GitHub API
    axios.get('https://api.github.com/orgs/facebook/repos?per_page=4&sort=stars')
      .then(res => {
        if (isMounted) {
          setData(res.data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          // Fallback mock data nếu rate limit
          setData([
            { id: 101, name: 'react', stargazers_count: 226000, description: 'The library for web and native user interfaces' },
            { id: 102, name: 'react-native', stargazers_count: 118000, description: 'A framework for building native apps using React' },
            { id: 103, name: 'lexical', stargazers_count: 18000, description: 'An extensible text editor framework' },
            { id: 104, name: 'relay', stargazers_count: 17800, description: 'Relay is a JavaScript framework for building data-driven React applications' }
          ]);
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, []);

  return (
    <Box sx={{ mt: 3, p: 3, background: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
      <Typography variant="h6" sx={{ color: '#38bdf8', fontWeight: 700, mb: 2 }}>
        🌐 Slide 13: Axios Call API (Async Data & Trạng thái Loading/Error)
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
          <CircularProgress size={24} color="primary" />
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Đang gửi Axios GET request đến máy chủ...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Lỗi mạng: {error}. Đang sử dụng dữ liệu dự phòng.
        </Alert>
      )}

      {!loading && (
        <Grid container spacing={2}>
          {data.map(repo => (
            <Grid item xs={12} sm={6} key={repo.id}>
              <Card sx={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff' }}>
                <CardContent sx={{ pb: '16px !important' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
                    📦 {repo.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#fbbf24', display: 'block', mb: 1 }}>
                    ⭐ {repo.stargazers_count?.toLocaleString()} stars
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {repo.description || 'Không có mô tả'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
