//hacky express wrapper thingy.

const fs = require('fs');
import { Request } from 'express';
import { NgModuleFactory, NgZone, NgModuleRef, ApplicationRef, Type } from '@angular/core';
import { ɵgetDOM } from '@angular/platform-browser';
import { renderModuleFactory, platformServer, platformDynamicServer, PlatformState, INITIAL_CONFIG } from '@angular/platform-server';
import { UniversalCache } from '../universal-cache/universal-cache';

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

      throw new Error('Not supported yet');

    // handleRequestNotAot(options.req, document, <Type<{}>> moduleFactory, callback);
    } catch (e) {
      callback(e);
    }
	}
}

function handleRequestNotAot(req: Request, document: string, moduleType: Type<{}>, callback: (err, html) => any) {
  const platform = platformDynamicServer([{
    provide: INITIAL_CONFIG,
    useValue: {
      document: document,
      url: req.url
    }
  }])
  platform.bootstrapModule(moduleType)
    .then(moduleRef => {
      const state = moduleRef.injector.get(PlatformState);
      const appRef = moduleRef.injector.get(ApplicationRef);

      appRef.isStable
        .filter((isStable: boolean) => isStable)
        .first()
        .subscribe((stable) => {
          injectCache(moduleRef);

          callback(null, state.renderToString());
          platform.destroy();
        })
    })
}

function handleRequestFancy(req: Request, document: string, moduleFactory: NgModuleFactory<{}>, callback: (err, html) => any) {
  const platform = platformServer([
    {
      provide: INITIAL_CONFIG, useValue: {
        document: document,
        url: req.url
      }
    }
  ]);

  platform.bootstrapModuleFactory(moduleFactory)
    .then(moduleRef => {
      const state = moduleRef.injector.get(PlatformState);
      const appRef = moduleRef.injector.get(ApplicationRef);

      appRef.isStable
        .filter((isStable: boolean) => isStable)
        .first()
        .subscribe(
          (stable) => {
            injectCache(moduleRef);

            callback(null, state.renderToString());
            platform.destroy();
          }
      )
    })
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

function handleRequest(req: Request, document: string, moduleFactory: NgModuleFactory<{}>, callback: (err, html) => any) {
  renderModuleFactory(moduleFactory, {
    document: document,
    url: req.url
  })
  .then(string => {
    callback(null, string);
  });
}
