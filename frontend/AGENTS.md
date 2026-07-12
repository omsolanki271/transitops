# TransitOps Smart Transport Operations Platform

---

# Project Overview

TransitOps is a Smart Transport Operations Platform developed for the Odoo Hackathon.

The objective is to digitize the complete transport lifecycle including

- Vehicle Management
- Driver Management
- Trip Management
- Maintenance
- Fuel Logs
- Expense Management
- Reports
- Dashboard Analytics

The system replaces manual spreadsheets and logbooks with one centralized application.

---

# Tech Stack

Frontend

- React 19
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- React Hook Form
- React Icons
- Recharts

Backend

- Django
- Django REST Framework
- JWT Authentication
- Django ORM

Database

- MySQL Workbench 8.0 CE

Authentication

- JWT Token

Version Control

- Git
- GitHub

Deployment

Frontend

- Vercel

Backend

- Render

---

# Project Architecture

React

↓

Axios

↓

REST API

↓

Django REST Framework

↓

Business Logic

↓

MySQL

---

# Folder Structure

Frontend

src/

assets/

components/

layouts/

pages/

Dashboard

Vehicles

Drivers

Trips

Maintenance

Fuel

Expenses

Reports

Profile

routes/

services/

hooks/

context/

utils/

Backend

config/

authentication/

dashboard/

users/

vehicles/

drivers/

trips/

maintenance/

fuel/

expenses/

reports/

media/

static/

---

# Authentication

JWT Authentication

Login

Refresh Token

Logout

Protected Routes

Only authenticated users can access APIs.

---

# User Roles

Fleet Manager

Driver

Safety Officer

Financial Analyst

RBAC should restrict API access.

---

# Dashboard

Dashboard should display

Active Vehicles

Available Vehicles

Vehicles in Shop

Drivers On Duty

Trips Today

Pending Trips

Completed Trips

Fleet Utilization

Fuel Cost

Maintenance Cost

Revenue

Operational Cost

Charts

Vehicle Status

Trip Status

Fuel Cost

Monthly Expenses

---

# Modules

## Authentication

Login

Logout

JWT

Role Based Access

---

## Vehicle Module

CRUD

Registration Number

Vehicle Name

Model

Vehicle Type

Capacity

Odometer

Acquisition Cost

Status

Region

Status

Available

On Trip

In Shop

Retired

---

## Driver Module

CRUD

Driver Name

License Number

License Category

License Expiry

Phone

Safety Score

Status

Available

On Trip

Off Duty

Suspended

---

## Trip Module

CRUD

Trip Number

Vehicle

Driver

Source

Destination

Cargo Weight

Distance

Fuel Used

Revenue

Status

Draft

Dispatched

Completed

Cancelled

---

## Maintenance Module

CRUD

Maintenance Type

Description

Vehicle

Start Date

End Date

Cost

Status

Open

Closed

---

## Fuel Module

CRUD

Vehicle

Trip

Liters

Cost

Fuel Date

---

## Expense Module

CRUD

Vehicle

Trip

Expense Type

Amount

Date

Remarks

---

## Reports

Fuel Efficiency

Fleet Utilization

Vehicle ROI

Operational Cost

Vehicle Performance

Monthly Expenses

CSV Export

PDF Export (Optional)

---

# Database Tables

users

roles

vehicles

drivers

trips

maintenance_logs

fuel_logs

expenses

---

# Database Relationships

Role

↓

User

Vehicle

↓

Trips

↓

Fuel Logs

↓

Maintenance

↓

Expenses

Driver

↓

Trips

---

# REST APIs

Authentication

POST

/api/login

POST

/api/logout

POST

/api/token/refresh

Dashboard

GET

/api/dashboard

GET

/api/dashboard/kpis

GET

/api/dashboard/charts

Vehicles

GET

/api/vehicles

POST

/api/vehicles

PUT

/api/vehicles/{id}

DELETE

/api/vehicles/{id}

Drivers

GET

/api/drivers

POST

/api/drivers

PUT

/api/drivers/{id}

DELETE

/api/drivers/{id}

Trips

GET

/api/trips

POST

/api/trips

PUT

/api/trips/{id}

DELETE

/api/trips/{id}

POST

/api/trips/{id}/dispatch

POST

/api/trips/{id}/complete

POST

/api/trips/{id}/cancel

Maintenance

GET

/api/maintenance

POST

/api/maintenance

PUT

/api/maintenance/{id}

POST

/api/maintenance/{id}/close

Fuel

GET

/api/fuel

POST

/api/fuel

Expenses

GET

/api/expenses

POST

/api/expenses

Reports

GET

/api/reports/fuel-efficiency

GET

/api/reports/fleet-utilization

GET

/api/reports/roi

GET

/api/reports/operational-cost

GET

/api/reports/export-csv

---

# Business Rules

Registration Number must be unique.

Vehicle status must be

Available

On Trip

In Shop

Retired

Retired vehicles cannot be assigned.

Vehicles in Shop cannot be assigned.

Driver status

Available

On Trip

Off Duty

Suspended

Suspended drivers cannot be assigned.

Expired License drivers cannot be assigned.

Driver already on trip cannot receive another trip.

Vehicle already on trip cannot receive another trip.

Cargo Weight

<=

Vehicle Capacity

Dispatch

Vehicle

↓

On Trip

Driver

↓

On Trip

Complete Trip

Vehicle

↓

Available

Driver

↓

Available

Cancel Trip

Vehicle

↓

Available

Driver

↓

Available

Maintenance Start

Vehicle

↓

In Shop

Maintenance Close

Vehicle

↓

Available

unless Retired

---

# Dashboard Calculations

Fleet Utilization

(On Trip Vehicles / Total Vehicles)

×

100

Fuel Efficiency

Distance

/

Fuel Used

Operational Cost

Fuel Cost

+

Maintenance Cost

+

Other Expenses

ROI

Revenue

-

(Maintenance + Fuel)

/

Acquisition Cost

---

# Validation Rules

Vehicle Capacity > Cargo

Unique Registration Number

License Expiry

Required Fields

Positive Cost

Positive Distance

Positive Fuel

Positive Odometer

---

# Backend Response

Success

{
success:true,
message:"",
data:{}
}

Error

{
success:false,
message:"",
errors:[]
}

---

# React Guidelines

Use Functional Components.

Use Hooks.

Use Axios.

Store JWT inside localStorage.

Create reusable components.

Separate API layer.

Use Tailwind CSS.

Avoid inline styles.

---

# Django Guidelines

Use Django REST Framework.

Use ModelSerializer.

Use ViewSets.

Use JWT Authentication.

Use Permissions.

Business Logic inside Services.

Never duplicate validation.

---

# UI Theme

Primary

#4F46E5

Success

#22C55E

Danger

#EF4444

Warning

#F59E0B

Background

#F8FAFC

Card

White

Rounded XL

Shadow Large

Responsive

Desktop

Tablet

Mobile

---

# Future Features

Email Reminder

License Expiry Notification

Vehicle Documents

Dark Mode

GPS Tracking

Live Map

Push Notification

AI Route Optimization

Driver Performance Analytics

Predictive Maintenance
