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
    const posterFile = document.getElementById('poster').files[0];
    const eventLink = document.getElementById('eventLink').value;

    // Validate required fields
    if (!title || !date || !time || !venue || !organizer || !description || !posterFile) {
        showToast('Please fill in all required fields and upload a poster', true);
        return;
    }

    try {
        // Upload image to Supabase Storage
        const fileExt = posterFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `event-posters/${fileName}`;

        console.log('Uploading image to storage...');
        const { data: uploadData, error: uploadError } = await supabaseClient
            .storage
            .from('event-posters')
            .upload(filePath, posterFile);

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            throw uploadError;
        }

        console.log('Getting public URL...');
        const { data: { publicUrl } } = supabaseClient
            .storage
            .from('event-posters')
            .getPublicUrl(filePath);

        const formData = {
            title,
            date,
            time,
            venue,
            organizer,
            description,
            poster_url: publicUrl,
            event_link: eventLink || null
        };

        console.log('Inserting event data:', formData);
        const { data, error } = await supabaseClient
            .from('events')
            .insert([formData])
            .select();

        if (error) {
            console.error('Database insert error:', error);
            showToast(`Error adding event: ${error.message}`, true);
            return;
        }

        // Send notification for the new event
        try {
            const notificationResponse = await fetch('/api/send-event-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event: {
                        title,
                        date,
                        id: data[0].id,
                        poster_url: publicUrl
                    }
                })
            });

            if (!notificationResponse.ok) {
                console.error('Failed to send notification');
            }
        } catch (notificationError) {
            console.error('Error sending notification:', notificationError);
        }

        console.log('Event added successfully:', data);
        showToast('Event added successfully!');
        document.getElementById('eventForm').reset();
        
        // Redirect to home page after 2 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);

    } catch (error) {
        console.error('General error:', error);
        showToast(`Error: ${error.message}`, true);
    }
}); 