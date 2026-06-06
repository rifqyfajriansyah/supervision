# SYSTEM ROLE
You are an Expert Full-Stack Developer. We are building a rapid UI/UX PROTOTYPE for a "Supervision Management System" based on the provided PDF reference ("Supervision control system 20216 05 21.pdf").

# TECH STACK & ARCHITECTURE
- **Backend:** Node.js with Express.js (TypeScript).
- **Frontend:** React.js (Vite) with TailwindCSS.
- **Mapping:** OpenLayers for GIS visualization.
- **Database:** NONE for now. We will strictly use hardcoded dummy data (JSON or in-memory arrays) via a Service Layer.
- **Future-Proofing:** Write the codebase cleanly so it can easily transition to a PostgreSQL/PostGIS database and be containerized for OpenShift Container Platform (OCP) deployments later.

# PROTOTYPE SCOPE & TASKS
Focus entirely on the UI layout and the basic data flow using mock data. Do not set up Docker or any database yet. Ensure the layout matches the visual hierarchy, data density, and color scheme of the provided PDF.

Please execute the development in the following order. Wait for my confirmation after each step before proceeding to the next:

**Step 1: Backend Setup (Express.js)**
- Set up a basic Express server using TypeScript.
- Create a "Service Layer" (e.g., `ProjectService`) that returns mock data. This structural separation is crucial so we can easily swap the mock data for real database queries later.
- Create these REST endpoints with realistic dummy data:
  1. `GET /api/projects`: Returns a list of projects with basic metrics (SPI, CPI, Progress percentages, and Status flags like 'Perform', 'Underperform', 'Critical').
  2. `GET /api/projects/:id/schedule`: Returns mock task lists (e.g., Earthwork, Pavement, Structure), start dates, end dates, and dependencies for the Gantt chart integration.
  3. `GET /api/projects/:id/s-curve`: Returns mocked data points for Planned vs. Actual progress percentages over a 12-month period. (This simulates the future integration of `https://codeberg.org/mikanet/libscurve`).

**Step 2: Frontend Setup (React + Vite)**
- Initialize the Vite React app with TailwindCSS.
- Create the main "Project Overview" and "Dashboard" layouts based on the PDF reference.
- Set up API fetching to consume the dummy data from the Express backend.
- Integrate a React Gantt chart library (e.g., `gantt-task-react`) to render the schedule data.
- Integrate a charting library (e.g., `Chart.js`, `ApexCharts`, or `Recharts`) to render the S-Curve data.
- Render a basic map component using OpenLayers with a few dummy GeoJSON points/lines to represent project stationing or locations.

Let's start with Step 1. Please provide the ideal folder structure for the backend and the initial setup code for the Express server and dummy data services.