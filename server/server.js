const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the mini_projectV2 directory
app.use(express.static(path.join(__dirname, '..')));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Replace with your VAPID keys
webpush.setVapidDetails(
    'mailto:your-email@example.com',
    'BMnJ4cNQXQIG5JINP7m4qpvPEjUm-iX_IXe9KmhQLvmYQZ83W-PCiVlr06Q9bCbb4w9Dh__61B22hcx1B5kiApI',
    'jp9HZG1CSB1XAx6xhAexdyBg_uMQcv-dx_v36VVLx8Q'
);

// Endpoint to save subscription
app.post('/save-subscription', async (req, res) => {
    try {
        console.log('Received subscription request:', req.body);
        const { endpoint, keys } = req.body;
        
        if (!endpoint || !keys) {
            console.error('Invalid subscription data:', req.body);
            return res.status(400).json({ error: 'Invalid subscription data' });
        }

        // Store subscription in Supabase using fetch
        const supabaseResponse = await fetch('https://yxdczmyxvxxuycawuowt.supabase.co/rest/v1/push_subscriptions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZGN6bXl4dnh4dXljYXd1b3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2Mjg3MDAsImV4cCI6MjA2MDIwNDcwMH0.Yv_lPDD3L-Xj1oF-jWeecE8RVHAAAlbxEC9UPVPmgd8',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZGN6bXl4dnh4dXljYXd1b3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2Mjg3MDAsImV4cCI6MjA2MDIwNDcwMH0.Yv_lPDD3L-Xj1oF-jWeecE8RVHAAAlbxEC9UPVPmgd8',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth
            })
        });

        console.log('Supabase response status:', supabaseResponse.status);
        
        if (!supabaseResponse.ok) {
            const errorData = await supabaseResponse.text();
            console.error('Supabase error response:', errorData);
            throw new Error(`Failed to save subscription to Supabase: ${errorData}`);
        }

        res.status(201).json({ message: 'Subscription saved successfully.' });
    } catch (error) {
        console.error('Server error in save-subscription:', error);
        res.status(500).json({ 
            error: error.message,
            details: 'Check server logs for more information'
        });
    }
});

// Endpoint to send a test notification
app.post('/send-notification', async (req, res) => {
    try {
        // Get all subscriptions from Supabase using fetch
        const response = await fetch('https://yxdczmyxvxxuycawuowt.supabase.co/rest/v1/push_subscriptions?select=*', {
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZGN6bXl4dnh4dXljYXd1b3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2Mjg3MDAsImV4cCI6MjA2MDIwNDcwMH0.Yv_lPDD3L-Xj1oF-jWeecE8RVHAAAlbxEC9UPVPmgd8',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZGN6bXl4dnh4dXljYXd1b3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2Mjg3MDAsImV4cCI6MjA2MDIwNDcwMH0.Yv_lPDD3L-Xj1oF-jWeecE8RVHAAAlbxEC9UPVPmgd8'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch subscriptions');
        }

        const subscriptions = await response.json();

    const payload = JSON.stringify({
        title: 'New Event!',
        body: 'A new event was added.',
        icon: '/icon.png',
        url: 'https://your-site.com/'
    });

        // Send notification to all subscriptions
        const notifications = subscriptions.map(subscription => {
            const pushSubscription = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.p256dh,
                    auth: subscription.auth
                }
            };
            return webpush.sendNotification(pushSubscription, payload)
                .catch(error => {
                    console.error('Error sending notification:', error);
                    // If subscription is invalid, remove it from database
                    if (error.statusCode === 410) {
                        return fetch(`https://yxdczmyxvxxuycawuowt.supabase.co/rest/v1/push_subscriptions?endpoint=eq.${subscription.endpoint}`, {
                            method: 'DELETE',
                            headers: {
                                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZGN6bXl4dnh4dXljYXd1b3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2Mjg3MDAsImV4cCI6MjA2MDIwNDcwMH0.Yv_lPDD3L-Xj1oF-jWeecE8RVHAAAlbxEC9UPVPmgd8',
                                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZGN6bXl4dnh4dXljYXd1b3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2Mjg3MDAsImV4cCI6MjA2MDIwNDcwMH0.Yv_lPDD3L-Xj1oF-jWeecE8RVHAAAlbxEC9UPVPmgd8'
                            }
                        });
                    }
                });
        });

        await Promise.all(notifications);
        res.status(200).json({ message: 'Notifications sent successfully.' });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to send notification for new event
app.post('/send-event-notification', async (req, res) => {
    try {
        const { event } = req.body;
        
        // Get all subscriptions from Supabase using fetch
        const response = await fetch('https://yxdczmyxvxxuycawuowt.supabase.co/rest/v1/push_subscriptions?select=*', {
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZGN6bXl4dnh4dXljYXd1b3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2Mjg3MDAsImV4cCI6MjA2MDIwNDcwMH0.Yv_lPDD3L-Xj1oF-jWeecE8RVHAAAlbxEC9UPVPmgd8',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZGN6bXl4dnh4dXljYXd1b3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2Mjg3MDAsImV4cCI6MjA2MDIwNDcwMH0.Yv_lPDD3L-Xj1oF-jWeecE8RVHAAAlbxEC9UPVPmgd8'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch subscriptions');
        }

        const subscriptions = await response.json();

        const payload = JSON.stringify({
            title: 'New Event Added!',
            body: `${event.title} on ${event.date}`,
            icon: event.poster_url || '/icon.png',
            url: `https://your-site.com/event/${event.id}`
        });

        // Send notification to all subscriptions
        const notifications = subscriptions.map(subscription => {
            const pushSubscription = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.p256dh,
                    auth: subscription.auth
                }
            };
            return webpush.sendNotification(pushSubscription, payload)
                .catch(error => {
                    console.error('Error sending notification:', error);
                    // If subscription is invalid, remove it from database
                    if (error.statusCode === 410) {
                        return fetch(`https://yxdczmyxvxxuycawuowt.supabase.co/rest/v1/push_subscriptions?endpoint=eq.${subscription.endpoint}`, {
                            method: 'DELETE',
                            headers: {
                                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZGN6bXl4dnh4dXljYXd1b3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2Mjg3MDAsImV4cCI6MjA2MDIwNDcwMH0.Yv_lPDD3L-Xj1oF-jWeecE8RVHAAAlbxEC9UPVPmgd8',
                                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZGN6bXl4dnh4dXljYXd1b3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2Mjg3MDAsImV4cCI6MjA2MDIwNDcwMH0.Yv_lPDD3L-Xj1oF-jWeecE8RVHAAAlbxEC9UPVPmgd8'
                            }
                        });
                    }
                });
        });

        await Promise.all(notifications);
        res.status(200).json({ message: 'Event notifications sent successfully.' });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Export the app for Vercel
module.exports = app;