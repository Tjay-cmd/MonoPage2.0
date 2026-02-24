self.addEventListener("push", (e) => {
  const data = e.data?.json() || {};
  const title = data.title || "New job";
  const options = {
    body: data.body || "View your job board",
    data: { url: data.url || "/" },
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url;
  if (url) {
    e.waitUntil(clients.openWindow(url));
  }
});
