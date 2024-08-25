import {
  createAsyncThunk,
  createReducer,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query";
import { MediaInfo, MediaState, RootState } from "../../types";
import logger from "../../lib/logger";
import { fetchPermissions, fetchDevices } from "../../lib/media";
import { RTC } from "../../lib/webRTC/RTC";

export const initThunk = createAsyncThunk("init", async (_, thunkApi) => {
  // will only handle init now
  const { camera, microphone } = await fetchPermissions();
  const { audioDevices, videoDevices } = await fetchDevices();

  return { audioDevices, videoDevices, camera, microphone };
});

export const handleDeviceChange = createAsyncThunk(
  "devicechange",
  async (_, thunkApi) => {
    const state = (thunkApi.getState() as RootState).media;

    const { audioDevices, videoDevices } = await fetchDevices();

    if (state.audio.availableDevices.length !== audioDevices.length) {
      const prevDevice = audioDevices.find(
        (device) => device.deviceId === state.audio.selectedDevice?.deviceId
      );

      if (!prevDevice) {
        await thunkApi.dispatch(removeTrack("audio"));
      }
    } else {
      const prevDevice = videoDevices.find(
        (device) => device.deviceId === state.video.selectedDevice?.deviceId
      );

      if (!prevDevice) {
        await thunkApi.dispatch(removeTrack("video"));
      }
    }

    return { audioDevices, videoDevices };
  }
);

export const handlePermissionChange = createAsyncThunk(
  "permissionchange",
  async (type: "audio" | "video", thunkApi) => {
    const { camera, microphone } = await fetchPermissions();

    // remove tracks if permission denied or prompt
    if (!camera) {
      await thunkApi.dispatch(removeTrack("video"));
    }
    if (!microphone) {
      await thunkApi.dispatch(removeTrack("audio"));
    }

    const { audioDevices, videoDevices } = await fetchDevices();
    return { audioDevices, videoDevices, camera, microphone };
  }
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
  }
);

export const removeTrack = createAsyncThunk(
  "removetrack",
  (type: "audio" | "video", thunkApi) => {
    const state = (thunkApi.getState() as RootState).media;

    if (state[type].enabled) {
      // remove tracks
      const tracks = state.stream.getTracks();
      return tracks.filter((track) => {
        return track.kind === type;
      });
    }
    return [];
  }
);

const initialState = {
  availableDevices: [],
  selectedDevice: null,
  enabled: false,
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

      stream.getTracks().forEach((track) => {
        if (track.kind === meta.arg) {
          state.stream.addTrack(track);
          state.rtc?.addTrack(track);
        }
      });
      state[meta.arg].enabled = true;
    });

    builder.addCase(removeTrack.fulfilled, (state, { meta, payload }) => {
      if (state[meta.arg].enabled) {
        // remove tracks
        const tracks = payload as MediaStreamTrack[];
        console.log(tracks);
        tracks.forEach((track) => {
          track.stop();
          state.stream.removeTrack(track);
          state.rtc?.removeTrack(track);
        });
        console.log(state.stream.getTracks());
      }

      // enabled tells if the track is in stream
      state[meta.arg].enabled = false;
    });
  },
});

export default slice.reducer;

export const { createRTC } = slice.actions;
export const selectMedia = (state: RootState) => state.media;
