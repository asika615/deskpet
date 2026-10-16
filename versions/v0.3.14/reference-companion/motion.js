const f1 = n => Math.round(n * 100) / 100;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (rate, dt) => 1 - Math.exp(-rate * dt);
const bump = u => Math.sin(Math.PI * clamp(u, 0, 1));
const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
const SVGNS = "http://www.w3.org/2000/svg";
function hinge([px, py], a, ty) {
  const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180);
  return (u, v, x, y) => {
    const w = smooth(py - 6, py + 14, y), lx = x - px, ly = y - py;
    return [(lx * c - ly * s - lx) * w, ((lx * s + ly * c - ly) + ty) * w];
  };
}

let badTargetLogged = false;
function spring(k, c, lim = Infinity) {
  return {
    x: 0, v: 0,
    step(target, dt) {
      // a NaN target would stay in x for good, and the warps that read it (hair, tail, skirt) draw nothing
      if (!Number.isFinite(target) || !Number.isFinite(dt)) {
        if (!badTargetLogged) { badTargetLogged = true; console.warn(`[大肥鱼] 弹簧收到的目标不是有限数,这一帧不动:target=${target} dt=${dt}`); }
        return this.x;
      }
      this.v += ((target - this.x) * k - this.v * c) * dt;
      this.x += this.v * dt;
      if (Math.abs(this.x) > lim) { this.x = Math.sign(this.x) * lim; this.v = 0; }
      return this.x;
    },
  };
}


export function motionDriver(model) {
 const PV=model.pivots, S=model.units.S;
  const sp = {
    hair: spring(55, 7, 1.8), hairY: spring(50, 8, 1.2), bangs: spring(110, 10, 1.6),
    skirt: spring(100, 9, 1.6), skirtY: spring(90, 10, 1.1), tail: spring(40, 5, 32), fins: spring(90, 9, 30),
    ahoge: spring(140, 6, 38), head: spring(70, 10, 16), armN: spring(60, 9, 125), armF: spring(60, 9, 95),
  };
  let lastT = null, prevTilt = 0, prevYaw = 0, prevLow = 0, headTilt = 0, fx = '';
  // the kit tips Coo's whole round body to listen, nod, doze or wobble; she keeps her feet on the floor and
  // moves her head instead. Only flight, dragging and the jump's crouch and landing tip the whole group,
  // running keeps half its lean. The shares ease between modes so the group never snaps.
  // dancing sways her mostly as a whole, the rest of the sway goes to the neck
  const GROUP = { air: [1, 1], drag: [1, 1], crouch: [1, 1], land: [1, 1], walk: [1, .5], run: [1, .5], dance: [.6, 0] };
  // the ninja run leans her whole body forward from the soles, in a straight line: bent at the waist instead,
  // the bodice comes away from the skirt and its bow and the tops of the legs show at the waist
  let wTilt = 0, wLean = 0, facing = 1;
  let finMood = 0, tailMood = 0, wagAmp = 0, sitK = 0, walkK = 0, runK = 0;
  const groupTilt = (mode, tilt, lean) => tilt * wTilt + lean * wLean + runK * 14 * facing;
  const st = { z: {}, alpha: {} };

  // fins and tail by face: fins up (+) or drooping (-), tail wag size
  const MOOD = {
    happy: [.8, 1], love: [.9, 1], wink: [.5, .7], surprised: [1, .2], angry: [.9, .15], sad: [-1, 0], shy: [-.5, .3],
    sleepy: [-.7, 0], sleep: [-.9, 0], dizzy: [-.3, 0], dragged: [.6, .6], content: [-.2, .25], listening: [.6, .2],
    thinking: [.1, .15], run: [.2, .4], waking: [-.4, 0], squeeze: [-.3, 0], neutral: [0, .25],
    smug: [.5, .6], pout: [.3, 0], worried: [-.3, .1], determined: [.9, .3], flustered: [.4, .8], scared: [-1, 0],
    excited: [1, 1], cry: [-1, 0], confused: [.2, .1], bowing: [-.2, .2],
  };
  const HEAD_TILT = { shy: 7, thinking: -8, smug: -6, pout: -4, confused: -7, worried: 3, cry: 4 };
  const HEAD_PITCH = { sad: .35, cry: .45, worried: .15 };

 return { groupTilt, update(fc,o) {
    const t = o.t, dt = lastT == null ? 1 / 60 : clamp(t - lastT, 0, .05);
    lastT = t;
    const mode = o.mode || 'idle', face = o.face || 'neutral';
    facing = Math.sign(o.facing || 1);
    const walking = mode === 'walk' || mode === 'run', held = mode === 'drag', airborne = mode === 'air';

    /* body: the kit's `low` is how far the hips sink (sitting, the walk's bob), in these units */
    sitK = lerp(sitK, clamp(o.sit ?? 0, 0, 1), ease(12, dt));
    const low = o.low || 0;
    const lowV = (low - prevLow) / Math.max(dt, 1e-3); prevLow = low;
    const breath = Math.sin(t * (mode === 'sleep' ? 1.7 : 2.4));

    /* head: tilt toward what it looks at, nod with sleep, wobble with dizzy */
    let tiltT = o.look[0] * .7 + Math.sin(t * .9) * 1.2 + o.look[1] * .4;
    if (mode === 'sleep') tiltT += 6;
    tiltT += HEAD_TILT[face] || 0;
    if (face === 'dizzy') tiltT += 3 * Math.sin(t * 4.5);
    if (held) tiltT += o.swing * .25;
    headTilt = sp.head.step(tiltT, dt);
    // what the kit meant for the whole body and the group did not take goes to the neck (forward +)
    const [gT, gL] = GROUP[mode] || [0, 0];
    const bend = (o.tilt ?? 0) * (1 - wTilt) + (o.lean ?? 0) * Math.sign(o.facing || 1) * (1 - wLean);
    wTilt = lerp(wTilt, gT, ease(10, dt)); wLean = lerp(wLean, gL, ease(10, dt));
    // the kit's short gestures, as she does them. Nod, shake, wave and bow are hers alone (see `gestures`):
    // a nod pitches the face down twice (angleY +) and dips the head forward, a shake turns the face from side
    // to side (angleX) under a slight roll; both die away by the end. The rest add to what the kit does.
    const g = o.gesture, gk = g ? g.k : 0;
    const env = (a, b) => smooth(0, a, gk) * (1 - smooth(b, 1, gk));
    const nod = g?.kind === 'nod' ? Math.sin(gk * Math.PI * 2) ** 2 * (1 - .3 * gk) : 0;
    const shake = g?.kind === 'shake' ? Math.sin(gk * Math.PI * 6) * smooth(0, .12, gk) * (1 - gk) : 0;
    const wave = g?.kind === 'wave' ? env(.15, .8) : 0;      // the near arm up beside her head, waving
    const bow = g?.kind === 'bow' ? env(.25, .7) : 0;        // the upper body tips forward about the waist
    const shiver = g?.kind === 'shiver' ? env(.08, .85) : 0; // arms hugged in, trembling, fins down
    const flap = g?.kind === 'flap' ? env(.05, .75) : 0;     // fins, tail, ahoge and arms all flutter
    const gNeck = nod * 7 + shake * 2.5 + bow * 10 + wave * 4, gYaw = shake * 1.1;
    const headA = headTilt + gNeck;
    const tiltVel = (headA - prevTilt) / Math.max(dt, 1e-3); prevTilt = headA;
    const yawVel = (gYaw - prevYaw) / Math.max(dt, 1e-3); prevYaw = gYaw;
    const angleX = clamp(clamp(o.look[0] / 5, -1, 1) * .9 + gYaw, -1.4, 1.4);
    // angleY + pitches the face down (the features slide down, more crown shows), as a gaze down (look[1] +) does
    const angleY = clamp(clamp(o.look[1] / 4, -1, 1) * .7 + (mode === 'sleep' ? .8 : 0) + (HEAD_PITCH[face] || 0) + nod * .9 + bow * .5, -1.4, 1.4);

    /* springs */
    const sway = clamp(o.swing / 26, -1.6, 1.6);
    const up = airborne || held ? 1 : 0;
    const hair = sp.hair.step(sway * 1.1 - tiltVel * .004 - yawVel * .02 + (walking ? -.25 : 0) - runK * .5, dt);
    const hairY = sp.hairY.step(up * -1 + lowV * .006, dt);
    const bangs = sp.bangs.step(sway * .7 - tiltVel * .004 - yawVel * .03, dt);
    const skirt = sp.skirt.step(sway * .8 + (walking ? -.2 : 0), dt);
    const flare = sp.skirtY.step(up * .8 + sitK * .6 + clamp(-lowV * .01, -.3, .6), dt);
    const [fm, wg] = MOOD[face] || MOOD.neutral;
    finMood = lerp(finMood, lerp(fm, -.6, shiver), ease(6, dt));
    wagAmp = lerp(wagAmp, wg, ease(3, dt));
    tailMood = lerp(tailMood, mode === 'sleep' || face === 'sad' || face === 'cry' || face === 'scared' ? -1 : 0, ease(3, dt));
    // fast flutters go on after the springs, which would smooth them away
    const fins = sp.fins.step(finMood * 14 + sway * 10, dt) + (face === 'angry' ? 2.5 * Math.sin(t * 40) : 0) + flap * 13 * Math.sin(t * 26);
    const ahoge = sp.ahoge.step(-tiltVel * .12 - yawVel * .5 + sway * 18 + (face === 'surprised' ? -16 : 0) + (face === 'confused' ? 20 : 0) + (mode === 'sleep' ? 22 : 0) - hairY * 12, dt)
      + flap * 12 * Math.sin(t * 19);
    const tail = sp.tail.step(sway * 14 + tailMood * 12, dt) + wagAmp * 13 * Math.sin(t * (4 + 5 * wagAmp)) + Math.sin(t * 1.3) * 3
      + flap * 14 * Math.sin(t * 17);

    /* legs: the kit hands hip→foot segments sized for Coo; keep their angle (forward = foot to the right) */
    const legA = o.legs.map(l => -Math.atan2(l[2] - l[0], Math.max(4, l[3] - l[1])) * 180 / Math.PI);
    const lift = o.legs.map(l => clamp(29 - Math.hypot(l[2] - l[0], l[3] - l[1]), -8, 20));
    // sitting swaps the lower body for its own drawing (skirt spread on the floor, legs forward) in a
    // couple of frames halfway down, under a little squash; a long crossfade would show both skirts at once
    const sitIn = smooth(.44, .54, sitK), plop = Math.sin(Math.PI * smooth(.3, .8, sitK));

    /* arms: swing against the legs when walking, out in the air, flailing when held */
    // running is a ninja run: both arms swept straight back, the whole body leaning forward (groupTilt)
    walkK = lerp(walkK, walking ? 1 : 0, ease(8, dt));
    runK = lerp(runK, mode === 'run' ? 1 : 0, ease(7, dt));
    let aN = 0, aF = 0;
    if (walking) { aN = -legA[0] * 1.3 + 4; aF = -legA[1] * 1.3 - 2; }
    if (airborne) { aN = 40; aF = -30; }
    if (held) { aN = 70 + 16 * Math.sin(t * 13); aF = -45 - 12 * Math.sin(t * 13 + 1.3); }
    if (sitK > .5 && !walking) { aN = lerp(aN, -4, sitK); aF = lerp(aF, -6, sitK); }
    if (face === 'happy' || face === 'love') { aN += 12 + 5 * Math.sin(t * 8); aF -= 8 + 4 * Math.sin(t * 8); }
    if (face === 'angry') { aN = 20 + 3 * Math.sin(t * 30); aF = -18 - 3 * Math.sin(t * 30); }
    if (face === 'determined') { aN = 14; aF = -10; }
    if (face === 'excited') { aN += 18; aF -= 12; }
    if (mode === 'dance') { const b = Math.sin((o.modeT || 0) * Math.PI * 2 * 1.1); aN = 16 + 24 * Math.max(0, b); aF = -8 - 22 * Math.max(0, -b); }
    if (runK > .001) { aN = lerp(aN, 38, runK); aF = lerp(aF, 32, runK); }
    if (wave && !model.armArticulation) aN = lerp(aN, 108, wave);
    if (shiver) { aN = lerp(aN, -10, shiver); aF = lerp(aF, 8, shiver); }
    const armN = sp.armN.step(aN, dt) + (model.armArticulation ? 0 : wave) * 13 * Math.sin(t * 15) + shiver * 1.4 * Math.sin(t * 47) + flap * 9 * Math.sin(t * 24);
    const armF = sp.armF.step(aF, dt) - shiver * 1.2 * Math.sin(t * 43 + 1) - flap * 9 * Math.sin(t * 24 + 1);

    /* deformer states */
    // the kit sinks the hips 29 when seated; the sitting drawing's lowest point is 19.4 above the soles
    st.body = { a: -sway * 1.2 + (held ? o.swing * .15 : 0), ty: low - 9.6 * sitK, sx: (1 + .006 * breath + .04 * plop) * (1 - .03 * shiver), sy: 1 - .012 * breath - .06 * plop };
    st.waist = { a: bow * 20 };
    st.skirt = {
      fn: (u, v) => {
        const k = v * v;
        // on the way down the hem spreads a little before the sitting skirt takes over
        return [skirt * 4 * k + flare * (u - .45) * 9 * v + sitK * (u - .45) * 10 * v, -flare * k * 3 - sitK * k * 8];
      },
    };
    // the sitting skirt breathes a little at its hem, and its front edge swings with the body
    st.skirtSit = { fn: (u, v) => [skirt * 1.5 * v * v, -Math.max(0, breath) * .4 * v] };
    st.alpha.skirt = st.alpha.waist_bow_front = 1 - sitIn;
    st.alpha.leg_back = st.alpha.leg_front = 1 - smooth(.42, .52, sitK);
    st.alpha.skirt_sit = st.alpha.waist_bow_sit_front = sitIn;
    st.armNear = { a: armN };
    st.armFar = { a: armF };
    // the far arm's cuff layer sits over the bodice; swept back, the arm is behind her and so is the cuff
    st.alpha.arm_far_end_front = 1 - smooth(12, 30, armF);
    // These are complete hip-to-boot drawings. Rigid hip rotation avoids the mesh folds that looked
    // like extra legs when the original nonlinear hinge crossed its own triangles during a fast run.
    const legScale = mode === 'run' ? .68 : .58;
    st.legBack = { a: clamp(legA[0] * legScale, -34, 34) };
    st.legFront = { a: clamp(legA[1] * legScale, -34, 34) };
    st.tail = { a: tail * .5 - 7 * sitK };
    st.tailBend = { fn: u => [0, -tail * .5 * u * u] };
    // the head stays up while she leans forward for the ninja run
    st.neck = { a: headA + clamp(bend * .8, -10, 12) - runK * 12, ty: (mode === 'sleep' ? 2.5 : 0) + breath * .35 };
    const parallax = (k, ky) => (u, v) => [angleX * k * bump(u) * (.4 + .6 * bump(v)), angleY * ky * bump(v) * (.4 + .6 * bump(u))];
    st.headFront = { fn: parallax(4.2, 2.8) };
    // the eyes and mouth move with the face: the eyes' outline is shared between the two layers
    st.headFeat = { fn: parallax(2, 1.4) };
    st.headMid = { fn: parallax(2, 1.4) };
    st.headBack = { fn: parallax(-1.4, -1) };
    // the long hair hangs from the head but its lower half keeps to the body when the head tilts
    const nk = PV.neck, na = headA * Math.PI / 180;
    st.hairSway = {
      fn: (u, v, x, y) => {
        const w = smooth(.3, .8, v), a = -na * w, c = Math.cos(a), s = Math.sin(a);
        const dx = x - nk[0], dy = y - nk[1];
        const wv = Math.pow(v, 1.6);
        return [nk[0] + dx * c - dy * s - x + hair * 8 * wv + Math.sin(t * 1.6 + v * 3) * wv,
          nk[1] + dx * s + dy * c - y + hairY * 12 * wv * wv - Math.abs(hair) * 1.5 * wv];
      },
    };
    st.bangsSway = { fn: (u, v) => [bangs * 3.2 * v * v + Math.sin(t * 1.9 + u * 2) * .5 * v * v, hairY * 3 * v * v] };
    st.ahoge = { a: ahoge * .5 + Math.sin(t * 2.1) * 2 };
    st.finNear = { a: fins + Math.sin(t * 1.4) * 1.5 };
    st.finFar = { a: -fins * .8 - Math.sin(t * 1.4) * 1.2 };


 return {st,dt,sitK,angleX,angleY,breath,headA,hair,hairY,bangs,armN,armF,tail,fins};
 }, reset() {for (const k in sp) { sp[k].x=0;sp[k].v=0;} lastT=null;prevTilt=prevYaw=prevLow=headTilt=wTilt=wLean=finMood=tailMood=wagAmp=sitK=walkK=runK=0; } };
}
