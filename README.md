# softmulti_pro — Multi Vendor E-Commerce Platform

A VS Code friendly full-stack starter project based on the supplied SRS.

## Stack
- Frontend: HTML5, CSS3, JavaScript (separate files/modules)
- Backend: Node.js + Express
- Database: MySQL
- Authentication: JWT + bcrypt
- Payments: mock payment flow ready for gateway integration
- Notifications: email/SMS service placeholders
- No Eclipse/XAMPP required.

## Project Structure
- `frontend/` — customer, vendor and admin pages
- `backend/` — API server, controllers, routes, models and middleware
- `database/schema.sql` — MySQL database schema
- `.env.example` — backend configuration

## Run in VS Code
1. Install Node.js LTS and MySQL.
2. Open this `softmulti_pro` folder in VS Code.
3. Create the database using `database/schema.sql`.
4. Copy `backend/.env.example` to `backend/.env` and update MySQL credentials.
5. In VS Code terminal:
   - `cd backend`
   - `npm install`
   - `npm run dev`
6. Open `frontend/index.html` with Live Server, or serve the frontend using any simple static server.

## Demo accounts
The database seed creates demo users. Change passwords before real deployment.
- Admin: admin@softmulti.local / Admin@123
- Vendor: vendor@softmulti.local / Vendor@123
- Customer: customer@softmulti.local / Customer@123

This is an academic project starter. Real payment, SMS and email credentials should be added through environment variables before production use.
