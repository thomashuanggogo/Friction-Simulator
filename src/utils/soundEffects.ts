// Procedural Web Audio API sound effects for friction physics

class SoundManager {
  private ctx: AudioContext | null = null;
  private scrapeOsc: OscillatorNode | null = null;
  private scrapeGain: GainNode | null = null;
  private scrapeFilter: BiquadFilterNode | null = null;
  private enabled: boolean = true;
  private isScraping: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (!val) {
      this.stopScraping();
    }
  }

  public isSoundEnabled() {
    return this.enabled;
  }

  public playBreakSound() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // AudioContext blocked or not allowed
    }
  }

  public playLatchSound() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // AudioContext blocked
    }
  }

  public updateMotionScrape(velocity: number, isSliding: boolean) {
    if (!this.enabled || !isSliding || Math.abs(velocity) < 0.02) {
      this.stopScraping();
      return;
    }

    this.initCtx();
    if (!this.ctx) return;

    const speed = Math.min(Math.abs(velocity), 10);
    const targetVolume = Math.min(0.12, 0.02 + speed * 0.02);
    const targetFreq = 180 + Math.min(speed * 120, 600);

    if (!this.isScraping) {
      try {
        this.scrapeOsc = this.ctx.createOscillator();
        this.scrapeGain = this.ctx.createGain();
        this.scrapeFilter = this.ctx.createBiquadFilter();

        this.scrapeOsc.type = 'sawtooth';
        this.scrapeFilter.type = 'bandpass';
        this.scrapeFilter.frequency.setValueAtTime(targetFreq, this.ctx.currentTime);
        this.scrapeFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

        this.scrapeGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        this.scrapeGain.gain.linearRampToValueAtTime(targetVolume, this.ctx.currentTime + 0.05);

        this.scrapeOsc.connect(this.scrapeFilter);
        this.scrapeFilter.connect(this.scrapeGain);
        this.scrapeGain.connect(this.ctx.destination);

        this.scrapeOsc.start();
        this.isScraping = true;
      } catch {
        // failed
      }
    } else if (this.scrapeFilter && this.scrapeGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.scrapeFilter.frequency.setTargetAtTime(targetFreq, now, 0.05);
      this.scrapeGain.gain.setTargetAtTime(targetVolume, now, 0.05);
    }
  }

  public stopScraping() {
    if (this.isScraping && this.scrapeGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.scrapeGain.gain.linearRampToValueAtTime(0.001, now + 0.05);
        setTimeout(() => {
          if (this.scrapeOsc) {
            try {
              this.scrapeOsc.stop();
              this.scrapeOsc.disconnect();
            } catch {}
            this.scrapeOsc = null;
          }
        }, 60);
      } catch {}
    }
    this.isScraping = false;
  }
}

export const soundManager = new SoundManager();
