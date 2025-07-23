// live-audio.js

// --- Live Recording Module ---
const LiveAudio = (function() {
  let audioContext;
  let mediaRecorder;
  let audioChunks = [];
  let stream;
  let isRecording = false; // Track recording state

  async function initialize() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm' // Specify MIME type for broader compatibility
      });

      mediaRecorder.addEventListener("dataavailable", event => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); // Specify type here too
        const audioUrl = URL.createObjectURL(audioBlob);
        downloadRecording(audioUrl);
        resetRecording();
      });

      mediaRecorder.addEventListener("start", () => {
        isRecording = true;
      });

      mediaRecorder.addEventListener("inactive", () => {
        isRecording = false;
      });

      mediaRecorder.addEventListener("error", (event) => {
        console.error("MediaRecorder error:", event.error);
        alert("Error during recording: " + event.error);
        resetRecording();
      });

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Error accessing microphone. Please check permissions.");
    }
  }

  function startRecording() {
    if (!mediaRecorder) {
      console.warn("LiveAudio not initialized. Call initialize() first.");
      alert("Please initialize the recorder first.");
      return;
    }
    if (isRecording) {
      console.warn("Already recording.");
      alert("Already recording. Stop the current recording first.");
      return;
    }
    audioChunks = []; // Clear previous chunks
    try {
      mediaRecorder.start();
      console.log("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Error starting recording: " + error);
      resetRecording();
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      console.log("Recording stopped");
    } else {
      console.warn("Not currently recording.");
      alert("Not currently recording.");
    }
  }

  function downloadRecording(audioUrl) {
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = "my-recording.webm";
    a.style.display = "none"; // Hide the link
    document.body.appendChild(a); // Add to the DOM
    a.click();
    document.body.removeChild(a); // Remove from the DOM
    URL.revokeObjectURL(audioUrl); // Release the URL
  }

  function resetRecording() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop()); // Stop the stream
    }
    stream = null;
    mediaRecorder = null;
    audioChunks = [];
    isRecording = false;
  }

  return {
    initialize: initialize,
    startRecording: startRecording,
    stopRecording: stopRecording
  };
})();

export { LiveAudio }; // Export only LiveAudio