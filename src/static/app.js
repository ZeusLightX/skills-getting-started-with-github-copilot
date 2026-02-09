document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHtml = (details.participants && details.participants.length > 0)
          ? `<div class="participants"><strong>Participants</strong><ul>${details.participants
            .map((p) => `<li><span class="participant-email">${p}</span><button class="remove-participant" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(p)}" aria-label="Remove ${p}">×</button></li>`)
            .join("")}</ul></div>`
          : `<div class="participants empty"><em>No participants yet</em></div>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      // disable submit while request is in flight
      const submitBtn = signupForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to reflect new participant immediately
        await fetchActivities();
        // re-enable submit
        if (submitBtn) submitBtn.disabled = false;
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
        if (submitBtn) submitBtn.disabled = false;
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Delegate click for remove participant buttons
  activitiesList.addEventListener("click", async (e) => {
    const btn = e.target.closest && e.target.closest(".remove-participant");
    if (!btn) return;

    const activity = decodeURIComponent(btn.dataset.activity || "");
    const email = decodeURIComponent(btn.dataset.email || "");

    if (!activity || !email) return;

    if (!confirm(`Unregister ${email} from ${activity}?`)) return;

    try {
      // disable the button while processing
      btn.disabled = true;
      const response = await fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        messageDiv.classList.remove("hidden");
        // Refresh list and re-enable button after
        await fetchActivities();
        setTimeout(() => messageDiv.classList.add("hidden"), 4000);
      } else {
        messageDiv.textContent = result.detail || "Failed to unregister";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
        btn.disabled = false;
      }
    } catch (err) {
      console.error("Error unregistering:", err);
      messageDiv.textContent = "Failed to unregister. Try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      btn.disabled = false;
    }
  });

  // Initialize app
  fetchActivities();
});
