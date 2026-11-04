
import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const STORAGE_KEY = "showpass_progress";

const initialForm = {
  fullName: "",
  mobile: "",
  email: "",
  password: "",
  confirmPassword: "",
  terms: false
};

function App() {
  const [page, setPage] = useState("register");
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [modal, setModal] = useState("");
  const [loading, setLoading] = useState(false);

  const [resumeAvailable, setResumeAvailable] = useState(false);
  const [storageReady, setStorageReady] = useState(false);

  // OTP states
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpCode, setOtpCode] = useState("123456");
  const [otpError, setOtpError] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [attempts, setAttempts] = useState(3);
  const [timeLeft, setTimeLeft] = useState(90);
  const [verifying, setVerifying] = useState(false);

  const otpRefs = useRef([]);

  // Dashboard
  const [activeTab, setActiveTab] = useState("Home");

  // --------------------------------
  // VALIDATION
  // --------------------------------

  const validateName = (value) => {
    const name = value.trim().replace(/\s+/g, " ");

    if (!name) return "Full name is required.";

    if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name)) {
      return "Only alphabets and spaces are allowed.";
    }

    if (name.length < 3 || name.length > 50) {
      return "Name must be between 3 and 50 characters.";
    }

    return "";
  };

  const validateMobile = (value) => {
    if (!value) return "Mobile number is required.";

    if (!/^[6-9]\d{9}$/.test(value)) {
      return "Enter a valid 10-digit Indian mobile number.";
    }

    return "";
  };

  const validateEmail = (value) => {
    if (!value) return "Email address is required.";

    const regex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

    return regex.test(value)
      ? ""
      : "Please enter a valid email address.";
  };

  const passwordRules = {
    length: form.password.length >= 8 && form.password.length <= 20,
    upper: /[A-Z]/.test(form.password),
    lower: /[a-z]/.test(form.password),
    number: /\d/.test(form.password),
    special: /[^A-Za-z0-9]/.test(form.password)
  };

  const passedRules = Object.values(passwordRules).filter(Boolean).length;

  const strength = !form.password
    ? "Not entered"
    : passedRules <= 2
    ? "Weak"
    : passedRules === 3
    ? "Medium"
    : passedRules === 4
    ? "Strong"
    : "Very Strong";

  const validatePassword = (value) => {
    if (!value) return "Password is required.";
    if (value.length < 8 || value.length > 20)
      return "Password must contain 8 to 20 characters.";
    if (!/[A-Z]/.test(value))
      return "At least one uppercase letter is required.";
    if (!/[a-z]/.test(value))
      return "At least one lowercase letter is required.";
    if (!/\d/.test(value))
      return "At least one number is required.";
    if (!/[^A-Za-z0-9]/.test(value))
      return "At least one special character is required.";

    return "";
  };

  const validateConfirm = (value, password = form.password) => {
    if (!value) return "Please confirm your password.";
    if (value !== password) return "Passwords do not match.";
    return "";
  };

  const validateField = (field, value, data = form) => {
    switch (field) {
      case "fullName":
        return validateName(value);
      case "mobile":
        return validateMobile(value);
      case "email":
        return validateEmail(value);
      case "password":
        return validatePassword(value);
      case "confirmPassword":
        return validateConfirm(value, data.password);
      case "terms":
        return value ? "" : "Please accept Terms & Conditions.";
      default:
        return "";
    }
  };

  // --------------------------------
  // FORM INPUT HANDLING
  // --------------------------------

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    let newValue = type === "checkbox" ? checked : value;

    if (name === "mobile") {
      newValue = value.replace(/\D/g, "").slice(0, 10);
    }

    if (name === "email") {
      newValue = value.trimStart().toLowerCase();
    }

    if (name === "fullName") {
      newValue = value.slice(0, 50);
    }

    if (name === "password" || name === "confirmPassword") {
      newValue = value.slice(0, 20);
    }

    const updated = { ...form, [name]: newValue };
    setForm(updated);

    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, newValue, updated),
        ...(name === "password" && touched.confirmPassword
          ? {
              confirmPassword: validateConfirm(
                updated.confirmPassword,
                newValue
              )
            }
          : {})
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    const updated = { ...form };

    if (name === "fullName") {
      updated.fullName = form.fullName.trim().replace(/\s+/g, " ");
    }

    if (name === "email") {
      updated.email = form.email.trim().toLowerCase();
    }

    setForm(updated);
    setTouched((prev) => ({ ...prev, [name]: true }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, updated[name], updated)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    Object.keys(form).forEach((field) => {
      const error = validateField(field, form[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);

    setTouched({
      fullName: true,
      mobile: true,
      email: true,
      password: true,
      confirmPassword: true,
      terms: true
    });

    return newErrors;
  };

  const isFormValid =
    !validateName(form.fullName) &&
    !validateMobile(form.mobile) &&
    !validateEmail(form.email) &&
    !validatePassword(form.password) &&
    !validateConfirm(form.confirmPassword) &&
    form.terms;

  const fieldClass = (field) => {
    if (!touched[field]) return "";
    if (errors[field]) return "input-error";
    if (form[field]) return "input-success";
    return "";
  };

  // --------------------------------
  // LOCAL STORAGE
  // --------------------------------

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const data = JSON.parse(saved);

        const valid =
          data &&
          ["fullName", "mobile", "email", "terms"].every(
            key => Object.hasOwn(data, key)
          );

        if (valid) {
          setResumeAvailable(true);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }

    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;

    const { fullName, mobile, email, terms } = form;

    const data = { fullName, mobile, email, terms };

    if (fullName || mobile || email || terms) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [
    storageReady,
    form.fullName,
    form.mobile,
    form.email,
    form.terms
  ]);

  const restoreProgress = () => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!data) return;

      setForm({ ...initialForm, ...data });
      setResumeAvailable(false);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // --------------------------------
  // REGISTRATION SUBMISSION
  // --------------------------------

  const handleSubmit = (e) => {
    e.preventDefault();

    if (loading) return;

    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      document.getElementById(Object.keys(newErrors)[0])?.focus();
      return;
    }

    setModal("summary");
  };

  const confirmRegistration = () => {
    if (loading) return;

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setModal("");

      localStorage.removeItem(STORAGE_KEY);

      setOtp(["", "", "", "", "", ""]);
      setOtpCode("123456");
      setAttempts(3);
      setTimeLeft(90);
      setOtpError("");
      setOtpMessage("");
      setVerifying(false);

      setPage("otp");
    }, 900);
  };

  // --------------------------------
  // OTP TIMER
  // --------------------------------

  useEffect(() => {
    if (page !== "otp" || timeLeft <= 0) return;

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [page, timeLeft]);

  const otpExpired = timeLeft === 0;

  const formattedTime =
    `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:` +
    `${String(timeLeft % 60).padStart(2, "0")}`;

  // --------------------------------
  // OTP INPUT HANDLING
  // --------------------------------

  const handleOtpChange = (index, value) => {
    if (verifying || otpExpired || attempts <= 0) return;

    const digits = value.replace(/\D/g, "");
    const updated = [...otp];

    if (digits.length > 1) {
      const available = digits.slice(0, 6 - index).split("");

      available.forEach((digit, i) => {
        updated[index + i] = digit;
      });

      setOtp(updated);
      setOtpError("");
      setOtpMessage("");

      otpRefs.current[Math.min(index + available.length, 5)]?.focus();
      return;
    }

    updated[index] = digits;

    setOtp(updated);
    setOtpError("");
    setOtpMessage("");

    if (digits && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();

    if (verifying || otpExpired || attempts <= 0) return;

    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!digits) {
      setOtpError("Only numbers are allowed.");
      return;
    }

    const updated = ["", "", "", "", "", ""];

    digits.split("").forEach((digit, index) => {
      updated[index] = digit;
    });

    setOtp(updated);
    setOtpError("");
    setOtpMessage("");

    otpRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  // --------------------------------
  // VERIFY OTP
  // --------------------------------

  const verifyOtp = () => {
    if (verifying) return;

    if (timeLeft <= 0) {
      setOtpError("OTP expired. Please request a new OTP.");
      return;
    }

    if (attempts <= 0) {
      setOtpError("Too many incorrect attempts. Please request a new OTP.");
      return;
    }

    const entered = otp.join("");

    if (entered.length !== 6) {
      setOtpError("Please enter all 6 digits.");
      return;
    }

    setVerifying(true);
    setOtpError("");
    setOtpMessage("");

    setTimeout(() => {
      if (entered === otpCode) {
        setOtpMessage("OTP verified successfully!");
        setPage("success");
      } else {
        const remaining = attempts - 1;

        setAttempts(remaining);
        setOtp(["", "", "", "", "", ""]);

        setOtpError(
          remaining > 0
            ? `Invalid OTP. Attempts remaining: ${remaining}`
            : "Too many incorrect attempts. Please request a new OTP."
        );

        otpRefs.current[0]?.focus();
      }

      setVerifying(false);
    }, 900);
  };

  // --------------------------------
  // RESEND OTP
  // --------------------------------

  const resendOtp = () => {
    if ((!otpExpired && attempts > 0) || verifying) return;

    const newOtp = String(
      Math.floor(100000 + Math.random() * 900000)
    );

    setOtpCode(newOtp);
    setOtp(["", "", "", "", "", ""]);
    setAttempts(3);
    setTimeLeft(90);
    setOtpError("");
    setOtpMessage("New OTP has been sent successfully.");

    setTimeout(() => otpRefs.current[0]?.focus(), 50);
  };

  // --------------------------------
  // RESET
  // --------------------------------

  const resetForm = () => {
    setForm(initialForm);
    setErrors({});
    setTouched({});
    setShowPassword(false);
    setShowConfirm(false);
    setModal("");
    setResumeAvailable(false);
    setPage("register");
    setLoading(false);

    localStorage.removeItem(STORAGE_KEY);
  };

  const maskedMobile = "******" + form.mobile.slice(-4);

  // ==========================================
  // REGISTRATION PAGE
  // ==========================================

  if (page === "register") {
    return (
      <div className="app-container">

        <aside className="welcome-panel">
          <div className="brand">
            <div className="brand-logo">S</div>
            <span>ShowPass</span>
          </div>

          <div className="welcome-content">
            <span className="eyebrow">WELCOME TO SHOWPASS</span>
            <h1>Create Your<br />Customer Account</h1>

            <p>
              Join ShowPass and get access to amazing
              events, exclusive offers and more.
            </p>

            <div className="welcome-graphic">
              <div className="graphic-circle"></div>
              <div className="graphic-card">✦</div>
              <span>YOUR NEXT EXPERIENCE STARTS HERE</span>
            </div>
          </div>

          <footer>© 2026 ShowPass. All rights reserved.</footer>
        </aside>

        <main className="main-panel">
          <div className="form-container">

            <div className="mobile-brand">
              <div className="brand-logo">S</div>
              <span>ShowPass</span>
            </div>

            <div className="form-heading">
              <span className="eyebrow">GET STARTED</span>
              <h2>Create Account</h2>
              <p>Fill in your details to create your account.</p>
            </div>

            {resumeAvailable && (
              <div className="restore-box">
                <p>Your previous registration data was found.</p>

                <button type="button" onClick={restoreProgress}>
                  Continue
                </button>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem(STORAGE_KEY);
                    setResumeAvailable(false);
                  }}
                >
                  Start Again
                </button>
              </div>
            )}

            {Object.values(errors).some(Boolean) && (
              <div className="error-summary" role="alert">
                <strong>Please correct the following errors:</strong>
                <ul>
                  {Object.entries(errors).map(([field, error]) =>
                    error ? (
                      <li key={field}>
                        <button
                          type="button"
                          onClick={() => document.getElementById(field)?.focus()}
                        >
                          {error}
                        </button>
                      </li>
                    ) : null
                  )}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-grid">

                {/* FULL NAME */}

                <div className="form-group full-width">
                  <label htmlFor="fullName">Full Name <span>*</span></label>

                  <div className={`input-wrapper ${fieldClass("fullName")}`}>
                    <span className="input-icon">♙</span>

                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      maxLength="50"
                      autoComplete="name"
                      value={form.fullName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-invalid={!!errors.fullName}
                    />

                    {touched.fullName && (
                      <span className="status-icon">
                        {errors.fullName ? "✕" : "✓"}
                      </span>
                    )}
                  </div>

                  {touched.fullName && errors.fullName && (
                    <small className="error-message">{errors.fullName}</small>
                  )}
                </div>

                {/* MOBILE */}

                <div className="form-group">
                  <label htmlFor="mobile">Mobile Number <span>*</span></label>

                  <div className={`input-wrapper ${fieldClass("mobile")}`}>
                    <span className="input-icon">☎</span>

                    <input
                      id="mobile"
                      name="mobile"
                      type="tel"
                      inputMode="numeric"
                      maxLength="10"
                      placeholder="10 digit mobile number"
                      autoComplete="tel"
                      value={form.mobile}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-invalid={!!errors.mobile}
                    />

                    {touched.mobile && (
                      <span className="status-icon">
                        {errors.mobile ? "✕" : "✓"}
                      </span>
                    )}
                  </div>

                  <div className="field-meta">
                    {touched.mobile && errors.mobile && (
                      <small className="error-message">{errors.mobile}</small>
                    )}
                    <small className="counter">{form.mobile.length}/10</small>
                  </div>
                </div>

                {/* EMAIL */}

                <div className="form-group">
                  <label htmlFor="email">Email Address <span>*</span></label>

                  <div className={`input-wrapper ${fieldClass("email")}`}>
                    <span className="input-icon">✉</span>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      autoComplete="email"
                      value={form.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-invalid={!!errors.email}
                    />

                    {touched.email && (
                      <span className="status-icon">
                        {errors.email ? "✕" : "✓"}
                      </span>
                    )}
                  </div>

                  {touched.email && errors.email && (
                    <small className="error-message">{errors.email}</small>
                  )}
                </div>

                {/* PASSWORD */}

                <div className="form-group">
                  <label htmlFor="password">Password <span>*</span></label>

                  <div className={`input-wrapper ${fieldClass("password")}`}>
                    <span className="input-icon">♙</span>

                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      maxLength="20"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-invalid={!!errors.password}
                    />

                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? "◎" : "◉"}
                    </button>
                  </div>

                  {touched.password && errors.password && (
                    <small className="error-message">{errors.password}</small>
                  )}

                  <div className="strength-section">
                    <div className={`strength-bars ${strength.toLowerCase().replace(" ", "-")}`}>
                      {[1, 2, 3, 4].map(n => (
                        <span
                          key={n}
                          className={n <= passedRules && form.password ? "active" : ""}
                        />
                      ))}
                    </div>

                    <div className="strength-label">
                      Password strength: <strong>{strength}</strong>
                    </div>
                  </div>

                  <ul className="password-rules">
                    {[
                      ["length", "Minimum 8 characters"],
                      ["upper", "Uppercase letter"],
                      ["lower", "Lowercase letter"],
                      ["number", "Number"],
                      ["special", "Special character"]
                    ].map(([key, label]) => (
                      <li key={key} className={passwordRules[key] ? "passed" : ""}>
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CONFIRM PASSWORD */}

                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    Confirm Password <span>*</span>
                  </label>

                  <div className={`input-wrapper ${fieldClass("confirmPassword")}`}>
                    <span className="input-icon">♙</span>

                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm your password"
                      maxLength="20"
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-invalid={!!errors.confirmPassword}
                    />

                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowConfirm(!showConfirm)}
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirm ? "◎" : "◉"}
                    </button>
                  </div>

                  {touched.confirmPassword && errors.confirmPassword && (
                    <small className="error-message">
                      {errors.confirmPassword}
                    </small>
                  )}

                  {touched.confirmPassword &&
                    !errors.confirmPassword &&
                    form.confirmPassword && (
                      <small className="success-message">
                        ✓ Passwords match.
                      </small>
                    )}
                </div>
              </div>

              {/* TERMS */}

              <div className="terms-row">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={form.terms}
                  onChange={handleChange}
                  aria-invalid={!!errors.terms}
                />

                <label htmlFor="terms">
                  I agree to the{" "}
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => setModal("terms")}
                  >
                    Terms & Conditions
                  </button>
                </label>
              </div>

              {touched.terms && errors.terms && (
                <small className="error-message">{errors.terms}</small>
              )}

              {/* BUTTONS */}

              <div className="button-row">
                <button
                  type="submit"
                  className="register-btn"
                  disabled={!isFormValid || loading}
                >
                  Register
                </button>

                <button
                  type="button"
                  className="reset-btn"
                  onClick={() => setModal("reset")}
                >
                  Reset
                </button>
              </div>

              <p className="login-text">
                Already have an account? <a href="#login">Login</a>
              </p>
            </form>
          </div>
        </main>

        {/* REGISTRATION SUMMARY */}

        {modal === "summary" && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-icon">✓</div>

              <h2>Registration Summary</h2>
              <p>Please review your details before continuing.</p>

              <div className="summary-details">
                <div><span>Name</span><strong>{form.fullName}</strong></div>
                <div><span>Mobile</span><strong>{form.mobile}</strong></div>
                <div><span>Email</span><strong>{form.email}</strong></div>
              </div>

              <div className="modal-actions">
                <button className="reset-btn" onClick={() => setModal("")}>
                  Edit
                </button>

                <button
                  className="primary-btn"
                  disabled={loading}
                  onClick={confirmRegistration}
                >
                  {loading ? "Processing..." : "Confirm Registration"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TERMS */}

        {modal === "terms" && (
          <div className="modal-overlay">
            <div className="modal-card">
              <button className="modal-close" onClick={() => setModal("")}>
                ×
              </button>

              <h2>Terms & Conditions</h2>

              <p>
                Please provide accurate registration information
                and keep your account credentials secure.
                This is a frontend demonstration project.
              </p>

              <button className="primary-btn" onClick={() => setModal("")}>
                Close
              </button>
            </div>
          </div>
        )}

        {/* RESET */}

        {modal === "reset" && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="warning-icon">!</div>
              <h2>Reset Form?</h2>
              <p>Are you sure you want to clear all entered information?</p>

              <div className="modal-actions">
                <button className="reset-btn" onClick={() => setModal("")}>
                  Cancel
                </button>

                <button className="primary-btn" onClick={resetForm}>
                  Yes, Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // OTP VERIFICATION PAGE
  // ==========================================

  if (page === "otp") {
    return (
      <div className="verification-page">
        <div className="verification-card">

          <div className="otp-icon">✉</div>

          <span className="eyebrow">SHOWPASS SECURITY</span>
          <h2>Verify Your Account</h2>

          <p className="verification-description">
            OTP sent to <strong>{maskedMobile}</strong>
          </p>

          <div className="otp-boxes">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={element => otpRefs.current[index] = element}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                disabled={verifying || otpExpired || attempts <= 0}
                aria-label={`OTP digit ${index + 1}`}
                onChange={e => handleOtpChange(index, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(e, index)}
                onPaste={index === 0 ? handleOtpPaste : undefined}
              />
            ))}
          </div>

          {otpError && (
            <div className="otp-alert error-alert" role="alert">
              <span>✕</span>
              {otpError}
            </div>
          )}

          {otpMessage && (
            <div className="otp-alert success-alert" role="status">
              <span>✓</span>
              {otpMessage}
            </div>
          )}

          <div className="timer-text">
            <span>◷</span>
            {otpExpired
              ? "OTP has expired"
              : `OTP expires in: ${formattedTime}`}
          </div>

          <button
            className="primary-btn verify-btn"
            onClick={verifyOtp}
            disabled={
              otp.join("").length !== 6 ||
              verifying ||
              otpExpired ||
              attempts <= 0
            }
          >
            {verifying ? (
              <>
                <span className="spinner"></span>
                Verifying...
              </>
            ) : "Verify OTP"}
          </button>

          <p className="resend-heading">Didn't receive OTP?</p>

          <button
            className="resend-btn"
            onClick={resendOtp}
            disabled={(!otpExpired && attempts > 0) || verifying}
          >
            Resend OTP
          </button>

          <div className="demo-code">
            Demo OTP: <strong>{otpCode}</strong>
          </div>

          <p className="back-note">
            Frontend OTP simulation. No actual SMS is sent.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // SUCCESS PAGE
  // ==========================================

  if (page === "success") {
    return (
      <div className="verification-page">
        <div className="verification-card success-card">

          <div className="success-check">✓</div>

          <h1>Verification Successful</h1>

          <p>
            Your account has been successfully verified.
          </p>

          <button
            className="primary-btn verify-btn"
            onClick={() => {
              setActiveTab("Home");
              setPage("dashboard");
            }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // DASHBOARD
  // ==========================================

  if (page === "dashboard") {
    return (
      <div className="dashboard-layout">

        <aside className="dashboard-sidebar">
          <div className="brand dashboard-brand">
            <div className="brand-logo">S</div>
            <span>ShowPass</span>
          </div>

          <nav className="dashboard-nav">
            {["Home", "Profile", "Settings"].map(item => (
              <button
                key={item}
                className={activeTab === item ? "active" : ""}
                onClick={() => setActiveTab(item)}
              >
                <span>
                  {item === "Home" ? "⌂" : item === "Profile" ? "♙" : "⚙"}
                </span>
                {item}
              </button>
            ))}

            <button className="logout-btn" onClick={resetForm}>
              <span>⇥</span>
              Logout
            </button>
          </nav>
        </aside>

        <main className="dashboard-main">

          <div className="dashboard-topbar">
            <div>
              <span className="eyebrow">SHOWPASS CUSTOMER PORTAL</span>
              <h2>{activeTab}</h2>
            </div>

            <div className="profile-avatar">
              {form.fullName.charAt(0).toUpperCase()}
            </div>
          </div>

          {activeTab === "Home" && (
            <>
              <h1>Welcome, {form.fullName}!</h1>

              <p className="dashboard-subtitle">
                Your account is verified. You can now access all features.
              </p>

              <div className="dashboard-success">
                <div className="success-check">✓</div>
                <div>
                  <strong>Account Verified</strong>
                  <p>You can now access all features.</p>
                </div>
              </div>

              <div className="dashboard-stats">
                <div className="stat-card">
                  <span>Account Status</span>
                  <h3>Verified</h3>
                </div>

                <div className="stat-card">
                  <span>Customer Name</span>
                  <h3>{form.fullName}</h3>
                </div>
              </div>
            </>
          )}

          {activeTab === "Profile" && (
            <div className="dashboard-panel">
              <h2>Customer Profile</h2>

              <div className="profile-row">
                <span>Full Name</span>
                <strong>{form.fullName}</strong>
              </div>

              <div className="profile-row">
                <span>Mobile Number</span>
                <strong>{form.mobile}</strong>
              </div>

              <div className="profile-row">
                <span>Email Address</span>
                <strong>{form.email}</strong>
              </div>

              <div className="profile-row">
                <span>Verification Status</span>
                <strong className="verified-text">✓ Verified</strong>
              </div>
            </div>
          )}

          {activeTab === "Settings" && (
            <div className="dashboard-panel">
              <h2>Account Settings</h2>
              <p>Your account is active and successfully verified.</p>

              <button className="reset-btn" onClick={resetForm}>
                Logout from ShowPass
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  return null;
}

export default App;
