# Hướng dẫn Deploy lên VPS Ubuntu 24

## Yêu cầu VPS
- Ubuntu 24.04 LTS
- RAM tối thiểu 1GB
- 10GB SSD storage
- IP public hoặc domain

---

## Bước 1: Chuẩn bị Server

### 1.1 Cập nhật hệ thống
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Cài đặt Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Kiểm tra phiên bản:
```bash
node -v   # v20.x.x
npm -v
```

### 1.3 Cài đặa PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 1.4 Cài đặa Nginx
```bash
sudo apt install -y nginx
```

---

## Bước 2: Deploy Ứng dụng

### 2.1 Tạo thư mục và upload project
```bash
# Tạo thư mục
sudo mkdir -p /var/www/bookhaven
cd /var/www/bookhaven

# Upload project (sử dụng git hoặc scp)
# Cách 1: Clone từ git
# git clone <your-repo-url> .

# Cách 2: Upload qua SCP
# scp -r ./vulnerable-app/* user@your-vps:/var/www/bookhaven/
```

### 2.2 Cài đặt dependencies
```bash
npm install
```

### 2.3 Tạo database
```bash
# Xóa database cũ nếu có
rm -f lab.db

# Database sẽ được tạo tự động khi chạy server
```

### 2.4 Cấu hình môi trường (khuyến nghị)
```bash
# Tạo file .env
nano .env
```

Nội dung:
```env
PORT=3000
NODE_ENV=production
```

### 2.5 Chạy ứng dụng với PM2
```bash
# Khởi động app
pm2 start server.js --name bookhaven

# Cấu hình auto-start khi reboot
pm2 startup
# Copy và chạy lệnh được hiển thị

# Lưu cấu hình PM2
pm2 save
```

Kiểm tra trạng thái:
```bash
pm2 status
pm2 logs bookhaven
```

---

## Bước 3: Cấu hình Nginx

### 3.1 Tạo config file
```bash
sudo nano /etc/nginx/sites-available/bookhaven
```

Nội dung:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Thay bằng domain của bạn

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3.2 Kích hoạt config
```bash
# Tạo symlink
sudo ln -s /etc/nginx/sites-available/bookhaven /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

---

## Bước 4: Cấu hình SSL (HTTPS) - Khuyến nghị

### 4.1 Cài đặa Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 4.2 Xin certificate
```bash
sudo certbot --nginx -d your-domain.com
```

### 4.3 Auto-renewal
```bash
# Certbot tự động cấu hình renewal
# Kiểm tra:
sudo certbot renew --dry-run
```

---

## Bước 5: Cấu hình Firewall

```bash
# Mở cổng SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Bật firewall
sudo ufw enable
```

---

## Bước 6: Quản lý Ứng dụng

### Các lệnh PM2 thường dùng
```bash
# Xem logs
pm2 logs bookhaven

# Restart app
pm2 restart bookhaven

# Stop app
pm2 stop bookhaven

# Xem trạng thái
pm2 status
```

### Cập nhật ứng dụng
```bash
cd /var/www/bookhaven
git pull
npm install
pm2 restart bookhaven
```

---

## Kiểm tra sau Deploy

```bash
# Kiểm tra Nginx
curl -I http://localhost

# Kiểm tra App API
curl http://localhost:3000

# Kiểm tra PM2
pm2 status
```

---

## Troubleshooting

### Lỗi Port đang được sử dụng
```bash
sudo lsof -i :3000
sudo kill <PID>
```

### Lỗi Permission
```bash
sudo chown -R $USER:$USER /var/www/bookhaven
```

### Logs không hiển thị
```bash
pm2 logs --err --lines 50
```

---

## Thông tin đăng nhập mặc định

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lab.com | K8x#mP2@nL9qR4!vY |
| User | user@lab.com | user123 |

**Lưu ý**: Đây là ứng dụng lab với các lỗ hổng bảo mật cố ý. Không deploy lên production!