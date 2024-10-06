import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchDevices, fetchPermissions } from "../../lib/media";
import { MediaInfo, MediaState, RootState } from "../../types";

export const initThunk = createAsyncThunk("init", async () => {
  // will only handle init now
  const { camera, microphone } = await fetchPermissions();
  const { audioDevices, videoDevices } = await fetchDevices();

  return { audioDevices, videoDevices, camera, microphone };
});

const createCanvas = () => {
  const width = 640;
  const height = 480;
  const canvas = document.createElement("canvas") as HTMLCanvasElement;
  canvas.width = width;
  canvas.height = height;
  canvas.id = "black__placeholder";
  canvas.getContext("2d")?.fillRect(0, 0, width, height);

  return canvas;
};

export const handleDeviceChange = createAsyncThunk(
  "devicechange",
  async (_, thunkApi) => {
    const state = (thunkApi.getState() as RootState).media;

    const { audioDevices, videoDevices } = await fetchDevices();

    if (state.audio.availableDevices.length !== audioDevices.length) {
      const prevDevice = audioDevices.find(
        (device) => device.deviceId === state.audio.selectedDevice?.deviceId,
      );

      if (!prevDevice) {
        await thunkApi.dispatch(toggleTracks("audio"));
      }
    } else {
      const prevDevice = videoDevices.find(
        (device) => device.deviceId === state.video.selectedDevice?.deviceId,
      );

      if (!prevDevice) {
        await thunkApi.dispatch(toggleTracks("video"));
      }
    }

    return { audioDevices, videoDevices };
  },
);

export const handlePermissionChange = createAsyncThunk(
  "permissionchange",
  async (type: "audio" | "video", thunkApi) => {
    const { camera, microphone } = await fetchPermissions();

    // remove tracks if permission denied or prompt
    if (!camera) {
      await thunkApi.dispatch(toggleTracks("video"));
    }
    if (!microphone) {
      await thunkApi.dispatch(toggleTracks("audio"));
    }

    const { audioDevices, videoDevices } = await fetchDevices();
    return { audioDevices, videoDevices, camera, microphone };
  },
);

export const addTrack = createAsyncThunk(
  "addtrack",
  async (type: "audio" | "video", thunkApi) => {
    const state = (thunkApi.getState() as RootState).media;

    if (!state[type].enabled && state[type].availableDevices.length) {
      // add tracks
      const stream = await navigator.mediaDevices.getUserMedia({
        [type]: {
          deviceId: state[type].selectedDevice?.deviceId,
        },
      });

      // cannot alter state in thunk must do so in extraReducer
      return stream;
    }
  },
);

export const toggleTracks = createAsyncThunk(
  "toggletrack",
  async (type: "audio" | "video", thunkApi) => {
    const state = (thunkApi.getState() as RootState).media;

    if (state[type].enabled) {
      // remove tracks
      const tracks = state.stream.getTracks().filter((track) => {
        return track.kind === type;
      });

      if (tracks[0]?.enabled) return tracks;

      if (state[type].availableDevices.length === 0) return [];

      const newTracks = (
        await navigator.mediaDevices.getUserMedia({
          [type]: {
            deviceId: state[type].selectedDevice?.deviceId,
          },
        })
      )
        .getTracks()
        .filter((track) => track.kind === type);

      newTracks.forEach((track) => (track.enabled = false));
      return newTracks;
    }
    return [];
  },
);

const initialState = {
  availableDevices: [],
  selectedDevice: null,
  enabled: false,
  streamEnabled: false,
  hasPermission: false,
} as MediaInfo;

const slice = createSlice({
  name: "media",
  initialState: {
    video: initialState,
    audio: initialState,
    stream: new MediaStream(),
    rtc: null,
  } as MediaState,
  reducers: {
    createRTC: (state, action) => {
      state.rtc = action.payload;

      const black = createCanvas().captureStream(1);
      black.getVideoTracks()[0].enabled = false;
      state.stream.addTrack(black.getVideoTracks()[0]);
      state.rtc?.initRTC();
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initThunk.fulfilled, (state, action) => {
      const { audioDevices, videoDevices, camera, microphone } = action.payload;

      // availableDevices tells if hardware is available or not
      state.audio.availableDevices = audioDevices;
      state.audio.hasPermission = microphone;
      state.video.availableDevices = videoDevices;
      state.video.hasPermission = camera;

      // select a device for later streaming
      if (camera && state.video.availableDevices.length > 0)
        state.video.selectedDevice = state.video.availableDevices[0];
      if (microphone && state.audio.availableDevices.length > 0)
        state.audio.selectedDevice = state.audio.availableDevices[0];
    });

    builder.addCase(handleDeviceChange.fulfilled, (state, action) => {
      const { audioDevices, videoDevices } = action.payload;

      state.audio.availableDevices = audioDevices;
      state.video.availableDevices = videoDevices;
    });

    builder.addCase(handlePermissionChange.fulfilled, (state, action) => {
      const { audioDevices, videoDevices, camera, microphone } = action.payload;
      state.audio.availableDevices = audioDevices;
      state.video.availableDevices = videoDevices;

      state.audio.hasPermission = microphone;
      state.video.hasPermission = camera;

      if (!state.audio.selectedDevice)
        state.audio.selectedDevice = audioDevices[0];
      if (!state.video.selectedDevice)
        state.video.selectedDevice = videoDevices[0];
    });

    builder.addCase(addTrack.fulfilled, (state, { meta, payload }) => {
      const stream = payload;

      if (!stream) return;

      state.stream.getTracks().forEach((track) => {
        if (track.kind === meta.arg) {
          state.stream.removeTrack(track);
        }
      });

      stream.getTracks().forEach((track) => {
        if (track.kind === meta.arg) {
          state.stream.addTrack(track);
          state.rtc?.replaceTrack(meta.arg, track);
        }
      });
      state[meta.arg].enabled = true;
      state[meta.arg].streamEnabled = true;
    });

    builder.addCase(toggleTracks.fulfilled, (state, { meta, payload }) => {
      if (state[meta.arg].enabled) {
        // remove tracks
        const tracks = payload as MediaStreamTrack[];
        tracks.forEach((track) => {
          // track.enabled = !track.enabled;
          state[meta.arg].streamEnabled = !state[meta.arg].streamEnabled;
          if (track.enabled) {
            track.enabled = false;
            const black = createCanvas().captureStream(1);
            black.getVideoTracks()[0].enabled = false;
            if (meta.arg === "video") {
              state.rtc?.replaceTrack(meta.arg, black.getVideoTracks()[0]);
              state.stream.removeTrack(track);
              state.stream.addTrack(black.getVideoTracks()[0]);
            }
            track.stop();
          } else {
            track.enabled = true;
            const oldTrack = state.stream
              .getTracks()
              .find((track) => track.kind === meta.arg);
            if (oldTrack) state.stream.removeTrack(oldTrack);
            state.stream.addTrack(track);
            state.rtc?.replaceTrack(meta.arg, track);
          }
        });
      }
    });
  },
});

export default slice.reducer;

export const { createRTC } = slice.actions;
export const selectMedia = (state: RootState) => state.media;
