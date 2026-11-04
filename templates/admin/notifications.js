document.addEventListener('DOMContentLoaded', () => {
    const notificationsList = document.getElementById('notificationsList');
    const emptyState = document.getElementById('emptyState');
    const tabBtns = document.querySelectorAll('.tabs .tab-btn');
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    
    let currentFilter = 'all';

    // Format date relative to now
    function timeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " năm trước";
        
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " tháng trước";
        
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " ngày trước";
        
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " giờ trước";
        
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " phút trước";
        
        return "Vừa xong";
    }

    function renderNotifications() {
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        let filtered = notifications;
        
        if (currentFilter === 'unread') {
            filtered = notifications.filter(n => !n.read);
        } else if (currentFilter === 'read') {
            filtered = notifications.filter(n => n.read);
        }

        // Sort by date descending
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        notificationsList.innerHTML = '';

        if (filtered.length === 0) {
            notificationsList.style.display = 'none';
            emptyState.style.display = 'flex';
        } else {
            notificationsList.style.display = 'flex';
            emptyState.style.display = 'none';

            filtered.forEach(notification => {
                const item = document.createElement('div');
                item.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
                item.dataset.id = notification.id;
                
                item.innerHTML = `
                    <div class="notification-icon ${notification.color}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            ${notification.icon}
                        </svg>
                    </div>
                    <div class="notification-content">
                        <div class="notification-header">
                            <h4 class="notification-title">${notification.title}</h4>
                            <span class="notification-time">${timeAgo(notification.date)}</span>
                        </div>
                        <p class="notification-desc">${notification.content}</p>
                    </div>
                    ${!notification.read ? '<div class="notification-unread-dot"></div>' : ''}
                `;
                
                item.addEventListener('click', () => markAsRead(notification.id));
                notificationsList.appendChild(item);
            });
        }
        
        // Update global badge
        if (window.updateNotificationBadge) {
            window.updateNotificationBadge();
        }
    }

    function markAsRead(id) {
        let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        let found = false;
        
        notifications = notifications.map(n => {
            if (n.id === id && !n.read) {
                n.read = true;
                found = true;
            }
            return n;
        });

        if (found) {
            localStorage.setItem('notifications', JSON.stringify(notifications));
            renderNotifications();
        }
    }

    // Tabs filter logic
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            currentFilter = target.dataset.filter;
            renderNotifications();
        });
    });

    // Mark all as read
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', () => {
            let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
            let changed = false;
            
            notifications = notifications.map(n => {
                if (!n.read) {
                    n.read = true;
                    changed = true;
                }
                return n;
            });
            
            if (changed) {
                localStorage.setItem('notifications', JSON.stringify(notifications));
                renderNotifications();
            }
        });
    }

    // Initial render
    renderNotifications();
    
    // Listen for storage changes in other tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'notifications') {
            renderNotifications();
        }
    });
});
