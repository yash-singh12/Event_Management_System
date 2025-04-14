# Event Management System

A simple event management system built with HTML, CSS, and JavaScript, using Supabase as the backend database.

## Features

- Add new events with details
- View all events in a card layout
- Real-time updates when new events are added
- Responsive design for all screen sizes
- Modern UI with animations and transitions

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Supabase (Backend as a Service)

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/event-management-system.git
```

2. Create a Supabase project:
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Create a table called `events` with the following columns:
     - `id` (uuid, primary key)
     - `title` (text)
     - `date` (date)
     - `time` (text)
     - `venue` (text)
     - `organizer` (text)
     - `description` (text)
     - `created_at` (timestamp with time zone, default: now())

3. Update the Supabase configuration:
   - Open `script.js` and `addEvent.js`
   - Replace `YOUR_SUPABASE_PROJECT_URL` with your project URL
   - Replace `YOUR_SUPABASE_ANON_KEY` with your anon key

4. Open `index.html` in your browser to start using the application

## Project Structure

```
event-management-system/
├── index.html          # Main landing page
├── addEvent.html       # Add new event page
├── styles.css          # Global styles
├── script.js           # Main page JavaScript
├── addEvent.js         # Add event page JavaScript
└── README.md           # Project documentation
```

## Contributing

Feel free to submit issues and enhancement requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 