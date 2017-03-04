//hacky express wrapper thingy.
import * as fs from 'fs';
import { Request, Response, Send } from 'express';
import { Provider, NgModuleFactory, NgZone, NgModuleRef, PlatformRef, ApplicationRef, Type } from '@angular/core';
import { renderModule, renderModuleFactory, platformServer, platformDynamicServer, PlatformState, INITIAL_CONFIG } from '@angular/platform-server';
import { TransferState } from '../transfer-state/transfer-state';

const templateCache: { [key: string]: string } = {};

export interface NgSetupOptions {
  aot?: boolean;
  bootstrap: Type<{}>[] | NgModuleFactory<{}>[];
  providers?: any[];
}

export interface PlatformOptions {
  document: string,
  req: Request,
  res: Response,
  aot: boolean,
  providers: Provider[]
};

export function ngExpressEngine(setupOptions: NgSetupOptions) {

  setupOptions.providers = setupOptions.providers || [];

  return function (filePath, options: { req: Request, res: Response }, callback: Send) {
    try {
      const moduleFactory = setupOptions.bootstrap[0];

      if (!moduleFactory) {
        throw new Error('You must pass in a NgModule or NgModuleFactory to be bootstrapped');
      }

      const document = getDocument(filePath);
      const extraProviders = setupOptions.providers.concat([
        {
          provide: INITIAL_CONFIG,
          useValue: {
            document: document,
            url: options.req.url
          }
        },
        {
          provide: 'REQUEST',
          useValue: options.req
        },
        {
          provide: 'RESPONSE',
          useValue: options.res
        }
      ]);

      const moduleRefPromise = setupOptions.aot ?
        platformServer(extraProviders).bootstrapModuleFactory(<NgModuleFactory<{}>>moduleFactory) :
        platformDynamicServer(extraProviders).bootstrapModule(<Type<{}>>moduleFactory);

      moduleRefPromise.then((moduleRef: NgModuleRef<{}>) => {
        handleModuleRef(moduleRef, callback);
      });

    } catch (e) {
      callback(e);
    }
	}
}

/**
 * Get the document at the file path
 */
function getDocument(filePath: string): string {
  return templateCache[filePath] = templateCache[filePath] || fs.readFileSync(filePath).toString();
}

/**
 * Handle the request with a given NgModuleRef
 */
function handleModuleRef(moduleRef: NgModuleRef<{}>, callback: Send) {
  const state = moduleRef.injector.get(PlatformState);
  const appRef = moduleRef.injector.get(ApplicationRef);

  appRef.isStable
    .filter((isStable: boolean) => isStable)
    .first()
    .subscribe((stable) => {
      moduleRef.instance['ngOnBootstrap']();

      callback(null, state.renderToString());
      moduleRef.destroy();
    });
}
