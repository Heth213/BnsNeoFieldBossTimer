 Website working on: [Here](https://bnsbosstimers.netlify.app/) - no trolling please, thanks.

## My changes
- Added extra 15sec to show SPAWNED after the timer ends
- Changed colors
- Changed alert sound
- Redesigned the whole website
- Added a calculator for stats
- Added "Dead" button when the boss spawns for faster updating

# Field Boss Timer

## 📌 Project Description

Field Boss Timer is a web application designed to track the respawn times of bosses in BnS Neo. It allows users to add timers, synchronize in real-time, and adjust notification sounds.

![Alt text](https://i.imgur.com/ISfd2zA.png)

## 🚀 Features

- ✅ **Add timers** for different bosses and channels
- 🔄 **Real-time synchronization** using Supabase Realtime
- 🎵 **Sound notifications** when a timer is about to expire
- 🔊 **Volume control and sound toggling**
- 📌 **Save user settings** in `localStorage`
- 🌍 **Automatic timer updates** for all users
- 📊 **Optimized database queries** for better performance

## 🛠️ Technology Stack

- **React** – Frontend framework
- **Tailwind CSS** – Styling
- **Supabase** – Database and real-time synchronization
- **LocalStorage** – User settings storage

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/paticzekm/BnsNeoFieldBossTimer
   cd BnsNeoFieldBossTimer
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment variables:**
   - Check Supabase Setup
4. **Run the application locally:**
   ```bash
   npm start
   ```

## 🔧 Supabase Setup

To use Supabase as the backend for real-time synchronization and database storage, follow these steps:

1. **Create a Supabase Project:**

   - Go to [Supabase](https://supabase.com/)
   - Click on **New Project**
   - Set up your database and project settings

2. **Create the `timers` table:**

   ```sql
   create table timers (
       id uuid default gen_random_uuid() primary key,
       boss text not null,
       channel int not null,
       type text not null,
       end_time bigint not null
   );
   ```

3. **Enable Realtime for `timers` table:**

   - Go to **Database** → **Tables** → Select `timers`
   - Enable **Realtime Subscription**


4. **Get API Keys:**
   - Go to **Project Settings** → **API**
   - Copy the **Anon Key** and **Project URL**
   - Add them to your `src/supabaseClient.js` file

## 🌍 Deployment

The application can be deployed on:

- **Netlify** – Auto-deploy from GitHub
- **Vercel** – Fast hosting for React apps

Database can be deployed on:

- **Supabase Hosting** – Database and API hosting

To build the application:

```bash
npm run build
```

Then upload the `build/` folder to your preferred hosting platform.

## 🛠️ Contribution

1. **Fork the repository**
2. **Create a new branch:**
   ```bash
   git checkout -b feature-name
   ```
3. **Commit your changes:**
   ```bash
   git commit -m "Added a new feature"
   ```
4. **Push changes and create a pull request:**
   ```bash
   git push origin feature-name
   ```

## 📜 License

This project is licensed under the **GNU General Public License v3.0 (GPL v3)**. You can modify and use it under the terms of this license.

---

✉️ **Contact**: If you have any questions or suggestions, reach out via [GitHub Issues](https://github.com/paticzekm/BnsNeoFieldBossTimer/issues).
