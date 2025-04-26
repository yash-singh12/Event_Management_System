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

const VAPID_PUBLIC_KEY = 'BMnJ4cNQXQIG5JINP7m4qpvPEjUm-iX_IXe9KmhQLvmYQZ83W-PCiVlr06Q9bCbb4w9Dh__61B22hcx1B5kiApI'; // Replace with your generated public key

// API URL - will be different in production
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000'
    : '/api';  // Vercel will handle the routing

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(async reg => {
            console.log('Service Worker registered!', reg);

            // Ask for notification permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('You need to allow notifications!');
                return;
            }

            // Subscribe the user
            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            // Send subscription to your backend to store it
            await fetch('http://localhost:3000/save-subscription', {
                method: 'POST',
                body: JSON.stringify(subscription),
                headers: { 'Content-Type': 'application/json' }
            });
        });
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

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
            ${event.event_link ? `<a href="${event.event_link}" target="_blank" class="event-link">Visit Event Website</a>` : ''}
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

// Function to subscribe to push notifications
async function subscribeToPush() {
    try {
        // Register service worker with proper scope
        const registration = await navigator.serviceWorker.register('service-worker.js', {
            scope: '/'
        });
        console.log('Service Worker registered with scope:', registration.scope);

        // Check if push manager is supported
        if (!registration.pushManager) {
            console.error('Push manager not supported');
            return;
        }

        // Check for existing subscription
        let subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
            console.log('Existing subscription found:', subscription);
            return; // Already subscribed
        }

        // Subscribe to push notifications
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        console.log('New push subscription:', subscription);

        // Send subscription to server
        const response = await fetch(`${API_URL}/save-subscription`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(subscription)
        });

        if (response.ok) {
            console.log('Subscription saved successfully');
        } else {
            console.error('Failed to save subscription');
        }
    } catch (error) {
        console.error('Error subscribing to push:', error);
        if (error.name === 'AbortError') {
            console.error('Push service error. Make sure you are using HTTPS or localhost.');
        }
    }
}

// Function to request notification permission
async function requestNotificationPermission() {
    try {
        // First check if notifications are supported
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return;
        }

        // Check if service worker is supported
        if (!('serviceWorker' in navigator)) {
            console.log('This browser does not support service workers');
            return;
        }

        // Check if permission is already granted
        if (Notification.permission === 'granted') {
            console.log('Notification permission already granted');
            await subscribeToPush();
            return;
        }

        // Check if permission is denied
        if (Notification.permission === 'denied') {
            console.log('Notification permission denied');
            return;
        }

        // Request permission
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);

        if (permission === 'granted') {
            await subscribeToPush();
        }
    } catch (error) {
        console.error('Error setting up notifications:', error);
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, initializing...');
    displayEvents();
    setupRealtimeSubscription();
    requestNotificationPermission();
}); 