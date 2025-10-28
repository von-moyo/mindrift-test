import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { toast } from 'sonner';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();

  // Validation functions
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  
  const passwordRequirements = {
    minLength: (password) => password.length >= 8,
    hasUpperCase: (password) => /[A-Z]/.test(password),
    hasLowerCase: (password) => /[a-z]/.test(password),
    hasNumber: (password) => /\d/.test(password),
    hasSpecialChar: (password) => /[@$!%*?&]/.test(password),
  };

  const checkAllPasswordRequirements = (password) => {
    return Object.values(passwordRequirements).every((check) => check(password));
  };

  const getPasswordStrength = (password) => {
    if (!password) return '';
    const passed = Object.values(passwordRequirements).filter((check) => check(password)).length;
    if (passed <= 2) return 'Weak';
    if (passed <= 4) return 'Medium';
    return 'Strong';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear general error on any change
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: null }));
    }

    // Real-time validation
    if (name === 'email') {
      if (value && !validateEmail(value)) {
        setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
      } else {
        setErrors((prev) => ({ ...prev, email: null }));
      }
    } else if (name === 'password') {
      if (value && !checkAllPasswordRequirements(value)) {
        setErrors((prev) => ({ ...prev, password: 'Password must meet all requirements' }));
      } else {
        setErrors((prev) => ({ ...prev, password: null }));
      }
      // Re-validate confirm password if it's already filled
      if (formData.confirmPassword) {
        if (value !== formData.confirmPassword) {
          setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
        } else {
          setErrors((prev) => ({ ...prev, confirmPassword: null }));
        }
      }
    } else if (name === 'confirmPassword') {
      if (value !== formData.password) {
        setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: null }));
      }
    } else if (name === 'fullName') {
      if (value.length > 0 && value.length < 2) {
        setErrors((prev) => ({ ...prev, fullName: 'Name must be at least 2 characters' }));
      } else {
        setErrors((prev) => ({ ...prev, fullName: null }));
      }
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
  };

  const isFormValid = () => {
    return (
      formData.email &&
      validateEmail(formData.email) &&
      formData.password &&
      checkAllPasswordRequirements(formData.password) &&
      formData.confirmPassword &&
      formData.password === formData.confirmPassword &&
      (formData.fullName === '' || formData.fullName.length >= 2) &&
      !errors.email &&
      !errors.password &&
      !errors.confirmPassword &&
      !errors.fullName
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ email: true, password: true, confirmPassword: true, fullName: true });

    // Final validation
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!checkAllPasswordRequirements(formData.password)) {
      newErrors.password = 'Password must meet all requirements';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.fullName.length > 0 && formData.fullName.length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.register({ email: formData.email, password: formData.password, fullName: formData.fullName });
      toast.success('Account created successfully!');
      setTimeout(() => navigate('/catalog'), 2000);
    } catch (error) {
      setIsSubmitting(false);
      if (error.status === 409) {
        toast.error('Account creation failed. Please try again.');
      } else if (error.status === 400) {
        toast.error('Account creation failed. Please try again.');
      } else {
        toast.error('Account creation failed. Please try again.');
      }
    }
  };

  const strength = getPasswordStrength(formData.password);
  const strengthColors = {
    Weak: 'bg-red-500',
    Medium: 'bg-yellow-500',
    Strong: 'bg-green-500',
  };

  // Inline SVG Icons
  const EyeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );

  const EyeOffIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  );

  const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  const XIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );

  const SpinnerIcon = () => (
    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="6"></line>
      <line x1="12" y1="18" x2="12" y2="22"></line>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
      <line x1="2" y1="12" x2="6" y2="12"></line>
      <line x1="18" y1="12" x2="22" y2="12"></line>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-[400px]">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign Up</h2>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Email Field */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                touched.email && errors.email
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
              required
            />
            {touched.email && errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  touched.password && errors.password
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strengthColors[strength] || 'bg-gray-200'}`}
                    style={{
                      width: strength === 'Weak' ? '33%' : strength === 'Medium' ? '66%' : '100%',
                    }}
                  ></div>
                </div>
                <span className={`text-xs font-medium ${
                  strength === 'Weak' ? 'text-red-600' : strength === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {strength}
                </span>
              </div>
            </div>
          )}

          {/* Password Requirements */}
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="text-xs font-medium text-gray-700 mb-2">Password must contain:</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className={passwordRequirements.minLength(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                  {passwordRequirements.minLength(formData.password) ? <CheckIcon /> : <XIcon />}
                </span>
                <span className={passwordRequirements.minLength(formData.password) ? 'text-green-700' : 'text-gray-600'}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={passwordRequirements.hasUpperCase(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                  {passwordRequirements.hasUpperCase(formData.password) ? <CheckIcon /> : <XIcon />}
                </span>
                <span className={passwordRequirements.hasUpperCase(formData.password) ? 'text-green-700' : 'text-gray-600'}>
                  One uppercase letter
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={passwordRequirements.hasLowerCase(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                  {passwordRequirements.hasLowerCase(formData.password) ? <CheckIcon /> : <XIcon />}
                </span>
                <span className={passwordRequirements.hasLowerCase(formData.password) ? 'text-green-700' : 'text-gray-600'}>
                  One lowercase letter
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={passwordRequirements.hasNumber(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                  {passwordRequirements.hasNumber(formData.password) ? <CheckIcon /> : <XIcon />}
                </span>
                <span className={passwordRequirements.hasNumber(formData.password) ? 'text-green-700' : 'text-gray-600'}>
                  One number
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={passwordRequirements.hasSpecialChar(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                  {passwordRequirements.hasSpecialChar(formData.password) ? <CheckIcon /> : <XIcon />}
                </span>
                <span className={passwordRequirements.hasSpecialChar(formData.password) ? 'text-green-700' : 'text-gray-600'}>
                  One special character (@$!%*?&)
                </span>
              </div>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  touched.confirmPassword && errors.confirmPassword
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isSubmitting}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Full Name Field */}
          <div className="mb-6">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-gray-500 text-xs">(optional)</span>
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                touched.fullName && errors.fullName
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
            />
            {touched.fullName && errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid() || isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <span className="mr-2"><SpinnerIcon /></span>
                Creating account...
              </>
            ) : (
              'Sign Up'
            )}
          </button>

          {/* Optional: Link to Login */}
          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;