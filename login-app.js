const SUPABASE_URL = 'https://qrwhsygcblgbibogiecm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_lBwSxrqJbAV4owK0nQfvXg_Bo2L0OKB';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let userType = 'supplier';

function setUserType(type){
  userType = type;
  document.getElementById('type-supplier').classList.toggle('active', type==='supplier');
  document.getElementById('type-buyer').classList.toggle('active', type==='buyer');
}

function switchTab(tab, btn){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.form-section').forEach(s=>s.classList.remove('active'));
  document.getElementById(tab+'Form').classList.add('active');
}

function togglePass(id, btn){
  const input = document.getElementById(id);
  if(input.type==='password'){input.type='text';btn.textContent='🙈';}
  else{input.type='password';btn.textContent='👁️';}
}

function showAlert(msg, type='error'){
  const box = document.getElementById('alertBox');
  box.textContent = msg;
  box.className = 'alert alert-' + type;
  box.style.display = 'block';
  setTimeout(()=>box.style.display='none', 6000);
}

function showForgotForm() {
  document.querySelectorAll('.form-section').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const f = document.getElementById('forgotForm');
  f.style.display = 'block';
  f.classList.add('active');
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
}

function hideForgotForm() {
  document.querySelectorAll('.form-section').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const l = document.getElementById('loginForm');
  l.style.display = 'block';
  l.classList.add('active');
  document.querySelectorAll('.tab')[0].classList.add('active');
}

async function sendResetEmail() {
  const email = document.getElementById('forgot-email').value.trim();
  if(!email) { showForgotAlert('Please enter your email!', 'error'); return; }

  const btn = document.getElementById('forgotBtn');
  btn.textContent = 'Sending...'; btn.disabled = true;

  // Check if email exists in suppliers
  try {
    const { data } = await supabaseClient.from('suppliers').select('id,owner_name,business_name').eq('email', email).single();
    
    if(!data) {
      // Check buyers
      const { data: buyer } = await supabaseClient.from('buyers').select('id,name').eq('email', email).single();
      if(!buyer) {
        showForgotAlert('❌ Email not found! Please check your email or register.', 'error');
        btn.textContent = 'Send Reset Instructions 🌿'; btn.disabled = false;
        return;
      }
    }

    // Generate reset token and save to Supabase
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const resetLink = 'https://www.greenrootssmart.com/reset-password?token=' + token + '&email=' + encodeURIComponent(email);
    
    // Save token to Supabase
    await supabaseClient.from('password_resets').insert([{
      email: email,
      token: token,
      expires_at: new Date(Date.now() + 3600000).toISOString()
    }]);

    // Send email via EmailJS
    await emailjs.send('service_clis9zo', 'template_7gj9klp', {
      product_name: '🔑 Password Reset Request',
      buyer_name: data ? (data.owner_name || data.business_name) : email,
      buyer_mobile: '',
      buyer_email: email,
      quantity: '',
      message: 'Click this link to reset your password (valid for 1 hour):

' + resetLink + '

If you did not request this, ignore this email.'
    });

    showForgotAlert('✅ Reset instructions sent to ' + email + '! Check your inbox and spam folder.', 'success');
  } catch(e) {
    console.log('Error:', e);
    showForgotAlert('⚠️ Something went wrong. Please WhatsApp us at +91 63554 08878', 'error');
  }
  btn.textContent = 'Send Reset Instructions 🌿'; btn.disabled = false;
}

function showForgotAlert(msg, type) {
  const el = document.getElementById('forgotAlert');
  el.style.display = 'block';
  el.style.background = type === 'success' ? '#e8f5e2' : '#fce4ec';
  el.style.color = type === 'success' ? '#2d7a3a' : '#c62828';
  el.textContent = msg;
}

async function doLogin(){
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  if(!email) return showAlert('⚠️ Please enter your email!');
  if(!password) return showAlert('⚠️ Please enter your password!');

  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading"></span>Logging in...';

  try {
    if(userType === 'buyer') {
      // ✅ BUYER LOGIN — check email + password
      const { data, error } = await supabaseClient
        .from('buyers')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if(error || !data){
        showAlert('❌ Wrong email or password! Please try again or register.');
        btn.disabled = false;
        btn.innerHTML = '🌿 Login to Dashboard';
        return;
      }

      // ✅ Save ALL buyer data including buying_category
      localStorage.setItem('grs_buyer', JSON.stringify({
        id: data.id,
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        company: data.company || '',
        city: data.city || '',
        state: data.state || '',
        buying_category: data.buying_category || '',
        type: 'buyer'
      }));

      showAlert('✅ Login successful! Going to Buyer Dashboard...', 'success');
      btn.innerHTML = '✅ Logged In!';
      setTimeout(()=>{ window.location.href = '/buyer-dashboard'; }, 1500);

    } else {
      // ✅ SUPPLIER LOGIN — check email + password + status
      const { data, error } = await supabaseClient
        .from('suppliers')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if(error || !data){
        showAlert('❌ Wrong email or password! Please try again or register.');
        btn.disabled = false;
        btn.innerHTML = '🌿 Login to Dashboard';
        return;
      }

      // ✅ SECURITY: Check supplier approval status
      if(data.status === 'pending'){
        showAlert('⏳ Your account is pending verification. Our team will approve within 24 hours. Check your email!', 'warning');
        btn.disabled = false;
        btn.innerHTML = '🌿 Login to Dashboard';
        return;
      }

      if(data.status === 'rejected'){
        showAlert('❌ Your account was not approved. Contact support@greenrootssmart.com for help.', 'error');
        btn.disabled = false;
        btn.innerHTML = '🌿 Login to Dashboard';
        return;
      }

      if(data.status === 'suspended'){
        showAlert('🚫 Your account has been suspended. Contact support@greenrootssmart.com', 'error');
        btn.disabled = false;
        btn.innerHTML = '🌿 Login to Dashboard';
        return;
      }

      // ✅ Save ALL supplier data to localStorage
      localStorage.setItem('grs_user', JSON.stringify({
        id: data.id,
        name: data.owner_name,
        business: data.business_name,
        email: data.email,
        mobile: data.mobile || '',
        plan: data.plan || 'free',
        status: data.status,
        city: data.city || '',
        state: data.state || '',
        category: data.category || '',
        type: 'supplier'
      }));

      showAlert('✅ Login successful! Going to Supplier Dashboard...', 'success');
      btn.innerHTML = '✅ Logged In!';
       = '/dashboard'; }, 1500);
    }
  } catch(err) {
    showAlert('❌ Something went wrong. Please try again!');
    btn.disabled = false;
    btn.innerHTML = '🌿 Login to Dashboard';
  }
}

function showAlert(msg, type) {
  const el = document.getElementById('alertMsg');
  if(!el) return;
  el.style.display = 'block';
  el.style.background = type === 'success' ? '#e8f5e2' : type === 'warning' ? '#fff3e0' : '#fce4ec';
  el.style.color = type === 'success' ? '#2d7a3a' : type === 'warning' ? '#e65100' : '#c62828';
  el.textContent = msg;
  if(type !== 'success') setTimeout(() => el.style.display = 'none', 5000);
}

function togglePass(id, btn) {
  const input = document.getElementById(id);
  if(input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
  else { input.type = 'password'; btn.textContent = '👁️'; }
}

function setUserType(type) {
  userType = type;
  document.getElementById('type-supplier').classList.toggle('active', type === 'supplier');
  document.getElementById('type-buyer').classList.toggle('active', type === 'buyer');
}

function switchTab(tab, btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.form-section').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const el = document.getElementById(tab + 'Form');
  if(el) { el.style.display = 'block'; el.classList.add('active'); }
}

function showForgotForm() {
  document.querySelectorAll('.form-section').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const f = document.getElementById('forgotForm');
  if(f) { f.style.display = 'block'; f.classList.add('active'); }
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
}

function hideForgotForm() {
  document.querySelectorAll('.form-section').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const l = document.getElementById('loginForm');
  if(l) { l.style.display = 'block'; l.classList.add('active'); }
  document.querySelectorAll('.tab')[0].classList.add('active');
}

async function sendResetEmail() {
  const email = document.getElementById('forgot-email').value.trim();
  if(!email) { showForgotAlert('Please enter your email!', 'error'); return; }

  const btn = document.getElementById('forgotBtn');
  btn.textContent = 'Sending...'; btn.disabled = true;

  try {
    const { data } = await supabaseClient.from('suppliers').select('id,owner_name,business_name').eq('email', email).single();
    let name = data ? (data.owner_name || data.business_name || email) : email;

    if(!data) {
      const { data: buyer } = await supabaseClient.from('buyers').select('id,name').eq('email', email).single();
      if(!buyer) {
        showForgotAlert('Email not found! Please check or register.', 'error');
        btn.textContent = 'Send Reset Instructions 🌿'; btn.disabled = false;
        return;
      }
      name = buyer.name || email;
    }

    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const resetLink = 'https://www.greenrootssmart.com/reset-password?token=' + token + '&email=' + encodeURIComponent(email);

    await supabaseClient.from('password_resets').insert([{
      email: email, token: token,
      expires_at: new Date(Date.now() + 3600000).toISOString()
    }]);

    await emailjs.send('service_clis9zo', 'template_7gj9klp', {
      product_name: 'Password Reset — Green Roots Smart',
      buyer_name: name,
      buyer_mobile: '',
      buyer_email: email,
      quantity: '',
      message: 'Click this link to reset your GRS password (valid 1 hour):\n\n' + resetLink
    });

    showForgotAlert('Reset link sent to ' + email + '! Check inbox and spam folder.', 'success');
  } catch(e) {
    console.log('Reset error:', e);
    showForgotAlert('Something went wrong. Please try again!', 'error');
  }
  btn.textContent = 'Send Reset Instructions 🌿'; btn.disabled = false;
}

function showForgotAlert(msg, type) {
  const el = document.getElementById('forgotAlert');
  if(!el) return;
  el.className = '';
  el.style.display = 'block';
  el.style.padding = '10px 14px';
  el.style.borderRadius = '8px';
  el.style.fontSize = '13px';
  el.style.marginBottom = '14px';
  el.style.background = type === 'success' ? '#e8f5e2' : '#fce4ec';
  el.style.color = type === 'success' ? '#2d7a3a' : '#c62828';
  el.textContent = msg;
}

// Attach event listeners - CF safe
document.addEventListener('DOMContentLoaded', function() {
  var fl = document.getElementById('forgotLink');
  if(fl) fl.addEventListener('click', function(e){ e.preventDefault(); showForgotForm(); });
});

emailjs.init('z44cg_jvnLbDjtQzi');