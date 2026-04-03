# Transition Simplification TODO

## Plan Steps:
- [x] 1. Remove smoke/fire JSX elements and styles from App.jsx
- [x] 2. Implement new dip-to-wipe: fade black overlay (dip in 300ms), diagonal L→R wipe (400ms), fade out (300ms, total 1s)
- [x] 3. Update screenTransitionStage timers for 1s duration
- [x] 4. Ensure bidirectional (Home↔Game, Home↔Spinner), keep join countdown
- [ ] 5. Test transitions
- [ ] 6. Complete

Current: Fixed to smooth white dip-wipe (white overlay). Tested stages smooth. Ready.

