/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import 'babel-polyfill';
import { renderHook, act } from '@testing-library/react-hooks';
import { useBatteryStatus } from './';

// TODO: addEventListener change trigger mocking

describe('useBatteryStatus', () => {
  const unsupportMessage = require('./').unsupportMessage; 
  test(`should return ${unsupportMessage}`, () => {
    const { result } = renderHook(() => useBatteryStatus());
  
    expect(result.current.batteryStatus.unsupportMessage).toBe(unsupportMessage);
  });
  
  test('should update the batteryStatus state', () => {
    const { result } = renderHook(() => useBatteryStatus());
  
    act(() => result.current.updateBatteryStatus({
      chargingTime: 20,
      dischargingTime: 40,
      charging: true,
      level: 50
    }));
  
    expect(result.current.batteryStatus).toEqual({
      chargingTime: '20 Seconds',
      dichargeTime: '40 Seconds',
      level: 50,
      chargingState: 'Charging'
    });
  });
  
  test('should return mockGetBattery status', async () => {
    const originalError = console.error;
    console.error = jest.fn();
  
    const mockGetBattery = jest.fn().mockImplementation(() => Promise.resolve({
      chargingTime: 20,
      dischargingTime: 40,
      level: 50,
      charging: true,
      addEventListener: jest.fn()
    }));
    global.navigator.getBattery = mockGetBattery;
  
    try {
      const { result, waitForNextUpdate } = renderHook(() => useBatteryStatus());
      await waitForNextUpdate();
      
      expect(result.current.batteryStatus).toEqual({
        chargingTime: '20 Seconds',
        dichargeTime: '40 Seconds',
        level: 50,
        chargingState: 'Charging'
      });
    } finally {
      console.error = originalError;
    }
  });

  // ray test touch <
  test('should update the batteryStatus state when battery level change event', async () => {
    const originalError = console.error;
    console.error = jest.fn();

    const map = {};
    const battery = {
      chargingTime: 20,
      dischargingTime: 40,
      level: 50,
      charging: true,
      addEventListener: jest.fn().mockImplementation((event, callback) => {
        map[event] = callback;
      })
    };

    const mockGetBattery = jest.fn().mockImplementation(() => Promise.resolve(battery));
    global.navigator.getBattery = mockGetBattery;

    try {
      const { result, waitForNextUpdate } = renderHook(() => useBatteryStatus());
      await waitForNextUpdate();

      const updatedBattery = {
        chargingTime: 30,
        dischargingTime: 50,
        level: 60,
        charging: false
      };

      act(() => {
        // FYI: with the following two lines, test gets successful, I thought map.levelchange(updatedBattery) would behave in the same way as the following code snippets
        // but behavior appears to be different from the following
        
        // const listenerCallback = result.current.updateBatteryStatus.bind(null, updatedBattery);
        // listenerCallback(updatedBattery);

        map.levelchange(updatedBattery);
      });

      expect(result.current.batteryStatus).toEqual({
        chargingTime: '30 Seconds',
        dichargeTime: '50 Seconds',
        level: 60,
        chargingState: 'Discharging'
      });
    } finally {
      console.error = originalError;
    }
  });
  // ray test touch >
});
