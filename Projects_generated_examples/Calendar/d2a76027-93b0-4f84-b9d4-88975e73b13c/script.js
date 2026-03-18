// Calendar functionality implementation

// Wait for the DOM to be fully loaded before accessing elements
document.addEventListener('DOMContentLoaded', () => {
    // 1. Constants & State
    const calendarEl = document.getElementById('calendar');
    const monthYearEl = document.getElementById('monthYear');
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    const modal = document.getElementById('eventModal');
    const closeModalBtn = document.getElementById('closeModal');
    const eventForm = document.getElementById('eventForm');
    const eventDateInput = document.getElementById('eventDate');
    const eventListEl = document.getElementById('eventList');
    // Additional form fields used when saving an event
    const eventTitleInput = document.getElementById('eventTitle');
    const eventTimeInput = document.getElementById('eventTime');
    const eventDescInput = document.getElementById('eventDesc');

    let currentDate = new Date(); // mutable state representing the month being displayed

    // 2. Utility Functions
    function getDaysInMonth(year, month) {
        // month is zero‑based (0 = Jan). Creating a date with day 0 returns the last day of the previous month.
        return new Date(year, month + 1, 0).getDate();
    }

    function getFirstWeekday(year, month) {
        // Returns 0‑6 where 0 = Sunday
        return new Date(year, month, 1).getDay();
    }

    function formatDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 3. LocalStorage API
    function loadEvents() {
        const data = localStorage.getItem('calendarEvents');
        try {
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Failed to parse stored events:', e);
            return {};
        }
    }

    function saveEvents(events) {
        localStorage.setItem('calendarEvents', JSON.stringify(events));
    }

    let events = loadEvents();

    // 4. Render Calendar Grid
    function renderCalendar() {
        // Clear previous cells
        calendarEl.innerHTML = '';

        // Update month/year header
        monthYearEl.textContent = currentDate.toLocaleString('default', {
            month: 'long',
            year: 'numeric'
        });

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // 0‑based
        const firstWeekday = getFirstWeekday(year, month);
        const daysInMonth = getDaysInMonth(year, month);
        const today = new Date();
        const todayKey = formatDateKey(today);

        // Build a 7x6 grid (42 cells)
        for (let i = 0; i < 42; i++) {
            const cell = document.createElement('div');
            const dayNumber = i - firstWeekday + 1; // calculate day for this cell

            if (dayNumber < 1 || dayNumber > daysInMonth) {
                cell.classList.add('empty');
            } else {
                const cellDate = new Date(year, month, dayNumber);
                const dateKey = formatDateKey(cellDate);
                cell.classList.add('day');
                cell.dataset.date = dateKey;
                cell.textContent = dayNumber;

                // Highlight today
                if (dateKey === todayKey) {
                    cell.classList.add('today');
                }

                // Indicate if there are events for this date
                if (events[dateKey] && events[dateKey].length > 0) {
                    cell.classList.add('has-event');
                    const dot = document.createElement('span');
                    dot.classList.add('event-dot');
                    cell.appendChild(dot);
                }

                // Click opens modal for that date
                cell.addEventListener('click', () => openModal(dateKey));
            }
            calendarEl.appendChild(cell);
        }
    }

    // 5. Navigation Handlers
    prevBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // 6. Modal Logic
    function openModal(dateKey) {
        eventDateInput.value = dateKey;
        modal.style.display = 'block';
        renderEventList(dateKey);
    }

    closeModalBtn.onclick = () => {
        modal.style.display = 'none';
    };

    // Close modal when clicking outside the content area
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // 7. Event Form Submission
    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const dateKey = eventDateInput.value;
        const newEvent = {
            title: eventTitleInput.value.trim(),
            time: eventTimeInput.value,
            description: eventDescInput.value.trim()
        };
        if (!events[dateKey]) {
            events[dateKey] = [];
        }
        events[dateKey].push(newEvent);
        saveEvents(events);
        renderCalendar(); // refresh calendar to show event indicator
        renderEventList(dateKey);
        eventForm.reset();
    });

    // 8. Event List Rendering
    function renderEventList(dateKey) {
        eventListEl.innerHTML = '';
        const dayEvents = events[dateKey];
        if (dayEvents && dayEvents.length > 0) {
            const ul = document.createElement('ul');
            dayEvents.forEach(ev => {
                const li = document.createElement('li');
                const title = ev.title || '(No title)';
                const time = ev.time ? ` @ ${ev.time}` : '';
                const desc = ev.description ? ` – ${ev.description}` : '';
                li.textContent = `${title}${time}${desc}`;
                ul.appendChild(li);
            });
            eventListEl.appendChild(ul);
        } else {
            eventListEl.textContent = 'No events for this date.';
        }
    }

    // 9. Initialisation
    renderCalendar();
});
