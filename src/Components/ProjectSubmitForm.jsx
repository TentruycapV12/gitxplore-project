import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  MenuItem,
  FormControlLabel,
  Checkbox
} from '@mui/material';

/**
 * Slide 12: Working with Form (React Hook Form & Yup Validation)
 */
const schema = yup.object({
  title: yup.string().required('Tiêu đề dự án không được bỏ trống').min(5, 'Tiêu đề ít nhất 5 ký tự'),
  repoUrl: yup.string().required('GitHub URL là bắt buộc').url('Vui lòng nhập đúng định dạng URL'),
  category: yup.string().required('Vui lòng chọn danh mục'),
  agree: yup.boolean().oneOf([true], 'Bạn phải đồng ý với quy định mã nguồn mở')
}).required();

export default function ProjectSubmitForm({ onSubmitSuccess }) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      repoUrl: '',
      category: 'web',
      agree: false
    }
  });

  const onSubmit = async (data) => {
    if (onSubmitSuccess) {
      await onSubmitSuccess(data);
    }
    reset();
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 2,
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5
      }}
    >
      <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 700 }}>
        📋 Slide 12: Form Validation với React Hook Form & Yup
      </Typography>

      <TextField
        label="Tên dự án *"
        variant="outlined"
        fullWidth
        size="small"
        {...register('title')}
        error={!!errors.title}
        helperText={errors.title?.message}
      />

      <TextField
        label="GitHub Repository URL *"
        placeholder="https://github.com/username/project"
        variant="outlined"
        fullWidth
        size="small"
        {...register('repoUrl')}
        error={!!errors.repoUrl}
        helperText={errors.repoUrl?.message}
      />

      <Controller
        name="category"
        control={control}
        render={({ field }) => (
          <TextField
            select
            label="Danh mục *"
            size="small"
            fullWidth
            {...field}
            error={!!errors.category}
            helperText={errors.category?.message}
          >
            <MenuItem value="web">Web Development</MenuItem>
            <MenuItem value="ai">AI / Machine Learning</MenuItem>
            <MenuItem value="mobile">Mobile Apps</MenuItem>
            <MenuItem value="tools">Developer Tools</MenuItem>
          </TextField>
        )}
      />

      <FormControlLabel
        control={
          <Controller
            name="agree"
            control={control}
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                color="primary"
              />
            )}
          />
        }
        label={<Typography variant="body2" sx={{ color: '#cbd5e1' }}>Tôi cam kết dự án tuân thủ giấy phép mã nguồn mở</Typography>}
      />
      {errors.agree && <Alert severity="error">{errors.agree.message}</Alert>}

      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={isSubmitting}
        sx={{ py: 1, fontWeight: 700 }}
      >
        {isSubmitting ? 'Đang gửi...' : 'Gửi Dự Án Ngay'}
      </Button>
    </Box>
  );
}
