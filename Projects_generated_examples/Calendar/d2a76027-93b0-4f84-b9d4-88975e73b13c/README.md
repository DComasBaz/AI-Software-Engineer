# Simple Calendar App

## Project Overview
The **Simple Calendar App** is a lightweight, client‑side web application that lets users view a monthly calendar, add events to specific dates, and see a list of those events. All data is stored locally in the browser using **localStorage**, so events persist across page reloads without any backend.

## Tech Stack
- **HTML** – structure of the page
- **CSS** – styling and layout (no external frameworks)
- **JavaScript** – calendar logic, event handling, and persistence (plain ES6, no libraries)

## Features
1. **Month Navigation** – Buttons to move to the previous or next month.
2. **Current Month & Year Header** – Displays the month name and year at the top.
3. **Today Highlight** – The current day is visually highlighted.
4. **Add Event Modal** – Click any date to open a modal where you can enter a title, time, and description.
5. **Event Indicator** – Dates that have events show a small dot indicator.
6. **Event List** – After selecting a date, a list of its events is displayed below the calendar.
7. **LocalStorage Persistence** – All events are saved in the browser’s localStorage, surviving page reloads and browser restarts.
8. **Responsive UI** – Simple, clean styling that works on desktop and mobile browsers.

## Setup Instructions
1. **Clone the repository**
   ```bash
   git clone <repository‑url>
   cd <repo‑directory>
   ```
2. **Open the app**
   - Locate the `index.html` file in the project root.
   - Open it directly in any modern web browser (Chrome, Firefox, Edge, Safari, etc.).
   - No build tools, npm packages, or server are required.

## Usage Guide
1. **Navigate Months**
   - Click the **«** button on the left to go to the previous month.
   - Click the **»** button on the right to go to the next month.
2. **Select a Date**
   - Click on any day cell. The modal will appear, pre‑filled with the selected date.
3. **Add an Event**
   - Fill in **Title** (required), **Time**, and **Description**.
   - Press **Save**. The modal closes, the calendar refreshes, and a dot appears on the date.
4. **View Events**
   - After selecting a date, the **Event List** panel below the calendar shows all events for that day.
   - If no events exist, the panel displays “No events for this date.”
5. **Data Persistence**
   - All events are automatically saved to `localStorage`. Closing the browser or reloading the page retains the data.

## File Structure
```
├─ index.html      # Main HTML page – includes calendar container, modal, and script link
├─ styles.css      # All CSS styling for the calendar, modal, and event list
├─ script.js       # Core JavaScript: rendering, navigation, modal handling, localStorage API
└─ README.md       # Project documentation (this file)
```
- **index.html** – Sets up the DOM elements (calendar grid, navigation buttons, modal, event list) and loads `script.js`.
- **styles.css** – Contains layout rules, colors, and responsive styles. No external CSS frameworks are used.
- **script.js** – Implements the calendar logic, event storage, UI interactions, and rendering.
- **README.md** – Provides an overview, tech stack, features, setup, usage, and future roadmap.

## Future Improvements (optional)
- **Edit / Delete Events** – Add UI controls to modify or remove existing events.
- **Recurring Events** – Support daily, weekly, or monthly recurring entries.
- **Search / Filter** – Ability to search events by title or date range.
- **Export / Import** – Export events to JSON and import them back.
- **Theming** – Light / dark mode toggle.
- **Accessibility Enhancements** – Better keyboard navigation and ARIA labels.
- **Internationalization** – Support multiple languages and locale‑specific date formats.

---
*Built with vanilla web technologies for simplicity and maximum compatibility.*