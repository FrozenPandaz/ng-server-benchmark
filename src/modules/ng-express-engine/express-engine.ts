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

/**
 * This is an express engine for handling Angular Applications
 */
export function ngExpressEngine(setupOptions: NgSetupOptions) {

  setupOptions.providers = setupOptions.providers || [];

  return function (filePath, options: { req: Request, res: Response }, callback: Send) {
    try {
      const moduleFactory = setupOptions.bootstrap[0];

      if (!moduleFactory) {
        throw new Error('You must pass in a NgModule or NgModuleFactory to be bootstrapped');
      }

      setupOptions.providers.push();

      const extraProviders = setupOptions.providers.concat(
        getReqResProviders(options.req, options.res),
        [
          {
            provide: INITIAL_CONFIG,
            useValue: {
              document: getDocument(filePath),
              url: options.req.url
            }
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

function getReqResProviders(req: Request, res: Response) {
  return [
    {
      provide: 'REQUEST',
      useValue: req
    },
    {
      provide: 'RESPONSE',
      useValue: res
    }
  ];
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
      const bootstrap = moduleRef.instance['ngOnBootstrap'];
      bootstrap && bootstrap();

      callback(null, state.renderToString());
      moduleRef.destroy();
    });
}
