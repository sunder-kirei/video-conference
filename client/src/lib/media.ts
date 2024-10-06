export async function fetchDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const audioDevices: MediaDeviceInfo[] = [];
  const videoDevices: MediaDeviceInfo[] = [];

  devices.forEach((device) => {
    if (device.kind === "audioinput") audioDevices.push(device);
    if (device.kind === "videoinput") videoDevices.push(device);
  });
  return { audioDevices, videoDevices };
}

export async function fetchPermissions() {
  const camera = await navigator.permissions.query({
    // @ts-expect-error property not in doc
    name: "camera",
  });
  const microphone = await navigator.permissions.query({
    // @ts-expect-error property not in doc
    name: "microphone",
  });
  return {
    camera: camera.state === "granted",
    microphone: microphone.state === "granted",
  };
}
