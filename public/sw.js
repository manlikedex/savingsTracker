self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};

  event.waitUntil(
    self.registration.showNotification(data.title || "Savings Tracker", {
      body: data.body || "Time to update your savings.",
      icon: "/icon.svg",
      badge: "/icon.svg",
    })
  );
});