# Task Management System Report

## 1. Introduction

This project is a Task Management System developed as a MERN stack web application. The system allows users to create and manage tasks, update progress states, assign priorities, set deadlines, and optionally assign tasks to a team member by username.

The idea is inspired by Microsoft To Do while adding a small workflow upgrade (status pipeline + priority + simple assignment).

## 2. Technologies Used

- **React**: For building the user interface.
- **Node.js**: JavaScript runtime for backend execution.
- **Express.js**: REST API framework.
- **MongoDB**: NoSQL database.
- **Mongoose**: ODM for schema modeling and database operations.
- **Axios**: Frontend HTTP communication with backend API.

## 3. Features Implemented

1. Task CRUD:
   - Create task
   - View all tasks
   - Edit existing task
   - Delete task
2. Task status tracking:
   - To Do
   - In Progress
   - Done
3. Priority levels:
   - Low
   - Medium
   - High
4. Deadline field for task scheduling.
5. Optional assignment field (`assignedTo`) for simple team usage.
6. Filters:
   - Filter tasks by status
   - Filter tasks by priority

## 4. System Architecture

The application follows a 3-tier architecture:

- **Frontend (React)** handles task form, listing, filtering, and user interactions.
- **Backend (Express API)** processes requests and performs validation.
- **Database (MongoDB)** stores task records.

Data flow: Frontend -> Backend API -> MongoDB -> Backend API -> Frontend

## 5. Database Schema

Main collection: `tasks`

Fields:
- `title` (String, required)
- `description` (String, optional)
- `status` (Enum: To Do, In Progress, Done)
- `priority` (Enum: Low, Medium, High)
- `deadline` (Date, optional)
- `assignedTo` (String, optional)
- `createdAt`, `updatedAt` (timestamps)

## 6. API Overview

- `POST /api/tasks` create task
- `GET /api/tasks` list tasks (supports `status` and `priority` query filters)
- `GET /api/tasks/:id` get one task
- `PUT /api/tasks/:id` update task
- `DELETE /api/tasks/:id` delete task

## 7. How to Run

1. Configure backend `.env` with MongoDB URI.
2. Start server from `server` folder.
3. Start React app from `client` folder.
4. Open browser and manage tasks.

## 8. Screens to Capture for Viva/Demo

1. Home screen with task form and list.
2. New task creation with priority/status/deadline.
3. Filtered view by status and priority.
4. Task edit mode.
5. Task delete action result.

## 9. Future Improvements

- Add authentication (JWT login/signup).
- Add team collaboration with real user accounts.
- Add drag-and-drop board view like Trello.
- Add reminders and notification support.
- Add deployment to cloud platforms.
