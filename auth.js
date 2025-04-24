const users = JSON.parse(localStorage.getItem('superstore_users')) || {
    'admin': { password: 'admin123', data: null }
  };
  
  document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
  
    if (users[username] && users[username].password === password) {
      sessionStorage.setItem('currentUser', username);
      window.location.href = 'index.html';
    } else {
      document.getElementById('loginError').textContent = 'Invalid username or password';
    }
  });
  
  document.getElementById('registerLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    const username = prompt('Enter a username:');
    if (username) {
      if (users[username]) {
        alert('Username already exists');
      } else {
        const password = prompt('Enter a password:');
        if (password) {
          users[username] = { password, data: null };
          localStorage.setItem('superstore_users', JSON.stringify(users));
          alert('Registration successful! Please login.');
        }
      }
    }
  });
  
  function checkAuth() {
    if (!sessionStorage.getItem('currentUser') && !window.location.href.includes('login.html')) {
      window.location.href = 'login.html';
    }
  }
  
  function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  }