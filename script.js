// Supabase configuration
const SUPABASE_URL = 'https://yxdczmyxvxxuycawuowt.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZGN6bXl4dnh4dXljYXd1b3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2Mjg3MDAsImV4cCI6MjA2MDIwNDcwMH0.Yv_lPDD3L-Xj1oF-jWeecE8RVHAAAlbxEC9UPVPmgd8'

// Initialize Supabase client
const { createClient } = supabase
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
})

// Function to create event card
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.innerHTML = `
        <div class="event-poster">
            <img src="${event.poster_url}" alt="${event.title} poster" onerror="this.src='placeholder-image.jpg'">
        </div>
        <div class="event-details">
            <h3>${event.title}</h3>
            <p class="date-time">${event.date} at ${event.time}</p>
            <p><strong>Venue:</strong> ${event.venue}</p>
            <p><strong>Organizer:</strong> ${event.organizer}</p>
            <p>${event.description}</p>
        </div>
    `;
    return card;
}

// Function to display events
async function displayEvents() {
    const eventsContainer = document.getElementById('eventsContainer');
    eventsContainer.innerHTML = '<p>Loading events...</p>';

    try {
        console.log('Fetching events from Supabase...');
        
        const { data: events, error } = await supabaseClient
            .from('events')
            .select('*')
            .order('date', { ascending: true });

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        console.log('Events fetched:', events);

        if (events.length === 0) {
            eventsContainer.innerHTML = '<p>No events found. Be the first to add one!</p>';
            return;
        }

        eventsContainer.innerHTML = '';
        events.forEach(event => {
            const card = createEventCard(event);
            eventsContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        eventsContainer.innerHTML = `<p>Error loading events: ${error.message}</p>`;
    }
}

// Set up real-time subscription
function setupRealtimeSubscription() {
    console.log('Setting up real-time subscription...');
    
    const subscription = supabaseClient
        .channel('events_channel')
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: 'events' 
            }, 
            (payload) => {
                console.log('Change received:', payload);
                displayEvents();
            }
        )
        .subscribe();

    return subscription;
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, initializing...');
    displayEvents();
    setupRealtimeSubscription();
}); 