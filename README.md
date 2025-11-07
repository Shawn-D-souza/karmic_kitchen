# **Karmic Kitchen 🍽️✨**

Karmic Kitchen is a data-driven web application that replaces a canteen's inefficient, manual meal-tracking process with a sleek, modern platform. It provides an exact, real-time count of required meals to drastically reduce food waste and operational costs.

**Live Demo:** [**https://karmic-kitchen.netlify.app/**](https://karmic-kitchen.netlify.app/)

### **1\. The Problem**

Organizations offering canteen services often face significant food wastage and operational inefficiency. Manual processes for tracking daily meal preferences lack coordination, leading to:

* **Inaccurate Estimation:** Chronic over-production of food.  
* **High Waste & Costs:** Unnecessary expenses that undermine the sustainability of the benefit.  
* **No Data:** A complete lack of data for future planning.

### **2\. Our Solution**

Karmic Kitchen is a production-ready web app that digitizes the entire process. The application is built on a "fixed menu" model (one breakfast, one lunch, one snack item per day).

1. **Employees** use the app to pre-confirm (opt-in) to the meals they want for the next day.  
2. **Admins** get a precise, real-time dashboard showing the *exact count* of meals required.  
3. **The Kitchen** cooks *only* what is needed, eliminating waste.

### **3\. Core Features**

The application is divided into two primary modules based on user roles (admin or employee).

#### **👩‍💼 Employee Module**

* **View Today's Menu:** A clean, simple UI shows the fixed menu for the day.  
* **Simple Opt-In:** Employees use simple \<Switch\> toggles to confirm their meal choices.  
* **9:00 PM Cut-off:** All toggles are automatically **disabled** at 9:00 PM, providing a hard deadline for the kitchen.  
* **Secure & Seamless:** Login is handled via Supabase Auth.

#### **🧑‍🍳 Canteen Administration Module**

* **The "Count" Dashboard:** The main dashboard. Admins can select any date (past, present, or future) and see the *exact number* of confirmed opt-ins for breakfast, lunch, and snack.  
* **Weekly Template Manager:** Admins can set a default "template" menu for each day of the week (e.g., "Monday \= Pasta").  
* **Daily Menu Planner:** Admins can quickly populate the menu for an entire week. The app is smart—it auto-fills the day's menu from the weekly template, which the admin can then approve or override.

### **4\. 🏆 Key Features**

What sets Karmic Kitchen apart is its focus on real-world, enterprise-ready solutions:

1. **Enterprise-Grade Security:** Signups are **locked** to a specific company email domain (e.g., @karmicsolutions.com), preventing unauthorized access.  
2. **"Smart" Template System:** The "Weekly Template" feature automates the admin's primary job, reducing daily data entry from minutes to seconds.  
3. **Native App Delivered:** The app is a fully installable **Progressive Web App (PWA)**. We have already used PWA Builder to generate a native **Android APK**, ready for distribution.

### **5\. Tech Stack**

* **Frontend:** **React.js (Vite)**  
* **UI Library:** **Material-UI (MUI)**  
* **Backend & Database:** **Supabase**  
  * **Postgres:** Our relational database.  
  * **Supabase Auth:** For user management and row-level security.  
  * **Database Functions:** To enforce the email domain lock.  
* **Deployment:** **Netlify** (with Continuous Deployment from GitHub)

### **6\. How to Run Locally**

1. **Clone the repository:**  
   git clone \[https://github.com/Shawn-D-souza/karmic\_kitchen.git\](https://github.com/Shawn-D-souza/karmic\_kitchen.git)  
   cd karmic\_kitchen

2. **Install dependencies:**  
   npm install

3. **Set up environment variables:**  
   * Create a file named .env.local in the project root.  
   * Add your Supabase project keys:  
     VITE\_SUPABASE\_PROJECT\_URL=YOUR\_SUPABASE\_PROJECT\_URL  
     VITE\_SUPABASE\_ANON\_KEY=YOUR\_SUPABASE\_ANON\_KEY

4. **Set up the Database:**  
   * Go to your Supabase project's SQL Editor.  
   * Run the SQL scripts (from our chat history or a database\_setup.sql file) to create the profiles, daily\_menu, menu\_templates, and confirmations tables and their RLS policies.  
   * Run the SQL script to create the handle\_new\_user function for the domain lock.  
5. **Run the app:**  
   npm run dev  
