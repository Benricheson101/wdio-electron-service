import { fn as vitestFn, type Mock } from '@vitest/spy';
import type { AbstractFn, ElectronApiFn, ElectronInterface, ElectronMock, ElectronType } from './types.js';

async function restoreElectronFunctionality(apiName: string, funcName: string) {
  await browser.electron.execute(
    async (electron, apiName, funcName) => {
      const electronApi = electron[apiName as keyof typeof electron];
      const originalApi = globalThis.originalApi as Record<ElectronInterface, ElectronType[ElectronInterface]>;
      const originalApiMethod = originalApi[apiName as keyof typeof originalApi][
        funcName as keyof ElectronType[ElectronInterface]
      ] as ElectronApiFn;

      (electronApi[funcName as keyof typeof electronApi] as Mock).mockImplementation(originalApiMethod);
    },
    apiName,
    funcName,
  );
}

export async function createMock(apiName: string, funcName: string) {
  const outerMock = vitestFn();
  const mock = outerMock as unknown as ElectronMock;
  const outerMockImplementation = outerMock.mockImplementation;
  const outerMockImplementationOnce = outerMock.mockImplementationOnce;
  const outerMockClear = outerMock.mockClear;
  const outerMockReset = outerMock.mockReset;

  mock.updating = false;
  mock.mockName(`electron.${apiName}.${funcName}`);

  // initialise inner (Electron) mock
  await browser.electron.execute(
    (electron, apiName, funcName) => {
      const electronApi = electron[apiName as keyof typeof electron];
      const mockFn = globalThis.fn();

      // replace target API with mock
      electronApi[funcName as keyof typeof electronApi] = mockFn as ElectronApiFn;
    },
    apiName,
    funcName,
  );

  mock.update = async () => {
    // synchronises inner and outer mocks
    mock.updating = true;
    const calls = await browser.electron.execute(
      (electron, apiName, funcName) => {
        const mockObj = electron[apiName as keyof typeof electron][
          funcName as keyof ElectronType[ElectronInterface]
        ] as ElectronMock;
        return mockObj.mock?.calls || [];
      },
      apiName,
      funcName,
    );

    // re-apply calls from the electron main process mock to the outer one
    if (mock.mock.calls.length < calls.length) {
      calls.forEach((call: unknown[], index: number) => {
        if (!mock.mock.calls[index]) {
          mock?.apply(mock, call);
        }
      });
    }
    mock.updating = false;

    return mock;
  };

  mock.mockImplementation = async (fn: AbstractFn) => {
    await browser.electron.execute(
      (electron, apiName, funcName, mockImplementationStr) => {
        const electronApi = electron[apiName as keyof typeof electron];
        (electronApi[funcName as keyof typeof electronApi] as Mock).mockImplementation(eval(mockImplementationStr));
      },
      apiName,
      funcName,
      fn.toString(),
    );
    outerMockImplementation(fn);

    return mock;
  };

  mock.mockImplementationOnce = async (fn: AbstractFn) => {
    await browser.electron.execute(
      (electron, apiName, funcName, mockImplementationStr) => {
        const electronApi = electron[apiName as keyof typeof electron];
        (electronApi[funcName as keyof typeof electronApi] as Mock).mockImplementationOnce(eval(mockImplementationStr));
      },
      apiName,
      funcName,
      fn.toString(),
    );
    outerMockImplementationOnce(fn);

    return mock;
  };

  mock.mockReturnValue = async (obj: unknown) => {
    await browser.electron.execute(
      (electron, apiName, funcName, returnValue) => {
        const electronApi = electron[apiName as keyof typeof electron];
        (electronApi[funcName as keyof typeof electronApi] as Mock).mockReturnValue(returnValue);
      },
      apiName,
      funcName,
      obj,
    );

    return mock;
  };

  mock.mockReturnValueOnce = async (obj: unknown) => {
    await browser.electron.execute(
      (electron, apiName, funcName, returnValue) => {
        const electronApi = electron[apiName as keyof typeof electron];
        (electronApi[funcName as keyof typeof electronApi] as Mock).mockReturnValueOnce(returnValue);
      },
      apiName,
      funcName,
      obj,
    );

    return mock;
  };

  mock.mockResolvedValue = async (obj: unknown) => {
    await browser.electron.execute(
      (electron, apiName, funcName, resolvedValue) => {
        const electronApi = electron[apiName as keyof typeof electron];
        (electronApi[funcName as keyof typeof electronApi] as Mock).mockResolvedValue(resolvedValue);
      },
      apiName,
      funcName,
      obj,
    );

    return mock;
  };

  mock.mockResolvedValueOnce = async (obj: unknown) => {
    await browser.electron.execute(
      (electron, apiName, funcName, resolvedValue) => {
        const electronApi = electron[apiName as keyof typeof electron];
        (electronApi[funcName as keyof typeof electronApi] as Mock).mockResolvedValueOnce(resolvedValue);
      },
      apiName,
      funcName,
      obj,
    );

    return mock;
  };

  mock.mockRejectedValue = async (obj: unknown) => {
    await browser.electron.execute(
      (electron, apiName, funcName, rejectedValue) => {
        const electronApi = electron[apiName as keyof typeof electron];
        (electronApi[funcName as keyof typeof electronApi] as Mock).mockRejectedValue(rejectedValue);
      },
      apiName,
      funcName,
      obj,
    );

    return mock;
  };

  mock.mockRejectedValueOnce = async (obj: unknown) => {
    await browser.electron.execute(
      (electron, apiName, funcName, rejectedValue) => {
        const electronApi = electron[apiName as keyof typeof electron];
        (electronApi[funcName as keyof typeof electronApi] as Mock).mockRejectedValueOnce(rejectedValue);
      },
      apiName,
      funcName,
      obj,
    );

    return mock;
  };

  mock.mockClear = async () => {
    // clears mock history
    await browser.electron.execute(
      (electron, apiName, funcName) => {
        (
          electron[apiName as keyof typeof electron][funcName as keyof ElectronType[ElectronInterface]] as Mock
        ).mockClear();
      },
      apiName,
      funcName,
    );
    outerMockClear();

    return mock;
  };

  mock.mockReset = async () => {
    // resets inner implementation to an empty function and clears mock history
    await browser.electron.execute(
      (electron, apiName, funcName) => {
        (
          electron[apiName as keyof typeof electron][funcName as keyof ElectronType[ElectronInterface]] as Mock
        ).mockReset();
      },
      apiName,
      funcName,
    );
    outerMockReset();

    // vitest mockReset doesn't clear mock history so we need to explicitly clear both mocks
    await mock.mockClear();

    return mock;
  };

  mock.mockRestore = async () => {
    // restores inner implementation to the original function and clears mock history
    await restoreElectronFunctionality(apiName, funcName);
    await mock.mockClear();

    return mock;
  };

  return mock;
}