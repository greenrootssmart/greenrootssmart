
const SUPABASE_URL = 'https://qrwhsygcblgbibogiecm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_lBwSxrqJbAV4owK0nQfvXg_Bo2L0OKB';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
emailjs.init('z44cg_jvnLbDjtQzi');

let userType = 'supplier';

// ── ATTACH ALL EVENT LISTENERS ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {

  // Tab switching
  var tabLogin = document.getElementById('tabLogin');
  var tabRegister = document.getElementById('tabRegister');
  if(tabLogin) tabLogin.addEventListener('click', function(){ switchTab('login', this); });
  if(tabRegister) tabRegister.addEventListener('click', function(){ switchTab('register', this); });

  // User type (supplier/buyer)
  var typeSupplier = document.getElementById('type-supplier');
  var typeBuyer = document.getElementById('type-buyer');
  if(typeSupplier) typeSupplier.addEventListener('click', function(){ setUserType('supplier'); });
  if(typeBuyer) typeBuyer.addEventListener('click', function(){ setUserType('buyer'); });

  // Login button
  var loginBtn = document.getElementById('loginBtn');
  if(loginBtn) loginBtn.addEventListener('click', doLogin);

  // Toggle password
  var togglePass = document.getElementById('toggleLoginPass');
  if(togglePass) togglePass.addEventListener('click', function(){ togglePassword('login-password', this); });

  // Switch links
  var goToRegister = document.getElementById('goToRegister');
  var goToLogin = document.getElementById('goToLogin');
  if(goToRegister) goToRegister.addEventListener('click', function(e){ e.preventDefault(); switchTab('register', document.getElementById('tabRegister')); });
  if(goToLogin) goToLogin.addEventListener('click', function(e){ e.preventDefault(); switchTab('login', document.getElementById('tabLogin')); });

  // Forgot password
  var forgotLink = document.getElementById('forgotLink');
  if(forgotLink) forgotLink.addEventListener('click', function(e){ e.preventDefault(); showForgotForm(); });

  // Forgot btn
  var forgotBtn = document.getElementById('forgotBtn');
  if(forgotBtn) forgotBtn.addEventListener('click', sendResetEmail);

  // Enter key on password
  var loginPass = document.getElementById('login-password');
  if(loginPass) loginPass.addEventListener('keydown', function(e){ if(e.key==='Enter') doLogin(); });

  var forgotEmail = document.getElementById('forgot-email');
  if(forgotEmail) forgotEmail.addEventListener('keydown', function(e){ if(e.key==='Enter') sendResetEmail(); });

});

// ── FUNCTIONS ────────────────────────────────────────────────────────────────

function switchTab(tab, btn) {
  document.querySelectorAll('.tab').forEach(function(t){ t.classList.remove('active'); });
  if(btn) btn.classList.add('active');
  document.querySelectorAll('.form-section').forEach(function(s){
    s.classList.remove('active');
    s.style.display = 'none';
  });
  var el = document.getElementById(tab + 'Form');
  if(el){ el.style.display = 'block'; el.classList.add('active'); }
}

function setUserType(type) {
  userType = type;
  var sup = document.getElementById('type-supplier');
  var buy = document.getElementById('type-buyer');
  if(sup) sup.classList.toggle('active', type === 'supplier');
  if(buy) buy.classList.toggle('active', type === 'buyer');
}

function togglePassword(id, btn) {
  var input = document.getElementById(id);
  if(!input) return;
  if(input.type === 'password'){ input.type = 'text'; btn.textContent = '🙈'; }
  else{ input.type = 'password'; btn.textContent = '👁️'; }
}

function showAlert(msg, type) {
  var el = document.getElementById('alertMsg');
  if(!el) return;
  el.style.display = 'block';
  el.style.background = type === 'success' ? '#e8f5e2' : type === 'warning' ? '#fff3e0' : '#fce4ec';
  el.style.color = type === 'success' ? '#2d7a3a' : type === 'warning' ? '#e65100' : '#c62828';
  el.style.padding = '12px 16px';
  el.style.borderRadius = '10px';
  el.style.fontSize = '13px';
  el.style.marginBottom = '16px';
  el.textContent = msg;
  if(type !== 'success') setTimeout(function(){ el.style.display = 'none'; }, 6000);
}

async function doLogin() {
  var email = document.getElementById('login-email').value.trim().toLowerCase();
  var password = document.getElementById('login-password').value;
  if(!email) return showAlert('Please enter your email!', 'error');
  if(!password) return showAlert('Please enter your password!', 'error');

  var btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = 'Logging in...';

  try {
    if(userType === 'buyer') {
      var res = await supabaseClient.from('buyers').select('*').eq('email', email).eq('password', password).single();
      if(res.error || !res.data){ showAlert('Wrong email or password!', 'error'); btn.disabled=false; btn.innerHTML='🌿 Login to Dashboard'; return; }
      localStorage.setItem('grs_buyer', JSON.stringify({ id:res.data.id, name:res.data.name, email:res.data.email, mobile:res.data.mobile||'', company:res.data.company||'', city:res.data.city||'', state:res.data.state||'', type:'buyer' }));
      showAlert('Login successful! Going to Buyer Dashboard...', 'success');
      btn.innerHTML = '✅ Logged In!';
      setTimeout(function(){ window.location.href = '/buyer-dashboard'; }, 1500);

    } else {
      var res2 = await supabaseClient.from('suppliers').select('*').eq('email', email).eq('password', password).single();
      if(res2.error || !res2.data){ showAlert('Wrong email or password!', 'error'); btn.disabled=false; btn.innerHTML='🌿 Login to Dashboard'; return; }
      var d = res2.data;
      if(d.status === 'pending'){ showAlert('Account pending verification. Our team will approve within 24 hours!', 'warning'); btn.disabled=false; btn.innerHTML='🌿 Login to Dashboard'; return; }
      if(d.status === 'rejected'){ showAlert('Account not approved. Contact greenrootssmart@gmail.com', 'error'); btn.disabled=false; btn.innerHTML='🌿 Login to Dashboard'; return; }
      localStorage.setItem('grs_user', JSON.stringify({ id:d.id, name:d.owner_name, business:d.business_name, email:d.email, mobile:d.mobile||'', plan:d.plan||'free', status:d.status, city:d.city||'', state:d.state||'', category:d.category||'', type:'supplier' }));
      showAlert('Login successful! Going to Dashboard...', 'success');
      btn.innerHTML = '✅ Logged In!';
      setTimeout(function(){ window.location.href = '/dashboard'; }, 1500);
    }
  } catch(err) {
    showAlert('Something went wrong. Please try again!', 'error');
    btn.disabled = false;
    btn.innerHTML = '🌿 Login to Dashboard';
  }
}

function showForgotForm() {
  document.querySelectorAll('.form-section').forEach(function(s){ s.classList.remove('active'); s.style.display='none'; });
  var f = document.getElementById('forgotForm');
  if(f){ f.style.display='block'; f.classList.add('active'); }
  document.querySelectorAll('.tab').forEach(function(t){ t.classList.remove('active'); });
}

function hideForgotForm() {
  document.querySelectorAll('.form-section').forEach(function(s){ s.classList.remove('active'); s.style.display='none'; });
  var l = document.getElementById('loginForm');
  if(l){ l.style.display='block'; l.classList.add('active'); }
  var tabs = document.querySelectorAll('.tab');
  if(tabs[0]) tabs[0].classList.add('active');
}

function showForgotAlert(msg, type) {
  var el = document.getElementById('forgotAlert');
  if(!el) return;
  el.style.display = 'block';
  el.style.padding = '10px 14px';
  el.style.borderRadius = '8px';
  el.style.fontSize = '13px';
  el.style.marginBottom = '14px';
  el.style.background = type === 'success' ? '#e8f5e2' : '#fce4ec';
  el.style.color = type === 'success' ? '#2d7a3a' : '#c62828';
  el.textContent = msg;
}

async function sendResetEmail() {
  var email = document.getElementById('forgot-email').value.trim();
  if(!email){ showForgotAlert('Please enter your email!', 'error'); return; }

  var btn = document.getElementById('forgotBtn');
  btn.textContent = 'Sending...'; btn.disabled = true;

  try {
    var r1 = await supabaseClient.from('suppliers').select('id,owner_name,business_name').eq('email', email).single();
    var name = r1.data ? (r1.data.owner_name || r1.data.business_name || email) : email;

    if(!r1.data) {
      var r2 = await supabaseClient.from('buyers').select('id,name').eq('email', email).single();
      if(!r2.data){ showForgotAlert('Email not found! Please check or register.', 'error'); btn.textContent='Send Reset Instructions 🌿'; btn.disabled=false; return; }
      name = r2.data.name || email;
    }

    var token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    var resetLink = 'https://www.greenrootssmart.com/reset-password?token=' + token + '&email=' + encodeURIComponent(email);

    await supabaseClient.from('password_resets').insert([{ email:email, token:token, expires_at: new Date(Date.now()+3600000).toISOString() }]);

    await emailjs.send('service_clis9zo', 'template_7gj9klp', {
      product_name: 'Password Reset — GRS',
      buyer_name: name,
      buyer_mobile: '',
      buyer_email: email,
      quantity: '',
      message: 'Reset your GRS password here (valid 1 hour): ' + resetLink
    });

    showForgotAlert('Reset link sent to ' + email + '! Check inbox and spam folder.', 'success');
  } catch(e) {
    console.log('Reset error:', e);
    showForgotAlert('Something went wrong. Please try again!', 'error');
  }
  btn.textContent = 'Send Reset Instructions 🌿'; btn.disabled = false;
}
