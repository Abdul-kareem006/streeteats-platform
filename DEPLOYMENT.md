# Deploying StreetEats to Render (Free Tier)

This platform is currently set up as a monolithic full-stack app structure (frontend and backend in one repository). The easiest, cheapest, and most straightforward way to deploy this is using **Render.com**.

By using the scripts and updates we've just configured, Render will automatically download dependencies for both the frontend and backend, build your React app, and serve everything as a single secure Web Service!

## Step 1: Push your Code to GitHub
You have already pushed your repository to GitHub using the `git push origin main` command.

## Step 2: Set up Database (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account if you don't have one.
2. Follow their setup guide to create a Free Shared Cluster.
3. In Database Access, create a user with a username and password (save these!).
4. In Network Access, allow access from anywhere (`0.0.0.0/0`).
5. Click **Connect** -> **Drivers** -> And copy your **Connection String URI**.
   It looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   (*Replace `<password>` with your actual password*).

## Step 3: Deploy on Render

1. Create a free account on [Render.com](https://render.com/).
2. From the Render Dashboard, click **New +** and select **Web Service**.
3. Choose **Build and deploy from a Git repository**.
4. Connect your GitHub account and select your repository: `streeteats-platform`.
5. Configure your Web Service:
   - **Name**: `streeteats` (or anything you prefer).
   - **Region**: Choose one closest to India (e.g., Singapore).
   - **Branch**: `main`
   - **Root Directory**: Leave it **empty**!
   - **Environment**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
6. Scroll down to **Advanced** and click **Add Environment Variable**. Add these two variables:
   - Key: `MONGO_URL` | Value: `(Your MongoDB Atlas URI from Step 2)`
   - Key: `NODE_ENV` | Value: `production`
7. Click **Create Web Service**.

## Step 4: Watch it Deploy!
Render will start executing the `build` command. It will install all backend dependencies, jump into your frontend, install those dependencies, and compile your fast React App. 

Once it says **Live**, you can click the `https://streeteats-xxxx.onrender.com` URL provided at the top left of the Render dashboard. 

Your entire platform is now officially online!
