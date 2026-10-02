import assert from 'node:assert/strict';
import { POST } from './src/api/notes/generate/route.ts';
import { calculateGazeAngles, FocusTracker } from './src/lib/vision/focusTracker.ts';
import { mockStudyNotes } from './src/lib/mocks/guardianMocks.ts';
import { useFocusSession } from './src/hooks/useFocusSession.ts';

async function testApiRouteMockPath() {
  console.log('--- Testing API Route Mock Path ---');
  process.env.USE_MOCK_AI = 'true';

  const req = new Request('http://localhost:3000/api/notes/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcriptText: 'Today we discuss distributed consensus, leader election, and Raft invariants.',
      lectureTitle: 'CS 6824: Distributed Systems',
    }),
  });

  const start = Date.now();
  const res = await POST(req);
  const elapsed = Date.now() - start;

  assert.equal(res.status, 200, `Expected status 200, got ${res.status}`);
  const data = await res.json();

  console.log(`Response received in ${elapsed}ms:`, data.sourceTitle);
  assert(elapsed >= 750, `Expected artificial latency >= 750ms, took ${elapsed}ms`);

  // Verify exact StudyNote schema fields
  assert.equal(typeof data.id, 'string');
  assert.equal(data.sourceTitle, 'CS 6824: Distributed Systems');
  assert(Array.isArray(data.keyTakeaways) && data.keyTakeaways.length > 0);
  assert.equal(typeof data.summary, 'string');
  assert('handwrittenRenderUrl' in data);
  assert.equal(typeof data.createdAt, 'string');

  console.log('✓ API route returns HTTP 200 with exact StudyNote shape on mock path');
}

async function testApiRouteValidation() {
  console.log('--- Testing API Route Validation ---');
  const badReq = new Request('http://localhost:3000/api/notes/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lectureTitle: 'Missing Transcript',
    }),
  });

  const res = await POST(badReq);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert(data.error);
  console.log('✓ API route returns HTTP 400 on invalid payload');
}

function createSyntheticLandmarks(yawOffset = 0, pitchOffset = 0) {
  const landmarks = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));

  // Forehead: 10
  landmarks[10] = { x: 0.5, y: 0.2, z: -pitchOffset * 0.01 };
  // Chin: 152
  landmarks[152] = { x: 0.5, y: 0.8, z: pitchOffset * 0.01 };
  // Left eye outer: 33
  landmarks[33] = { x: 0.35, y: 0.35, z: -yawOffset * 0.01 };
  // Right eye outer: 263
  landmarks[263] = { x: 0.65, y: 0.35, z: yawOffset * 0.01 };
  // Nose tip: 1
  landmarks[1] = { x: 0.5 + (yawOffset * 0.005), y: 0.5 + (pitchOffset * 0.005), z: 0 };

  return landmarks;
}

function testGazeCalculations() {
  console.log('--- Testing Gaze / Pitch / Yaw Calculations ---');

  // Centered face
  const centered = calculateGazeAngles(createSyntheticLandmarks(0, 0));
  assert(!centered.isLookingAway, 'Centered face should not be looking away');
  assert(!centered.isLookingDown, 'Centered face should not be looking down');
  assert(!centered.isGazeAway, 'Centered face gaze should not be away');

  // Head turned away horizontally (yaw > 25)
  const turned = calculateGazeAngles(createSyntheticLandmarks(60, 0));
  assert(turned.isLookingAway, 'Turned face should trigger isLookingAway');
  assert(turned.isGazeAway, 'Turned face should trigger isGazeAway');

  // Head tilted down (pitch > 20)
  const tiltedDown = calculateGazeAngles(createSyntheticLandmarks(0, 60));
  assert(tiltedDown.isLookingDown, 'Tilted head should trigger isLookingDown');
  assert(tiltedDown.isGazeAway, 'Tilted head should trigger isGazeAway');

  console.log('✓ Gaze angle calculations passed');
}

function testFocusTrackerStateMachine() {
  console.log('--- Testing FocusTracker State Machine ---');
  let distractionTriggeredReason: string | null = null;
  let focusRestoredCount = 0;

  const tracker = new FocusTracker({
    absenceThresholdMs: 3000,
    gazeAwayThresholdMs: 2500,
    onDistraction: (r) => {
      distractionTriggeredReason = r;
    },
    onFocusRestored: () => {
      focusRestoredCount++;
    },
  });

  // Frame 1: t=0, no face
  let res = tracker.processFrame(null, 0);
  assert.equal(res.status, 'active');
  assert.equal(res.distractionCount, 0);

  // Frame 2: t=2000, no face (< 3000ms threshold)
  res = tracker.processFrame(null, 2000);
  assert.equal(res.status, 'active');
  assert.equal(res.distractionCount, 0);

  // Frame 3: t=3100, no face (> 3000ms threshold) -> triggers absent distraction
  res = tracker.processFrame(null, 3100);
  assert.equal(res.status, 'distracted');
  assert.equal(res.lastDistractionReason, 'absent');
  assert.equal(res.distractionCount, 1);
  assert.equal(distractionTriggeredReason, 'absent');

  // Mock distraction trigger
  const mockRes = tracker.triggerMockDistraction('phone_detected');
  assert.equal(mockRes.status, 'distracted');
  assert.equal(mockRes.lastDistractionReason, 'phone_detected');
  assert.equal(mockRes.distractionCount, 2);

  console.log('✓ FocusTracker temporal tracking and state transitions passed');
}

function testUseFocusSessionExports() {
  console.log('--- Testing useFocusSession Export Contract ---');
  assert.equal(typeof useFocusSession, 'function', 'useFocusSession should be a function');
  console.log('✓ useFocusSession exported as function');
}

async function main() {
  try {
    await testApiRouteMockPath();
    await testApiRouteValidation();
    testGazeCalculations();
    testFocusTrackerStateMachine();
    testUseFocusSessionExports();
    console.log('\n=== ALL PHASE 2 TESTS PASSED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

main();
