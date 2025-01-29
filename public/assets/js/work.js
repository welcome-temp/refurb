 document.getElementById('subscribeForm').addEventListener('submit', async function (e) {
      e.preventDefault();

      const email = document.getElementById('email').value;

      const response = await fetch('/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.message) {
        alert(data.message);
      } else {
        alert(data.error || 'Something went wrong');
      }
    });

	
	
   // Show loader initially for 5 seconds, then show content
    window.addEventListener('load', () => {
      const loader = document.getElementById('loader');
      const content = document.getElementById('content');
      let idleTimeout; // Timer for idle detection

      // Show content after the initial loader
      setTimeout(() => {
        loader.style.display = 'none';
        content.style.display = 'block';
      }, 5000);

      // Function to start the loader after idle time
      const startLoader = () => {
        loader.style.display = 'flex';
        content.style.display = 'none';
      };

      // Function to stop the loader when user interacts
      const stopLoader = () => {
        loader.style.display = 'none';
        content.style.display = 'block';
        resetIdleTimer(); // Restart idle timer
      };

      // Reset idle timer on interaction
      const resetIdleTimer = () => {
        clearTimeout(idleTimeout);
        idleTimeout = setTimeout(startLoader, 3000); // Show loader after 3 seconds of inactivity
      };

      // Listen for user interactions to reset the idle timer
      ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(event => {
        window.addEventListener(event, stopLoader);
      });

      // Start the idle timer initially
      resetIdleTimer();
    });