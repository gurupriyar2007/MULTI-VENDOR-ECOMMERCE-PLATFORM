// Login handler
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';

  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: e.target.email.value.trim(),
        password: e.target.password.value
      })
    });

    saveSession(data);
    showToast(`Welcome back, ${data.user.name}!`, 'success', 'Login Successful');

    setTimeout(() => {
      if (data.user.role === 'admin') location.href = 'admin-dashboard.html';
      else if (data.user.role === 'vendor') location.href = 'vendor-dashboard.html';
      else location.href = 'customer-dashboard.html';
    }, 600);
  } catch (err) {
    showToast(err.message, 'error', 'Authentication Failed');
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// Register handler
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating Account...';

  try {
    const role = e.target.role.value;
    await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: e.target.name.value.trim(),
        email: e.target.email.value.trim(),
        password: e.target.password.value,
        role: role
      })
    });

    showToast('Account registered successfully! Please log in.', 'success', 'Success');
    setTimeout(() => {
      location.href = 'login.html';
    }, 1200);
  } catch (err) {
    showToast(err.message, 'error', 'Registration Error');
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// Quick fill demo credentials
function fillDemo(role) {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  if (!emailInput || !passwordInput) return;

  if (role === 'customer') {
    emailInput.value = 'customer@softmulti.local';
    passwordInput.value = 'Customer@123';
  } else if (role === 'vendor') {
    emailInput.value = 'vendor@softmulti.local';
    passwordInput.value = 'Vendor@123';
  } else if (role === 'admin') {
    emailInput.value = 'admin@softmulti.local';
    passwordInput.value = 'Admin@123';
  }
  showToast(`Loaded ${role.toUpperCase()} demo credentials`, 'info');
}
