import { Capabilities, Options, Services } from '@wdio/types';

// Workaround for ts-node converting dynamic imports to requires
// see https://github.com/TypeStrong/ts-node/discussions/1290
const dynamicImport = new Function('specifier', 'return import(specifier)');

export class CJSElectronLauncher {
  private instance?: Promise<Services.ServiceInstance>;

  constructor(options: unknown, caps: unknown, config: Options.Testrunner) {
    this.instance = (async () => {
      const importPath = '../service.js';
      const { default: ElectronService } = await dynamicImport(importPath);
      return new ElectronService(options, caps, config);
    })();
  }

  async onPrepare(config: Options.Testrunner, capabilities: Capabilities.RemoteCapabilities) {
    const instance = await this.instance;
    return instance?.onPrepare?.(config, capabilities);
  }
}

export class CJSElectronService {
  private instance?: Promise<Services.ServiceInstance>;

  constructor(globalOptions: unknown) {
    this.instance = (async () => {
      const importPath = '../service.js';
      const { default: ElectronService } = await dynamicImport(importPath);
      return new ElectronService(globalOptions);
    })();
  }

  async beforeSession(
    config: Options.Testrunner,
    capabilities: WebdriverIO.Capabilities,
    specs: string[],
    cid: string,
  ) {
    const instance = await this.instance;
    return instance?.beforeSession?.(config, capabilities, specs, cid);
  }

  async before(capabilities: WebdriverIO.Capabilities, specs: string[], browser: WebdriverIO.Browser) {
    const instance = await this.instance;
    return instance?.before?.(capabilities, specs, browser);
  }
}
