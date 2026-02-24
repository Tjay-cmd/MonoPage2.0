# Push to Vercel (Replace Old Code)

Your code is ready. Follow these steps to deploy:

## 1. Get your GitHub repo URL

In Vercel: **Project Settings → Git → Connected Git Repository**

Copy the repo URL (e.g. `https://github.com/tjay-cmd/mono` or `https://github.com/YOUR_USERNAME/YOUR_REPO`).

## 2. Add remote and push

Open a terminal in this project folder and run (replace with YOUR repo URL):

```powershell
cd "c:\Users\tjayb\OneDrive\Desktop\project 4"

# Add your GitHub repo as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push and replace the old code on main
git push -u origin main --force
```

**Note:** `--force` overwrites the old code on GitHub. Your domain (www.monopage.co.za) will stay linked; Vercel will auto-deploy the new code.

## 3. Set environment variables in Vercel

After pushing, in Vercel go to **Settings → Environment Variables** and add all vars from your `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` = `https://www.monopage.co.za` (your real domain)
- `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`, `PAYFAST_SANDBOX`
- `RESEND_API_KEY`, `FROM_EMAIL`
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `DEEPSEEK_API_KEY` (if used)

Then trigger a redeploy if needed.
