#!/usr/bin/env bash
# =============================================================================
# setup-vm.sh — Script cài đặt Azure VM lần đầu (Ubuntu 22.04 / 24.04 LTS)
# Chạy với: bash setup-vm.sh YOUR_DOMAIN
# Ví dụ:    bash setup-vm.sh game.example.com
# =============================================================================
set -euo pipefail

DOMAIN="${1:-}"
if [[ -z "$DOMAIN" ]]; then
  echo "❌ Thiếu domain. Dùng: bash setup-vm.sh YOUR_DOMAIN"
  exit 1
fi

EMAIL="admin@${DOMAIN}"  # Email cho Let's Encrypt notifications

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 Setup Azure VM cho caro-8bit"
echo "  Domain : $DOMAIN"
echo "  Email  : $EMAIL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── 1. Cập nhật hệ thống ─────────────────────────────────────────────────────
echo ""
echo "📦 [1/6] Cập nhật packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# ─── 2. Cài Docker ───────────────────────────────────────────────────────────
echo ""
echo "🐳 [2/6] Cài đặt Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
  echo "✅ Docker đã cài xong. Bạn cần logout & login lại để dùng docker mà không cần sudo."
else
  echo "✅ Docker đã có sẵn: $(docker --version)"
fi

# Docker Compose plugin (v2)
if ! docker compose version &>/dev/null; then
  sudo apt-get install -y docker-compose-plugin
fi
echo "✅ Docker Compose: $(docker compose version)"

# ─── 3. Cài Certbot ──────────────────────────────────────────────────────────
echo ""
echo "🔐 [3/6] Cài đặt Certbot..."
if ! command -v certbot &>/dev/null; then
  sudo apt-get install -y certbot
fi
echo "✅ Certbot: $(certbot --version)"

# ─── 4. Tạo thư mục ứng dụng ─────────────────────────────────────────────────
echo ""
echo "📁 [4/6] Tạo thư mục ~/app..."
mkdir -p ~/app/client_dist ~/app/docker /var/www/certbot
echo "✅ Đã tạo: ~/app, ~/app/client_dist, ~/app/docker"

# ─── 5. Xin SSL certificate từ Let's Encrypt ──────────────────────────────────
echo ""
echo "🔐 [5/6] Xin SSL certificate cho $DOMAIN..."
echo "⚠️  Đảm bảo DNS của $DOMAIN đã trỏ về IP của VM này trước khi chạy bước này!"
echo ""
read -p "Domain đã trỏ về VM chưa? Nhấn Enter để tiếp tục, hoặc Ctrl+C để dừng..."

sudo certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  -d "$DOMAIN" \
  -d "www.$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --non-interactive \
  --expand \
  || {
    echo ""
    echo "⚠️  Certbot webroot không thành công (container chưa chạy)."
    echo "    Thử với standalone mode..."
    sudo certbot certonly \
      --standalone \
      -d "$DOMAIN" \
      -d "www.$DOMAIN" \
      --email "$EMAIL" \
      --agree-tos \
      --non-interactive
  }

echo "✅ SSL certificate đã được tạo tại /etc/letsencrypt/live/$DOMAIN/"

# ─── 6. Cron job tự động gia hạn SSL ────────────────────────────────────────
echo ""
echo "🔄 [6/6] Cài đặt cron job tự động gia hạn SSL..."
CRON_JOB="0 3 * * * certbot renew --quiet && docker exec caro_nginx nginx -s reload"
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_JOB") | crontab -
echo "✅ Cron job đã được cài: chạy lúc 3AM hàng ngày"

# ─── Hướng dẫn tiếp theo ─────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup hoàn tất!"
echo ""
echo "📋 Các bước tiếp theo:"
echo ""
echo "  1. Thêm GitHub Secrets vào repo caro-8bit:"
echo "     AZURE_VM_HOST     = $(curl -s ifconfig.me 2>/dev/null || echo '<IP của VM>')"
echo "     AZURE_VM_USER     = $USER"
echo "     AZURE_VM_SSH_KEY  = <nội dung private key SSH>"
echo "     VM_JWT_SECRET     = <chuỗi bí mật cho JWT>"
echo ""
echo "  3. Mở Azure Network Security Group, cho phép:"
echo "     - Port 22  (SSH)"
echo "     - Port 80  (HTTP)"
echo "     - Port 443 (HTTPS)"
echo ""
echo "  4. Deploy lần đầu:"
echo "     git tag v1.0.0 && git push origin v1.0.0"
echo ""
echo "  5. Kiểm tra:"
echo "     docker compose -f ~/app/docker-compose.yml ps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
