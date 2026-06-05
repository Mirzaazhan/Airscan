# Neck Measurement System Review – Key Fixes

## Critical Issues

### 1. Incorrect Y-axis scaling
Current code uses `videoWidth` for vertical distances:

```js
const dy = (rightIris.y - leftIris.y) * videoWidth;
```

Should be:

```js
const dx = (rightIris.x - leftIris.x) * videoWidth;
const dy = (rightIris.y - leftIris.y) * videoHeight;
```

Using width for Y distorts diagonal/vertical measurements, especially on portrait/mobile cameras.

---

### 2. IPD scaling is unstable
Current scale:

```js
63mm / pixelDist
```

Using iris center-to-center distance (IPD) is sensitive to:

- head yaw
- eye convergence
- face asymmetry
- perspective distortion

**Recommended:** use iris diameter instead.

MediaPipe iris ring landmarks can estimate iris diameter in pixels.

Approximate real iris diameter:

```text
11.7 mm
```

Then:

```text
mmPerPixel = 11.7 / irisDiameterPixels
```

This is more stable than IPD.

---

### 3. Neck width should not be derived from jaw width
Current:

```js
const neckPixelWidth = jawPixelWidth * 0.92;
```

This ratio is unreliable because neck width varies by:

- body fat
- muscle
- sex
- posture
- camera angle

**Recommended:**

Estimate neck directly using:

- shoulder landmarks (Pose)
- contour/silhouette extraction below chin

Fallback to jaw heuristic only if contour detection fails.

---

### 4. Circumference formula assumes circular neck
Current:

```js
circumference = width * Math.PI
```

This assumes neck is a perfect circle.

Human necks are closer to ellipses.

**Recommended:**

```js
const depthMm = widthMm * 0.78;
const a = widthMm / 2;
const b = depthMm / 2;

const circumferenceMm =
  Math.PI *
  (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
```

Produces more realistic circumference estimates.

---

### 5. Missing pose validation
Current system assumes frontal neutral face.

Need to reject measurements when:

- yaw > 10–15°
- roll > 10°
- one iris occluded
- shoulders not visible

Otherwise scale becomes invalid.

---

### 6. No temporal smoothing
Single-frame measurements are noisy.

Add:

- 15–30 frame averaging
- median filtering
- outlier rejection

Improves stability significantly.

---

## Recommended Pipeline

### Scaling
- Use iris diameter (preferred)
- Fallback to IPD if necessary

### Neck Width
- Use neck contour below jaw + shoulder anchors
- Fallback to jaw heuristic only if contour unavailable

### Circumference
- Use ellipse approximation instead of circle

### Quality Gates
Require:

- frontal face
- visible shoulders
- good lighting
- stable frame history
- no occluded iris

---

## Confidence Output

Return confidence with result:

```ts
confidence: "low" | "medium" | "high"
```

Example:

- Credit card reference → High
- Stable iris scaling → Medium
- Jaw proxy fallback → Low

---

## Minimum Production Fixes

### Must Fix
- Use `videoHeight` for Y-axis scaling
- Add pose angle validation
- Replace circular circumference formula
- Add temporal smoothing

### Strongly Recommended
- Switch IPD → iris diameter scaling
- Avoid jaw-only neck proxy

---

## Expected Accuracy

### Current
- Width: moderate
- Circumference: weak

### After improvements
- Width error: ~5–10%
- Circumference error: ~8–15%

---

## Product wording

Avoid saying:

> “accurate neck measurement”

Use:

> “AI-estimated neck sizing”

More technically honest and aligned with webcam-based estimation.
