// state.js
const states = {
  script: "idle",
  artwork: "idle",
  tts: "idle",
};

export function getServiceStates() {
  return states;
}

export function updateServiceState(name, newState) {
  if (states[name]) states[name] = newState;
}
