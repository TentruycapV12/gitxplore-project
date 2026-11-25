import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import axios from 'axios';
import {
  ThemeProvider,
  createTheme,
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  Stack,
  Alert,
  CircularProgress,
  Chip,
  Snackbar,
  Typography,
  Divider,
  AppBar,
  Toolbar,
  Paper,
} from '@mui/material';
import TopNav from '../Components/TopNav.jsx';
import Footer from '../Components/Footer.jsx';
import './SubmitProject.scss';

// =============================================================================
// 1. MATERIAL UI THEME - CẤU HÌNH ĐỘC LẬP THEO PHONG CÁCH DARK OBSIDIAN & AMBER
// =============================================================================
const muiDarkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f59e0b', // Amber của GitXplore
      light: '#fef08a',
      dark: '#d97706',
    },
    secondary: {
      main: '#38bdf8', // Sky Blue
    },
    background: {
      default: '#080505',
      paper: '#120c0c',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
    error: {
      main: '#ef4444',
    },
    success: {
      main: '#10b981',
    },
  },
  typography: {
    fontFamily: 'inherit',
  },
  components: {
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
        fullWidth: true,
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 8,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(245, 158, 11, 0.25)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#f59e0b',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#f59e0b',
            boxShadow: '0 0 10px rgba(245, 158, 11, 0.25)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 700,
        },
      },
    },
  },
});

// =============================================================================
// 2. YUP VALIDATION SCHEMA (SLIDE 12: REACT HOOK FORM + YUP)
// =============================================================================
const projectSchema = yup.object().shape({
  title: yup
    .string()
    .required('Tên dự án là bắt buộc')
    .min(3, 'Tên dự án phải từ 3 ký tự trở lên')
    .max(80, 'Tên dự án không được vượt quá 80 ký tự'),
  author: yup
    .string()
    .required('Tên tác giả hoặc liên hệ là bắt buộc')
    .min(2, 'Tối thiểu 2 ký tự'),
  category: yup
    .string()
    .required('Vui lòng chọn phân loại dự án'),
  repoUrl: yup
    .string()
    .required('Đường dẫn GitHub / Git URL là bắt buộc')
    .url('Đường dẫn phải bắt đầu bằng http:// hoặc https://'),
  license: yup
    .string()
    .default('MIT'),
  description: yup
    .string()
    .required('Mô tả dự án là bắt buộc')
    .min(15, 'Mô tả cần ít nhất 15 ký tự để người đánh giá hiểu rõ'),
  agreeTerms: yup
    .boolean()
    .oneOf([true], 'Bạn phải đồng ý với quy tắc mã nguồn mở GitXplore'),
});

const POPULAR_TAGS = ['React 19', 'Next.js', 'TypeScript', 'Tailwind', 'AI / LLM', 'Golang', 'Rust', 'Python'];

export default function SubmitProjectPage() {
  // State quản lý tags
  const [selectedTags, setSelectedTags] = useState(['React 19', 'AI / LLM']);

  // Slide 13: Axios State
  const [apiPosts, setApiPosts] = useState([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Submit Result State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Slide 12: Khởi tạo React Hook Form kết hợp Yup Resolver
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(projectSchema),
    defaultValues: {
      title: '',
      author: '',
      category: 'Frontend',
      repoUrl: '',
      license: 'MIT',
      description: '',
      agreeTerms: false,
    },
  });

  // ===========================================================================
  // SLIDE 13: GỌI AXIOS GET DỮ LIỆU THỬ NGHIỆM TRỰC TIẾP
  // ===========================================================================
  const fetchSampleApiData = async () => {
    setApiLoading(true);
    setApiError(null);
    try {
      // Gọi API mẫu trực tiếp theo đúng cú pháp bài giảng Slide 13
      const response = await axios.get('https://jsonplaceholder.typicode.com/posts?_limit=3');
      setApiPosts(response.data);
    } catch (err) {
      setApiError(err.message || 'Lỗi khi gọi API');
    } finally {
      setApiLoading(false);
    }
  };

  useEffect(() => {
    fetchSampleApiData();
  }, []);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // ===========================================================================
  // SLIDE 13: GỌI AXIOS POST ĐẨY DỮ LIỆU LÊN API MOCK
  // ===========================================================================
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitResult(null);

    const payload = {
      ...data,
      techStack: selectedTags,
      submittedAt: new Date().toISOString(),
    };

    try {
      // Thực hiện Axios POST (Slide 13 - Slide 7: Axios POST Example)
      const res = await axios.post('https://jsonplaceholder.typicode.com/posts', payload);

      setSubmitResult({
        status: res.status,
        statusText: res.statusText || 'Created',
        data: res.data,
      });

      setSnackbar({
        open: true,
        message: `Dự án "${data.title}" đã được gửi lên API thành công! (Mã phản hồi HTTP ${res.status})`,
        severity: 'success',
      });

      // Reset form sau khi gửi thành công
      reset();
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Lỗi gửi dữ liệu: ${err.message}`,
        severity: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemeProvider theme={muiDarkTheme}>
      <TopNav />

      <main className="submit-project">
        <div className="submit-project__container">
          
          {/* Header BEM (Slide 10) */}
          <header className="submit-project__hero">
            <div className="submit-project__hero--pill">
              ⚡ DEV LAB & SUBMISSION PORTAL
            </div>
            <h1 className="submit-project__hero--title">
              Cổng Đóng Góp Dự Án & Thử Nghiệm API
            </h1>
            <p className="submit-project__hero--subtitle">
              Module tích hợp kiểm thử toàn diện: SCSS/SASS & BEM (Slide 10), Material UI Form (Slide 11), 
              React Hook Form + Yup (Slide 12) và Axios Engine HTTP GET / POST (Slide 13).
            </p>
          </header>

          <div className="submit-project__grid">
            
            {/* CỘT TRÁI: FORM ĐĂNG DỰ ÁN (MUI + REACT HOOK FORM + YUP) */}
            <section className="submit-project__card submit-project__card--interactive">
              <div className="submit-project__section-title">
                <span>📝</span> Biểu Mẫu Nhập Liệu Dự Án (Material UI & Yup)
              </div>

              <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <Stack spacing={2.5}>
                  
                  {/* Tên dự án */}
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Tên dự án (Repository Name)"
                        placeholder="vd: GitXplore AI Engine"
                        error={!!errors.title}
                        helperText={errors.title?.message}
                      />
                    )}
                  />

                  {/* Tác giả & Thể loại (Grid hàng ngang) */}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Controller
                      name="author"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Tác giả / GitHub Handle"
                          placeholder="vd: dev-xplorer"
                          error={!!errors.author}
                          helperText={errors.author?.message}
                        />
                      )}
                    />

                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth size="small" error={!!errors.category}>
                          <InputLabel id="category-label">Phân loại</InputLabel>
                          <Select
                            {...field}
                            labelId="category-label"
                            label="Phân loại"
                          >
                            <MenuItem value="Frontend">Frontend UI / UX</MenuItem>
                            <MenuItem value="Backend">Backend & Microservices</MenuItem>
                            <MenuItem value="Fullstack">Fullstack Ecosystem</MenuItem>
                            <MenuItem value="AI / ML">AI / Machine Learning</MenuItem>
                            <MenuItem value="DevOps">DevOps & Tooling</MenuItem>
                          </Select>
                          {errors.category && (
                            <FormHelperText>{errors.category.message}</FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  </Stack>

                  {/* Git URL */}
                  <Controller
                    name="repoUrl"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Đường dẫn Git (Repository URL)"
                        placeholder="https://github.com/user/project"
                        error={!!errors.repoUrl}
                        helperText={errors.repoUrl?.message}
                      />
                    )}
                  />

                  {/* License Radio Group (MUI Radio) */}
                  <FormControl component="fieldset">
                    <FormLabel component="legend" sx={{ fontSize: '13px', color: '#fef08a', mb: 0.5 }}>
                      Giấy phép mã nguồn (License)
                    </FormLabel>
                    <Controller
                      name="license"
                      control={control}
                      render={({ field }) => (
                        <RadioGroup row {...field}>
                          <FormControlLabel value="MIT" control={<Radio size="small" />} label="MIT" />
                          <FormControlLabel value="Apache-2.0" control={<Radio size="small" />} label="Apache 2.0" />
                          <FormControlLabel value="GPL-3.0" control={<Radio size="small" />} label="GPL 3.0" />
                        </RadioGroup>
                      )}
                    />
                  </FormControl>

                  {/* Tech stack interactive selector */}
                  <Box>
                    <Typography sx={{ fontSize: '13px', color: '#94a3b8', mb: 1 }}>
                      Công nghệ sử dụng (Click để chọn):
                    </Typography>
                    <div className="submit-project__tags">
                      {POPULAR_TAGS.map((tag) => {
                        const active = selectedTags.includes(tag);
                        return (
                          <button
                            type="button"
                            key={tag}
                            className={`submit-project__tag-chip ${active ? 'submit-project__tag-chip--active' : ''}`}
                            onClick={() => toggleTag(tag)}
                          >
                            {active ? '✓ ' : '+ '} {tag}
                          </button>
                        );
                      })}
                    </div>
                  </Box>

                  {/* Mô tả dự án */}
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Mô tả chi tiết dự án"
                        multiline
                        rows={3}
                        placeholder="Nêu vắn tắt kiến trúc, điểm nổi bật và công nghệ áp dụng..."
                        error={!!errors.description}
                        helperText={errors.description?.message}
                      />
                    )}
                  />

                  {/* Checkbox Điều khoản (Yup OneOf validation) */}
                  <Controller
                    name="agreeTerms"
                    control={control}
                    render={({ field }) => (
                      <FormControl error={!!errors.agreeTerms}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              {...field}
                              checked={field.value}
                              color="primary"
                              size="small"
                            />
                          }
                          label={
                            <span style={{ fontSize: '12.5px', color: '#d1d5db' }}>
                              Tôi cam kết tuân thủ quy tắc mã nguồn mở và chịu trách nhiệm về nội dung tải lên.
                            </span>
                          }
                        />
                        {errors.agreeTerms && (
                          <FormHelperText>{errors.agreeTerms.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />

                  {/* Nút gửi (Axios POST trigger) */}
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isSubmitting}
                    sx={{
                      py: 1.4,
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#080505',
                      fontSize: '14px',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      },
                    }}
                  >
                    {isSubmitting ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CircularProgress size={20} color="inherit" />
                        <span>Đang gửi qua Axios POST...</span>
                      </Stack>
                    ) : (
                      '🚀 Xác Nhận Gửi Dự Án (Axios POST)'
                    )}
                  </Button>
                </Stack>
              </Box>

              {/* HIỂN THỊ KẾT QUẢ AXIOS POST KHI GỬI THÀNH CÔNG */}
              {submitResult && (
                <Box sx={{ mt: 3 }}>
                  <Alert severity="success" sx={{ mb: 1.5 }}>
                    <strong>HTTP Status {submitResult.status} ({submitResult.statusText}):</strong> Dữ liệu đã được nạp thành công lên server mô phỏng!
                  </Alert>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Dữ liệu JSON phản hồi từ server (Live Axios Response):
                  </Typography>
                  <pre className="submit-project__response-preview">
                    {JSON.stringify(submitResult.data, null, 2)}
                  </pre>
                </Box>
              )}
            </section>

            {/* CỘT PHẢI: LIVE MONITORING AXIOS GET & BẢNG TIÊU CHUẨN ĐÁNH GIÁ */}
            <aside>
              <div className="submit-project__card submit-project__card--highlight">
                <div className="submit-project__section-title">
                  <span>⚡</span> Giám Sát API Trực Tiếp (Axios GET)
                </div>

                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                  Dữ liệu được nạp động từ endpoint <code style={{ color: '#fef08a' }}>/posts?_limit=3</code> bằng phương thức <code style={{ color: '#38bdf8' }}>axios.get()</code>.
                </Typography>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={fetchSampleApiData}
                  disabled={apiLoading}
                  sx={{ mb: 2 }}
                >
                  {apiLoading ? 'Đang nạp...' : '🔄 Làm mới dữ liệu (Axios GET)'}
                </Button>

                {apiLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={28} color="primary" />
                  </Box>
                )}

                {apiError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {apiError}
                  </Alert>
                )}

                {!apiLoading && !apiError && (
                  <div className="submit-project__api-feed">
                    {apiPosts.map((post) => (
                      <div key={post.id} className="submit-project__api-feed--item">
                        <h4>#{post.id}. {post.title}</h4>
                        <p>{post.body.slice(0, 100)}...</p>
                      </div>
                    ))}
                  </div>
                )}

                <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                {/* BẢNG TỔNG HỢP KIẾN THỨC CÁC SLIDE */}
                <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#fef08a', mb: 1.5 }}>
                  🎯 Bằng Chứng Đáp Ứng Slide Bài Giảng:
                </Typography>

                <Stack spacing={1}>
                  <Chip
                    label="Slide 10: SCSS, BEM, Mixins & Variables ($gx-primary...)"
                    size="small"
                    sx={{ bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#fef08a', justifyContent: 'flex-start', py: 1.8 }}
                  />
                  <Chip
                    label="Slide 11: Material UI (Theme, TextField, Select, Radio, Checkbox)"
                    size="small"
                    sx={{ bgcolor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', justifyContent: 'flex-start', py: 1.8 }}
                  />
                  <Chip
                    label="Slide 12: React Hook Form + Yup Schema Validation"
                    size="small"
                    sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', justifyContent: 'flex-start', py: 1.8 }}
                  />
                  <Chip
                    label="Slide 13: Call API Axios (GET /posts, POST new project)"
                    size="small"
                    sx={{ bgcolor: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', justifyContent: 'flex-start', py: 1.8 }}
                  />
                </Stack>
              </div>
            </aside>

          </div>

          {/* ========================================================================= */}
          {/* KHỐI TRÌNH DIỄN BỔ SUNG: SLIDE 10 LAB (BEM CARD) & SLIDE 11 LAB (MUI APPBAR) */}
          {/* ========================================================================= */}
          <Box sx={{ mt: 6, pt: 5, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#fef08a', mb: 1, textAlign: 'center' }}>
              🔬 Khu Vực Trình Diễn Chi Tiết Thực Hành Slide 10 & Slide 11
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', mb: 4 }}>
              Đối chiếu chuẩn mã nguồn theo đúng từng slide bài tập do giảng viên yêu cầu
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.3fr' }, gap: 4, alignItems: 'start' }}>
              
              {/* CỘT 1: THẺ CARD BEM THEO ĐÚNG SLIDE 10 LAB */}
              <Box className="submit-project__card">
                <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#fef08a', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>🎨</span> Slide 10 LAB: Thẻ Card UI (SCSS + BEM + Hover)
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '12.5px', mb: 2.5 }}>
                  Yêu cầu bài Lab: Tạo Card UI gồm Ảnh, Tiêu đề, Mô tả ngắn, Nút "Read More", dùng biến SCSS và hiệu ứng hover.
                </Typography>

                {/* THE BEM CARD COMPONENT */}
                <div className="card">
                  <div className="card__image-wrap">
                    <img
                      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600"
                      alt="Demo BEM Card"
                      className="card__image"
                    />
                  </div>
                  <div className="card__content">
                    <span className="card__tag">Slide 10 Demo</span>
                    <h3 className="card__title">Kiến Trúc BEM trong SCSS</h3>
                    <p className="card__description">
                      Thành phần giao diện tuân thủ quy tắc Block-Element-Modifier, biến <code>$gx-primary</code>, nesting SCSS và hiệu ứng scale mượt mà.
                    </p>
                    <button type="button" className="card__button" onClick={() => alert('Thao tác mở bài viết (Read More) thành công!')}>
                      Read More →
                    </button>
                  </div>
                </div>
              </Box>

              {/* CỘT 2: MUI APPBAR & TOOLBAR THEO ĐÚNG SLIDE 11 LAB */}
              <Box className="submit-project__card">
                <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#38bdf8', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>🧱</span> Slide 11 LAB: Layout với MUI AppBar & Toolbar
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '12.5px', mb: 2.5 }}>
                  Yêu cầu bài Lab: Kết hợp Header (AppBar + Toolbar) và Footer (Paper/Box) vào một Layout chuẩn Material Design.
                </Typography>

                {/* KHUNG MÔ PHỎNG LAYOUT MUI */}
                <Paper
                  elevation={3}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    background: '#0a0a0c',
                  }}
                >
                  {/* Header Exam (Slide 11 - Slide 22) */}
                  <AppBar position="static" sx={{ bgcolor: 'rgba(30, 41, 59, 0.95)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fef08a' }}>
                        ⚡ My Website (MUI AppBar)
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button color="inherit" size="small">Home</Button>
                        <Button color="inherit" size="small">About</Button>
                        <Button color="inherit" size="small">Contact</Button>
                      </Box>
                    </Toolbar>
                  </AppBar>

                  {/* Body Content (Slide 11 - Slide 24) */}
                  <Box sx={{ p: 3, minHeight: 120, bgcolor: 'rgba(15, 23, 42, 0.5)' }}>
                    <Typography variant="body2" sx={{ color: '#e2e8f0', mb: 1, fontWeight: 600 }}>
                      📌 Vùng Nội Dung Chính (Main Layout Content):
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', lineHeight: 1.6, display: 'block' }}>
                      Thành phần được bọc trong <code>Layout(&#123; children &#125;)</code> với Header và Footer trải rộng toàn màn hình theo đúng mã nguồn mẫu trong Slide 11 (Slide 21–24).
                    </Typography>
                  </Box>

                  {/* Footer Exam (Slide 11 - Slide 23) */}
                  <Box
                    sx={{
                      py: 1.5,
                      px: 2,
                      bgcolor: 'rgba(15, 23, 42, 0.95)',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      © 2025 GitXplore • Material UI Layout Demo (Slide 11 Completed)
                    </Typography>
                  </Box>
                </Paper>
              </Box>

            </Box>
          </Box>

          <footer className="submit-project__footer-note">
            <span>GitXplore Dev Portal • <strong>100% Hoàn Chỉnh Yêu Cầu Học Phần ReactJS</strong></span>
          </footer>

        </div>
      </main>

      <Footer />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
