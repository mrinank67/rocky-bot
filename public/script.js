const chatContainer = document.getElementById('chat-container');
    const msgInput      = document.getElementById('msg-input');
    const sendBtn       = document.getElementById('send-btn');

    // ----- Suggestion Chips -----
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.getAttribute('data-msg');
        msgInput.value = text;
        sendMessage();
      });
    });

    // ----- Send Message -----
    sendBtn.addEventListener('click', sendMessage);
    msgInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    async function sendMessage() {
      const text = msgInput.value.trim();
      if (!text) return;

      // Exit landing mode on first message
      const appEl = document.getElementById('app');
      if (appEl.classList.contains('landing')) {
        appEl.classList.remove('landing');
      }

      // Remove welcome card if present
      const welcome = document.querySelector('.welcome-card');
      if (welcome) welcome.remove();

      // Append user bubble
      appendMsg('user', text);
      msgInput.value = '';
      setLoading(true);

      // Show typing indicator
      const typingEl = showTypingIndicator();

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
          throw new Error(err.detail || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const reply = data.text;

        // Remove typing indicator
        typingEl.remove();

        // Random duration: mostly 1–2s, occasionally up to 3s
        const durationMs = Math.random() < 0.25
          ? 2000 + Math.random() * 1000   // 25% chance: 2–3s
          : 1000 + Math.random() * 1000;  // 75% chance: 1–2s
        playEridianChords(durationMs);

        // Append Rocky bubble with audio bars
        appendMsg('rocky', reply, durationMs);
      } catch (err) {
        typingEl.remove();
        appendMsg('rocky', `Sad. Error happen, friend: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    // ----- DOM Helpers -----

    function appendMsg(role, text, audioDurationMs) {
      const div = document.createElement('div');
      div.className = `msg ${role}`;

      const label = document.createElement('span');
      label.className = 'msg-label';
      label.textContent = role === 'rocky' ? 'Rocky' : 'You';
      div.appendChild(label);

      const body = document.createElement('span');
      body.innerHTML = formatText(text);
      div.appendChild(body);

      // Show audio bars + speaker replay button
      if (role === 'rocky' && audioDurationMs) {
        const audioRow = document.createElement('div');
        audioRow.className = 'audio-row';

        const bars = createAudioBars();
        bars.classList.add('playing');
        audioRow.appendChild(bars);

        const speakerBtn = createSpeakerBtn(audioDurationMs, bars);
        audioRow.appendChild(speakerBtn);

        div.appendChild(audioRow);

        // After playback, switch bars to idle dots
        setTimeout(() => {
          bars.classList.remove('playing');
          bars.classList.add('idle');
        }, audioDurationMs);
      }

      chatContainer.appendChild(div);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function formatText(text) {
      // Render *actions* in italic
      return text.replace(/\*([^*]+)\*/g, '<em>*$1*</em>');
    }

    function createAudioBars() {
      const wrapper = document.createElement('div');
      wrapper.className = 'audio-bars';
      for (let i = 0; i < 7; i++) {
        const bar = document.createElement('div');
        bar.className = 'bar';
        wrapper.appendChild(bar);
      }
      return wrapper;
    }

    function createSpeakerBtn(durationMs, bars) {
      const btn = document.createElement('button');
      btn.className = 'speaker-btn';
      btn.title = 'Replay Rocky\'s voice';
      btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
      btn.addEventListener('click', () => {
        if (btn.classList.contains('playing')) return;
        btn.classList.add('playing');
        bars.classList.remove('idle');
        bars.classList.add('playing');
        playEridianChords(durationMs);
        setTimeout(() => {
          btn.classList.remove('playing');
          bars.classList.remove('playing');
          bars.classList.add('idle');
        }, durationMs);
      });
      return btn;
    }

    function showTypingIndicator() {
      const div = document.createElement('div');
      div.className = 'msg rocky';
      div.innerHTML = `
        <span class="msg-label">Rocky</span>
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      `;
      chatContainer.appendChild(div);
      chatContainer.scrollTop = chatContainer.scrollHeight;
      return div;
    }

    function setLoading(state) {
      sendBtn.disabled = state;
      msgInput.disabled = state;
      if (!state) msgInput.focus();
    }

    // ================================================================
    // Eridian Chord Synthesizer (Web Audio API)
    // ================================================================

    /**
     * Generate a reverb impulse response buffer (synthetic room reverb).
     * Creates a decaying noise burst to use with ConvolverNode.
     */
    function createReverbImpulse(ctx, duration = 1.5, decay = 2.5) {
      const sampleRate = ctx.sampleRate;
      const length = sampleRate * duration;
      const impulse = ctx.createBuffer(2, length, sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch);
        for (let i = 0; i < length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
      }
      return impulse;
    }

    /**
     * Plays 3 overlapping sine-wave oscillators with:
     *  - Natural volume swells (sine-wave LFO modulation)
     *  - Convolution reverb for spacey depth
     *  - Smooth fade-in / fade-out envelope
     *  - Pitch shifts every 200ms
     *
     * @param {number} durationMs  Total playback time in milliseconds (1–3s).
     */
    function playEridianChords(durationMs) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const t   = ctx.currentTime;
      const dur = durationMs / 1000;

      // --- Master gain with fade-in / fade-out envelope ---
      const masterGain = ctx.createGain();
      const peakVol = 0.22;
      const fadeIn  = Math.min(0.15, dur * 0.1);
      const fadeOut = Math.min(0.5, dur * 0.25);
      masterGain.gain.setValueAtTime(0, t);
      masterGain.gain.linearRampToValueAtTime(peakVol, t + fadeIn);
      masterGain.gain.setValueAtTime(peakVol, t + dur - fadeOut);
      masterGain.gain.linearRampToValueAtTime(0, t + dur);

      // --- Convolution reverb (wet/dry mix) ---
      const convolver = ctx.createConvolver();
      convolver.buffer = createReverbImpulse(ctx, 1.5, 2.5);

      const dryGain = ctx.createGain();
      dryGain.gain.setValueAtTime(0.7, t);

      const wetGain = ctx.createGain();
      wetGain.gain.setValueAtTime(0.35, t);

      // Routing: masterGain → dry → destination
      //          masterGain → convolver → wet → destination
      masterGain.connect(dryGain);
      dryGain.connect(ctx.destination);

      masterGain.connect(convolver);
      convolver.connect(wetGain);
      wetGain.connect(ctx.destination);

      // --- LFO for natural volume breathing ---
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(1.8 + Math.random() * 2.2, t); // 1.8–4 Hz
      lfoGain.gain.setValueAtTime(0.08, t); // subtle ±0.08 modulation
      lfo.connect(lfoGain);
      lfoGain.connect(masterGain.gain);
      lfo.start(t);
      lfo.stop(t + dur + 0.5);

      // --- Three oscillators with harmonic ratios ---
      const ratios = [1, 1.25, 1.5];
      const oscillators = ratios.map((ratio, idx) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        // Slightly different volumes per voice for richness
        gain.gain.setValueAtTime([0.38, 0.30, 0.25][idx], t);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(t);
        osc.stop(t + dur + 0.2);
        return { osc, gain, ratio };
      });

      // --- Pitch shifts every 200ms ---
      const intervalId = setInterval(() => {
        const baseFreq = 220 + Math.random() * 330;  // 220–550 Hz
        oscillators.forEach(({ osc, ratio }) => {
          osc.frequency.setTargetAtTime(baseFreq * ratio, ctx.currentTime, 0.06);
        });
      }, 200);

      // --- Cleanup ---
      setTimeout(() => {
        clearInterval(intervalId);
        ctx.close();
      }, durationMs + 600); // extra 600ms for reverb tail
    }