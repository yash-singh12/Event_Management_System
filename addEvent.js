// Supabase configuration
const SUPABASE_URL = 'https://yxdczmyxvxxuycawuowt.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZGN6bXl4dnh4dXljYXd1b3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2Mjg3MDAsImV4cCI6MjA2MDIwNDcwMH0.Yv_lPDD3L-Xj1oF-jWeecE8RVHAAAlbxEC9UPVPmgd8'

// Initialize Supabase client
const { createClient } = supabase
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Function to show toast notification
function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : 'success'}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Handle form submission
document.getElementById('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form values
    const title = document.getElementById('title').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const venue = document.getElementById('venue').value;
    const organizer = document.getElementById('organizer').value;
    const description = document.getElementById('description').value;

    // Log form data for debugging
    console.log('Form data:', { title, date, time, venue, organizer, description });

    // Validate required fields
    if (!title || !date || !time || !venue || !organizer || !description) {
        showToast('Please fill in all fields', true);
        return;
    }

    const formData = {
        title,
        date,
        time,
        venue,
        organizer,
        description
    };

    try {
        console.log('Attempting to insert event into Supabase...');
        
        const { data, error } = await supabaseClient
            .from('events')
            .insert([formData])
            .select();

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        console.log('Event added successfully:', data);
        showToast('Event added successfully!');
        document.getElementById('eventForm').reset();
        
        // Redirect to home page after 2 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);

    } catch (error) {
        console.error('Error adding event:', error);
        showToast(`Error adding event: ${error.message}`, true);
    }
}); 