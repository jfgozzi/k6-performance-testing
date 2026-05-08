# Restful-Booker Performance Testing Suite

This repository contains an automated performance testing framework built with **k6**. The project evaluates the robustness, scalability, and response times of the public API [Restful-Booker](https://restful-booker.herokuapp.com/).


### Key Features:
* **Dynamic Multi-Scenario:** Supports Smoke, Load, Stress, Spike, Soak, and Breakpoint tests by injecting parameters from the terminal.
* **Complete Lifecycle (CRUD):** Simulates real user behavior by performing Authentication (POST), Creation (POST), Reading (GET), Modification (PATCH), and Deletion (DELETE) operations.
* **Custom Metrics:** Implements `Trend` metrics to measure the exact time it takes for a user to complete the entire CRUD cycle, beyond individual HTTP requests.
* **Strict Validations:** Extensive use of `checks` to validate status codes (HTTP 200/201), data types, and business logic assertions (names, dates, response times).
* **Visual Reporting:** Automatic generation of interactive HTML dashboards upon execution completion.

---

### Technologies Used

* **[k6](https://k6.io/):** Core load injection engine (Open Source, written in Go).
* **JavaScript (ES6):** Language used for scripting Virtual Users (VUs).
* **k6 HTML Reporter:** Community library for generating visual dashboards.

---

### Prerequisites

To run this project in your local environment, you need to have installed:

1. **k6:** Follow the [official installation instructions](https://k6.io/docs/get-started/installation/).
2. **Node.js and npm:** Required to run the custom commands. Download from [nodejs.org](https://nodejs.org/).

---

### How to Run the Tests?

Open your terminal at the root of the project and run the desired command:

### 1. Smoke Test
Ideal for verifying that the environment works and endpoints respond correctly before injecting load.
```bash
npm run test:smoke
```
