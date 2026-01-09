export class Input {
  /**
   * @param {{ canvas: HTMLCanvasElement }} opts
   */
  constructor({ canvas }) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pointerX = null;
    this.pointerActive = false;
    this.pointerY = null;
    this._pointerId = null;
    this._pointerDown = false;
    this._tap = false;
    this._doubleTap = false;
    this._longPress = false;
    this._lastTapAt = 0;
    this._downAt = 0;
    this._downX = 0;
    this._downY = 0;
    this._moved = false;
    this._longPressTimer = null;
    this._peOpts = { passive: false };
    this._touchFallbackEnabled = typeof window !== "undefined" && !("PointerEvent" in window);

    this._onKeyDown = (e) => {
      this.keys.add(e.code);
      // prevent page scrolling with arrows/space when focused
      if (["ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
    };
    this._onKeyUp = (e) => {
      this.keys.delete(e.code);
    };
    this._onBlur = () => {
      this.keys.clear();
      this.pointerActive = false;
    };

    const calcPointer = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * this.canvas.width;
      const y = ((clientY - rect.top) / rect.height) * this.canvas.height;
      return { x, y };
    };

    this._onPointerMove = (e) => {
      if (this._pointerId !== null && e.pointerId !== this._pointerId) return;
      if (e.pointerType === "touch" && e.cancelable) e.preventDefault();
      const p = calcPointer(e.clientX, e.clientY);
      this.pointerX = p.x;
      this.pointerY = p.y;
      this.pointerActive = true;

      const dx = p.x - this._downX;
      const dy = p.y - this._downY;
      if (Math.hypot(dx, dy) > 18) this._moved = true;
    };

    this._onPointerDown = (e) => {
      // capture one active pointer for gestures
      if (this._pointerId !== null && e.pointerId !== this._pointerId) return;
      if (e.pointerType === "touch" && e.cancelable) e.preventDefault();
      this._pointerId = e.pointerId;
      this._pointerDown = true;
      this._downAt = performance.now();
      this._moved = false;

      const p = calcPointer(e.clientX, e.clientY);
      this.pointerX = p.x;
      this.pointerY = p.y;
      this.pointerActive = true;
      this._downX = p.x;
      this._downY = p.y;

      // ensure we keep getting move/up events even if the finger leaves the canvas
      try {
        if (typeof this.canvas.setPointerCapture === "function") this.canvas.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      // focus for keyboard users; harmless on mobile
      this.canvas.focus();

      // long press -> restart
      if (this._longPressTimer) clearTimeout(this._longPressTimer);
      this._longPressTimer = setTimeout(() => {
        if (this._pointerDown && !this._moved) this._longPress = true;
      }, 650);
    };

    this._onPointerUp = (e) => {
      if (this._pointerId !== null && e.pointerId !== this._pointerId) return;
      if (e.pointerType === "touch" && e.cancelable) e.preventDefault();
      this._pointerDown = false;
      if (this._longPressTimer) {
        clearTimeout(this._longPressTimer);
        this._longPressTimer = null;
      }

      const now = performance.now();
      const heldMs = now - this._downAt;
      // tap: quick press without significant movement
      if (!this._moved && heldMs < 300) {
        this._tap = true;
        if (now - this._lastTapAt < 320) this._doubleTap = true;
        this._lastTapAt = now;
      }
      try {
        if (typeof this.canvas.releasePointerCapture === "function") this.canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      this._pointerId = null;
    };

    this._onPointerCancel = () => {
      this._pointerDown = false;
      this._pointerId = null;
      if (this._longPressTimer) {
        clearTimeout(this._longPressTimer);
        this._longPressTimer = null;
      }
    };

    // Touch fallback (for browsers without PointerEvent)
    this._onTouchStart = (e) => {
      if (!e.touches || e.touches.length === 0) return;
      if (e.cancelable) e.preventDefault();
      const t = e.touches[0];
      this._onPointerDown({
        pointerId: 1,
        pointerType: "touch",
        clientX: t.clientX,
        clientY: t.clientY,
        cancelable: false,
      });
    };
    this._onTouchMove = (e) => {
      if (!e.touches || e.touches.length === 0) return;
      if (e.cancelable) e.preventDefault();
      const t = e.touches[0];
      this._onPointerMove({
        pointerId: 1,
        pointerType: "touch",
        clientX: t.clientX,
        clientY: t.clientY,
        cancelable: false,
      });
    };
    this._onTouchEnd = (e) => {
      if (e.cancelable) e.preventDefault();
      this._onPointerUp({
        pointerId: 1,
        pointerType: "touch",
        cancelable: false,
      });
    };
    this._onTouchCancel = (e) => {
      if (e.cancelable) e.preventDefault();
      this._onPointerCancel();
    };

    // Mouse move still works for desktop without a captured pointer.
    this._onMouseMove = (e) => {
      if (this._pointerId !== null) return;
      const p = calcPointer(e.clientX, e.clientY);
      this.pointerX = p.x;
      this.pointerY = p.y;
      this.pointerActive = true;
    };
    this._onMouseLeave = () => {
      if (this._pointerId !== null) return;
      this.pointerActive = false;
    };
  }

  attach() {
    // Use window-level key listeners so desktop keyboard works even if canvas isn't focused.
    window.addEventListener("keydown", this._onKeyDown, { passive: false });
    window.addEventListener("keyup", this._onKeyUp, { passive: true });
    window.addEventListener("blur", this._onBlur);
    this.canvas.addEventListener("mousemove", this._onMouseMove);
    this.canvas.addEventListener("mouseleave", this._onMouseLeave);
    this.canvas.addEventListener("pointerdown", this._onPointerDown, this._peOpts);
    this.canvas.addEventListener("pointermove", this._onPointerMove, this._peOpts);
    this.canvas.addEventListener("pointerup", this._onPointerUp, this._peOpts);
    this.canvas.addEventListener("pointercancel", this._onPointerCancel, this._peOpts);

    if (this._touchFallbackEnabled) {
      this.canvas.addEventListener("touchstart", this._onTouchStart, { passive: false });
      this.canvas.addEventListener("touchmove", this._onTouchMove, { passive: false });
      this.canvas.addEventListener("touchend", this._onTouchEnd, { passive: false });
      this.canvas.addEventListener("touchcancel", this._onTouchCancel, { passive: false });
    }
  }

  detach() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
    window.removeEventListener("blur", this._onBlur);
    this.canvas.removeEventListener("mousemove", this._onMouseMove);
    this.canvas.removeEventListener("mouseleave", this._onMouseLeave);
    this.canvas.removeEventListener("pointerdown", this._onPointerDown);
    this.canvas.removeEventListener("pointermove", this._onPointerMove);
    this.canvas.removeEventListener("pointerup", this._onPointerUp);
    this.canvas.removeEventListener("pointercancel", this._onPointerCancel);

    if (this._touchFallbackEnabled) {
      this.canvas.removeEventListener("touchstart", this._onTouchStart);
      this.canvas.removeEventListener("touchmove", this._onTouchMove);
      this.canvas.removeEventListener("touchend", this._onTouchEnd);
      this.canvas.removeEventListener("touchcancel", this._onTouchCancel);
    }
  }

  isDown(code) {
    return this.keys.has(code);
  }

  consumePointerDown() {
    // "user gesture happened" signal (used to unlock audio)
    // Note: don't clear pointer down state here; just report if a tap/press occurred.
    if (this._tap || this._doubleTap || this._longPress || this._pointerDown) return true;
    return false;
  }

  consumeTap() {
    const v = this._tap;
    this._tap = false;
    return v;
  }

  consumeDoubleTap() {
    const v = this._doubleTap;
    this._doubleTap = false;
    return v;
  }

  consumeLongPress() {
    const v = this._longPress;
    this._longPress = false;
    return v;
  }
}


