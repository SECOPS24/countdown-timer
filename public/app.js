(function () {
  const $ = (id) => document.getElementById(id);
  const display = $('display');
  const status = $('status');
  const errorEl = $('error');
  const startBtn = $('start');
  const pauseBtn = $('pause');
  const resetBtn = $('reset');
  const targetInput = $('target');
  const dateField = $('date-input');
  const durationField = $('duration-input');

  let remainingMs = 0;   // time left when paused or not yet started
  let endAt = null;      // epoch ms when running
  let tickId = null;

  function pad(n) { return String(n).padStart(2, '0'); }

  function format(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const hms = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    return days > 0 ? `${days}d ${hms}` : hms;
  }

  function currentMs() {
    return endAt !== null ? endAt - Date.now() : remainingMs;
  }

  function render() {
    const ms = currentMs();
    display.textContent = format(ms);
  }

  function setControls(running) {
    startBtn.disabled = running;
    pauseBtn.disabled = !running;
    const inputsLocked = running;
    document.querySelectorAll('#setup input').forEach((el) => { el.disabled = inputsLocked; });
  }

  function tick() {
    const ms = currentMs();
    render();
    if (ms <= 0) {
      stopTicking();
      endAt = null;
      remainingMs = 0;
      setControls(false);
      status.textContent = "Time's up!";
      if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
    }
  }

  function stopTicking() {
    if (tickId !== null) {
      clearInterval(tickId);
      tickId = null;
    }
  }

  function readDurationMs() {
    const h = parseInt($('hours').value, 10) || 0;
    const m = parseInt($('minutes').value, 10) || 0;
    const s = parseInt($('seconds').value, 10) || 0;
    return (h * 3600 + m * 60 + s) * 1000;
  }

  function readTargetMs() {
    if (!targetInput.value) return null;
    const t = new Date(targetInput.value).getTime();
    return Number.isNaN(t) ? null : t;
  }

  function setup() {
    errorEl.textContent = '';
    if (remainingMs > 0 && endAt === null) return true; // resuming from pause

    const mode = document.querySelector('input[name="mode"]:checked').value;
    if (mode === 'date') {
      const t = readTargetMs();
      if (t === null) { errorEl.textContent = 'Pick a target date and time.'; return false; }
      remainingMs = t - Date.now();
      if (remainingMs <= 0) { errorEl.textContent = 'That time is in the past.'; remainingMs = 0; return false; }
    } else {
      remainingMs = readDurationMs();
      if (remainingMs <= 0) { errorEl.textContent = 'Enter a duration greater than zero.'; return false; }
    }
    return true;
  }

  startBtn.addEventListener('click', () => {
    if (!setup()) return;
    endAt = Date.now() + remainingMs;
    remainingMs = 0;
    setControls(true);
    status.textContent = 'Running…';
    render();
    stopTicking();
    tickId = setInterval(tick, 250);
  });

  pauseBtn.addEventListener('click', () => {
    if (endAt === null) return;
    remainingMs = Math.max(0, endAt - Date.now());
    endAt = null;
    stopTicking();
    render();
    setControls(false);
    status.textContent = 'Paused.';
  });

  resetBtn.addEventListener('click', () => {
    stopTicking();
    endAt = null;
    remainingMs = 0;
    setControls(false);
    errorEl.textContent = '';
    display.textContent = '00:00:00';
    status.textContent = 'Set a time to begin.';
  });

  document.querySelectorAll('input[name="mode"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      const isDate = radio.value === 'date' && radio.checked;
      dateField.classList.toggle('hidden', !isDate);
      durationField.classList.toggle('hidden', isDate);
    });
  });
})();
