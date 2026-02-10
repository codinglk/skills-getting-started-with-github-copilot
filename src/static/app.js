document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to unregister a participant
  async function unregisterParticipant(activityName, email, liElement, availabilityEl) {
    try {
      const resp = await fetch(
        `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await resp.json();
      if (!resp.ok) {
        messageDiv.textContent = result.detail || "Failed to unregister participant.";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
        setTimeout(() => messageDiv.classList.add("hidden"), 4000);
        return;
      }

      // Remove the participant element from the list
      if (liElement && liElement.parentElement) {
        liElement.parentElement.removeChild(liElement);
      }

      // Update availability text if provided
      if (availabilityEl) {
        const partsText = availabilityEl.dataset.count ? parseInt(availabilityEl.dataset.count, 10) - 1 : null;
        // Recompute from DOM if possible
        const ul = availabilityEl.closest('.participants-section').querySelector('ul');
        const remaining = ul ? Math.max(0, parseInt(availabilityEl.dataset.max || '0', 10) - ul.querySelectorAll('li.participant-item').length) : null;
        if (remaining !== null) {
          availabilityEl.textContent = `${remaining} spots left`;
        }
      }

      // Optionally show a brief success message
      messageDiv.textContent = result.message || `${email} unregistered from ${activityName}`;
      messageDiv.className = "success";
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 3000);
    } catch (err) {
      console.error("Error unregistering:", err);
      messageDiv.textContent = "Network error while unregistering.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 4000);
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="availability" data-max="${details.max_participants}">${spotsLeft} spots left</span></p>
          <div class="participants-section">
            <strong>Current Participants:</strong>
            <ul class="participants-list"></ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Populate participants list with delete buttons
        const ul = activityCard.querySelector('.participants-list');
        if (details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement('li');
            li.className = 'participant-item';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = p;

            const btn = document.createElement('button');
            btn.className = 'delete-btn';
            btn.title = `Unregister ${p}`;
            btn.innerHTML = '✖';
            btn.addEventListener('click', () => {
              const availabilityEl = activityCard.querySelector('.availability');
              unregisterParticipant(name, p, li, availabilityEl);
            });

            li.appendChild(nameSpan);
            li.appendChild(btn);
            ul.appendChild(li);
          });
        } else {
          const li = document.createElement('li');
          li.className = 'no-participants';
          li.textContent = 'No participants yet';
          ul.appendChild(li);
        }

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
        // Refresh activities to show new participant
        activitiesList.innerHTML = '<p>Loading activities...</p>';
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
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

  // Initialize app
  fetchActivities();
});
