//hacky express wrapper thingy.

const fs = require('fs');
import { Request, Send } from 'express';
import { NgModuleFactory, NgZone, NgModuleRef, PlatformRef, ApplicationRef, Type } from '@angular/core';
import { ɵgetDOM } from '@angular/platform-browser';
import { renderModule, renderModuleFactory, platformServer, platformDynamicServer, PlatformState, INITIAL_CONFIG } from '@angular/platform-server';
import { UniversalCache } from '../universal-cache/universal-cache';

import { ServerAppModule } from '../../app/server-app.module';

const templateCache = {};

export interface NgSetupOptions {
  aot?: boolean;
  bootstrap: Type<{}>[] | NgModuleFactory<{}>[];
}

export function ngExpressEngine(setupOptions: NgSetupOptions) {

  return function (filePath, options, callback) {
    try {
      if (!templateCache[filePath]) {
        const file = fs.readFileSync(filePath);
        templateCache[filePath] = file.toString();
      }

      const document = templateCache[filePath];

      const moduleFactory = setupOptions.bootstrap[0];
      if (!moduleFactory) {
        throw new Error('You must pass in a NgModule or NgModuleFactory to be bootstrapped');
      }

      if (setupOptions.aot) {
        handleRequestFancy(options.req, document, <NgModuleFactory<{}>>moduleFactory, callback);
        return;
      }

      // throw new Error('Not supported yet');

      handleRequestNotAot(options.req, document, <Type<{}>> moduleFactory, callback);
    } catch (e) {
      callback(e);
    }
	}
}

function handleRequestNotAot(req: Request, document: string, moduleType: Type<{}>, callback: Send) {
  const platform = getPlatformServer(req, document);
  platform.bootstrapModule(ServerAppModule)
    .then(moduleRef => {
      handleModuleRef(moduleRef, callback, platform);
    });
}

function handleRequestFancy(req: Request, document: string, moduleFactory: NgModuleFactory<{}>, callback: Send) {
  const platform = getPlatformServer(req, document);
  platform.bootstrapModuleFactory(moduleFactory)
    .then(moduleRef => {
      handleModuleRef(moduleRef, callback, platform);
    });
}

function handleModuleRef(moduleRef: NgModuleRef<{}>, callback: Send, platform: PlatformRef) {
  const state = moduleRef.injector.get(PlatformState);
  const appRef = moduleRef.injector.get(ApplicationRef);

  appRef.isStable
    .filter((isStable: boolean) => isStable)
    .first()
    .subscribe((stable) => {
      injectCache(moduleRef);

      callback(null, state.renderToString());
      platform.destroy();
    });
}

function handleRequestBasic(req: Request, document: string, moduleFactory: NgModuleFactory<{}>, callback: Send) {
  renderModuleFactory(moduleFactory, {
    document: document,
    url: req.url
  })
  .then(string => {
    callback(null, string);
  });
}

function getPlatformServer(req, document) {
  return platformServer([{
    provide: INITIAL_CONFIG,
    useValue: {
      document: document,
      url: req.url
    }
  }]);
}

function injectCache(moduleRef: NgModuleRef<{}>) {
  try {
    const cache = moduleRef.injector.get(UniversalCache);
    const state = moduleRef.injector.get(PlatformState);
    const document: any = state.getDocument();
    const dom = ɵgetDOM();
    const script: HTMLScriptElement = <HTMLScriptElement> dom.createElement('script');
    const cacheString = JSON.stringify(cache.toJson());
    dom.setText(script, `window['UNIVERSAL_CACHE'] = ${cacheString}`);
    const body = dom.querySelector(document, 'body');
    dom.appendChild(body, script);
  } catch (e) {
    console.error(e);
  }
}
