
const SUPABASE_URL = 'https://qrwhsygcblgbibogiecm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_lBwSxrqJbAV4owK0nQfvXg_Bo2L0OKB';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
emailjs.init('z44cg_jvnLbDjtQzi');

let userType = 'supplier';

// ── ATTACH ALL EVENT LISTENERS ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  // ── GOOGLE OAUTH REDIRECT HANDLER ──────────────────────────────
  handleGoogleRedirect();
});

async function handleGoogleRedirect() {
  try {
    const sb = window.supabase.createClient(
      'https://qrwhsygcblgbibogiecm.supabase.co',
      'sb_publishable_lBwSxrqJbAV4owK0nQfvXg_Bo2L0OKB'
    );

    // Check if this is a Google OAuth redirect
    const { data: { session }, error } = await sb.auth.getSession();

    if (session && session.user) {
      const email = session.user.email;
      const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0];

      // Check if supplier exists
      const { data: supplier } = await sb.from('suppliers')
        .select('*').eq('email', email).limit(1);

      if (supplier && supplier.length > 0) {
        const d = supplier[0];
        localStorage.setItem('grs_user', JSON.stringify({
          id: d.id, name: d.owner_name || name,
          business: d.business_name, email: d.email,
          mobile: d.mobile || '', plan: d.plan || 'free',
          status: d.status, city: d.city || '',
          state: d.state || '', category: d.category || '',
          type: 'supplier'
        }));
        window.location.href = '/dashboard';
        return;
      }

      // Check if buyer exists
      const { data: buyer } = await sb.from('buyers')
        .select('*').eq('email', email).limit(1);

      if (buyer && buyer.length > 0) {
        const b = buyer[0];
        localStorage.setItem('grs_buyer', JSON.stringify({
          id: b.id, name: b.name || name, email: b.email,
          mobile: b.mobile || '', company: b.company || '',
          city: b.city || '', state: b.state || '', type: 'buyer'
        }));
        window.location.href = '/buyer-dashboard';
        return;
      }

      // New Google user — save to buyers table and redirect
      const { data: newBuyer } = await sb.from('buyers').insert([{
        name: name, email: email,
        status: 'active', created_at: new Date().toISOString()
      }]).select();

      if (newBuyer && newBuyer.length > 0) {
        localStorage.setItem('grs_buyer', JSON.stringify({
          id: newBuyer[0].id, name: name, email: email, type: 'buyer'
        }));
      }
      window.location.href = '/buyer-dashboard';
      return;
    }
  } catch(e) {
    console.log('Google session check:', e);
  }
}

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
      var res = await supabaseClient.from('buyers').select('*').eq('email', email).eq('password', password).limit(1);
      if(res.error || !res.data || res.data.length === 0){ showAlert('Wrong email or password!', 'error'); btn.disabled=false; btn.innerHTML='🌿 Login to Dashboard'; return; }
      res.data = res.data[0];
      localStorage.setItem('grs_buyer', JSON.stringify({ id:res.data.id, name:res.data.name, email:res.data.email, mobile:res.data.mobile||'', company:res.data.company||'', city:res.data.city||'', state:res.data.state||'', type:'buyer' }));
      showAlert('Login successful! Going to Buyer Dashboard...', 'success');
      btn.innerHTML = '✅ Logged In!';
      setTimeout(function(){ window.location.href = '/buyer-dashboard'; }, 1500);

    } else {
      var res2 = await supabaseClient.from('suppliers').select('*').eq('email', email).eq('password', password).limit(1);
      if(res2.error || !res2.data || res2.data.length === 0){ showAlert('Wrong email or password!', 'error'); btn.disabled=false; btn.innerHTML='🌿 Login to Dashboard'; return; }
      var d = res2.data[0];
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

// Step 1: Verify email exists and show mobile hint
async function sendResetEmail() {
  var email = document.getElementById('forgot-email').value.trim().toLowerCase();
  if(!email){ showForgotAlert('Please enter your email!', 'error'); return; }

  var btn = document.getElementById('forgotBtn');
  btn.textContent = 'Verifying...'; btn.disabled = true;

  try {
    // Check suppliers table
    var r1 = await supabaseClient.from('suppliers').select('id,owner_name,business_name,mobile').eq('email', email).single();
    var userData = r1.data;
    var userTable = 'suppliers';

    if(!userData) {
      // Check buyers table
      var r2 = await supabaseClient.from('buyers').select('id,name,mobile').eq('email', email).single();
      if(!r2.data){ showForgotAlert('Email not found! Please check or register.', 'error'); btn.textContent='Verify Email'; btn.disabled=false; return; }
      userData = r2.data;
      userTable = 'buyers';
    }

    // Store email and table for next step
    window._resetEmail = email;
    window._resetTable = userTable;
    window._resetUserId = userData.id;

    // Show mobile hint (last 4 digits only for security)
    var mobile = userData.mobile || '';
    var hint = mobile.length >= 4 ? 'XXXXXX' + mobile.slice(-4) : 'your registered number';

    // Show mobile verification step
    showMobileVerifyStep(hint);

  } catch(e) {
    console.log('Error:', e);
    showForgotAlert('Something went wrong. Please try again!', 'error');
  }
  btn.textContent = 'Verify Email'; btn.disabled = false;
}

// Step 2: Show mobile verification form
function showMobileVerifyStep(hint) {
  var forgotForm = document.getElementById('forgotForm');
  if(!forgotForm) return;
  
  forgotForm.innerHTML = `
    <div style="text-align:center;margin-bottom:20px;">
      <div style="font-size:40px;margin-bottom:8px;">📱</div>
      <h3 style="font-family:'Playfair Display',serif;font-size:20px;color:#1a4a24;margin-bottom:6px;">Verify Your Identity</h3>
      <p style="font-size:13px;color:#7a9a74;line-height:1.6;">Enter your registered mobile number to confirm it's you!</p>
      <p style="font-size:13px;font-weight:600;color:#2d7a3a;margin-top:8px;">Hint: ${hint}</p>
    </div>
    <div id="forgotAlert" style="display:none;padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:14px;"></div>
    <div class="form-group">
      <label>Your Registered Mobile Number *</label>
      <div class="input-wrap">
        <span class="input-icon">📱</span>
        <input type="tel" id="verify-mobile" placeholder="Enter your full mobile number" style="padding-left:38px;"/>
      </div>
    </div>
    <div class="form-group">
      <label>New Password *</label>
      <div class="input-wrap">
        <span class="input-icon">🔑</span>
        <input type="password" id="new-password" placeholder="Enter new password (min 6 chars)" style="padding-left:38px;"/>
      </div>
    </div>
    <div class="form-group">
      <label>Confirm New Password *</label>
      <div class="input-wrap">
        <span class="input-icon">🔑</span>
        <input type="password" id="confirm-password" placeholder="Confirm new password" style="padding-left:38px;"/>
      </div>
    </div>
    <button class="btn-submit" id="verifyBtn" onclick="verifyAndReset()">Reset My Password 🌿</button>
    <div style="text-align:center;margin-top:14px;">
      <a href="#" onclick="location.reload();return false;" style="font-size:13px;color:#2d7a3a;font-weight:600;text-decoration:none;">← Start Over</a>
    </div>
  `;

  // Attach event listener for verify button
  var vBtn = document.getElementById('verifyBtn');
  if(vBtn) vBtn.addEventListener('click', verifyAndReset);
}

// Step 3: Verify mobile and reset password
async function verifyAndReset() {
  var mobile = document.getElementById('verify-mobile').value.trim().replace(/\D/g,'');
  var newPass = document.getElementById('new-password').value;
  var confirmPass = document.getElementById('confirm-password').value;

  if(!mobile){ showForgotAlert('Please enter your mobile number!', 'error'); return; }
  if(!newPass || newPass.length < 6){ showForgotAlert('Password must be at least 6 characters!', 'error'); return; }
  if(newPass !== confirmPass){ showForgotAlert('Passwords do not match!', 'error'); return; }

  var btn = document.getElementById('verifyBtn');
  btn.textContent = 'Verifying...'; btn.disabled = true;

  try {
    // Verify mobile matches
    var table = window._resetTable || 'suppliers';
    var email = window._resetEmail;

    var r = await supabaseClient.from(table).select('mobile').eq('email', email).single();
    if(!r.data){ showForgotAlert('Verification failed! Please try again.', 'error'); btn.textContent='Reset My Password 🌿'; btn.disabled=false; return; }

    var storedMobile = (r.data.mobile || '').replace(/\D/g,'');
    var enteredMobile = mobile;

    // Compare last 10 digits
    var stored10 = storedMobile.slice(-10);
    var entered10 = enteredMobile.slice(-10);

    if(stored10 !== entered10){
      showForgotAlert('Mobile number does not match! Please enter your registered number.', 'error');
      btn.textContent = 'Reset My Password 🌿'; btn.disabled = false;
      return;
    }

    // Mobile matches! Update password
    await supabaseClient.from(table).update({ password: newPass }).eq('email', email);

    // Show success
    var forgotForm = document.getElementById('forgotForm');
    if(forgotForm) forgotForm.innerHTML = `
      <div style="text-align:center;padding:20px 0;">
        <div style="font-size:56px;margin-bottom:16px;">🎉</div>
        <h3 style="font-family:'Playfair Display',serif;font-size:22px;color:#1a4a24;margin-bottom:8px;">Password Reset!</h3>
        <p style="font-size:13px;color:#7a9a74;margin-bottom:24px;">Your password has been updated successfully!</p>
        <a href="/login" style="display:inline-block;padding:12px 28px;background:#2d7a3a;color:white;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Login Now →</a>
      </div>
    `;

  } catch(e) {
    console.log('Reset error:', e);
    showForgotAlert('Something went wrong. Please try again!', 'error');
    btn.textContent = 'Reset My Password 🌿'; btn.disabled = false;
  }
}
