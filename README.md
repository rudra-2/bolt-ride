
# Bolt Ride

Welcome to the Bolt Ride project! This repository contains two main applications:
- **Admin App** (for partners)
- **Customer App** (for riders)

Both apps have separate client (frontend) and server (backend) folders.

---

## Project Structure

```
bolt-ride/
├── admin-app/
│   ├── client/      # React frontend for partners
│   └── server/      # Django backend for partners
├── customer-app/
│   ├── client/      # React frontend for customers
│   └── server/      # Node.js backend for customers
└── README.md        # Project documentation
```

---

## Getting Started

### Prerequisites
- Node.js & npm
- Python 3.x & Django

---

## Admin App

### Client (React)
- Location: `admin-app/client`
- Start: 
	```cmd
	cd admin-app/client
	npm install
	npm start
	```
- Main page: Shows "Welcome to Bolt Ride Partner"

### Server (Django)
- Location: `admin-app/server`
- Start:
	```cmd
	cd admin-app/server
	python manage.py runserver
	```
- Configuration: Edit `admin-app/server/server/settings.py` as needed

---

## Customer App

### Client (React)
- Location: `customer-app/client`
- Start:
	```cmd
	cd customer-app/client
	npm install
	npm start
	```

### Server (Node.js)
- Location: `customer-app/server`
- Start:
	```cmd
	cd customer-app/server
	npm install
	node index.js
	```

---

## Common Commands
- Install dependencies: `npm install` (for React/Node)
- Run frontend: `npm start`
- Run Django backend: `python manage.py runserver`
- Run Node backend: `node index.js`

---

## Folder Details
- `client/` - React app (frontend)
- `server/` - Django or Node.js app (backend)
- `public/` - Static assets for React
- `src/` - Source code for React
- `config/`, `controllers/`, `models/`, `routes/` - Node.js backend structure

---

## Contributing
1. Clone the repo
2. Create a new branch for your feature
3. Make changes and commit
4. Push and create a pull request

---

## Contact
For questions, reach out to the team lead or open an issue in this repository.

---
## Contributors
Rudra Patel
Smit Patel

