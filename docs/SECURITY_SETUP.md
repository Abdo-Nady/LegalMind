# Security Setup Guide: Enabling HTTPS for Google Sign-In

## The Problem: Why Google Sign-In Fails on EC2
Google OAuth 2.0 has strict security requirements. While it allows `http://localhost` for testing, it **blocks** HTTP requests from public IP addresses (like your EC2 instance `http://54.x.x.x`). 

To fix this, you must serve your application over **HTTPS** using a valid **domain name**.

---

## Solution Overview
We will implement a standard production architecture using **Nginx** and **Certbot** (Let's Encrypt) to handle free, automatic SSL certificates.

### Prerequisites
1.  **A Domain Name:** You must own a domain (e.g., `documind-app.com`). You can buy one from Namecheap, GoDaddy, or AWS Route53.
2.  **DNS Configuration:** Create an `A Record` in your domain provider's dashboard pointing to your EC2 instance's Public IPv4 address.
    *   `@` -> `YOUR_EC2_IP`
    *   `www` -> `YOUR_EC2_IP`

---

## Step 1: Update Django Settings
You need to tell Django to trust your new domain.

1.  Open `server/.env` (on your server) and update `FRONTEND_URL`:
    ```ini
    FRONTEND_URL=https://your-domain.com
    ```

2.  Update `server/config/settings.py` to allow your domain:
    ```python
    ALLOWED_HOSTS = ["your-domain.com", "www.your-domain.com", "localhost", "127.0.0.1"]
    
    CORS_ALLOWED_ORIGINS = [
        "https://your-domain.com",
        "https://www.your-domain.com",
        "http://localhost:5173",
    ]
    
    # Security settings for production (uncomment these when HTTPS is working)
    # CSRF_COOKIE_SECURE = True
    # SESSION_COOKIE_SECURE = True
    ```

---

## Step 2: Update Google Console
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Navigate to **APIs & Services > Credentials**.
3.  Edit your OAuth 2.0 Client ID.
4.  Update **Authorized JavaScript origins**:
    *   Add: `https://your-domain.com`
    *   Add: `https://www.your-domain.com`
5.  Update **Authorized redirect URIs**:
    *   Add: `https://your-domain.com` (or wherever your callback handles it)

---

## Step 3: Deployment with Nginx & Certbot
The easiest way to set this up without modifying your app containers is to use a dedicated **Nginx Proxy Manager** or a raw Nginx + Certbot container setup.

Below is a `docker-compose.prod.yml` configuration you can use to replace your current one. It adds an Nginx container that handles SSL and proxies traffic to your app.

### Create `nginx-proxy.conf`
Create a file named `nginx-proxy.conf` in your project root:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # API requests to Django
    location /api/ {
        proxy_pass http://server:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend requests to React
    location / {
        proxy_pass http://client:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Update `docker-compose.yml`
Add the Certbot and Nginx services (simplified logic):

1.  **Certbot Service:** Runs once to get the certificate.
2.  **Nginx Service:** Mounts the certificates and the config file.

**Note:** For the *very first run*, Nginx will fail because certificates don't exist yet. You often need a "dummy" certificate or to run Certbot in "standalone" mode first.

### Recommended Tool: Nginx Proxy Manager
For a GUI-based approach that manages all of this for you (e.g., getting certificates, forwarding ports), I recommend deploying **Nginx Proxy Manager** alongside your app.

1.  Run Nginx Proxy Manager on port 80/443.
2.  Point it to `documind_client:80` for the frontend.
3.  Point `/api` to `documind_server:8000`.
4.  Click "SSL" tab -> "Request a new certificate".

This is often much easier than manually configuring Nginx config files.

## Summary Checklist
- [ ] Buy a domain.
- [ ] Point DNS A-record to EC2 IP.
- [ ] Update `ALLOWED_HOSTS` in Django settings.
- [ ] Update Google Cloud Console origins.
- [ ] Set up Nginx Reverse Proxy with SSL (Certbot).
