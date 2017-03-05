import { Injectable, RendererFactoryV2, ViewEncapsulation, Optional } from '@angular/core';
import { PlatformState } from '@angular/platform-server';

@Injectable()
export class TransferState {
  private _map = new Map<string, any>();

  constructor( @Optional() private state?: PlatformState, @Optional() private rendererFactory?: RendererFactoryV2) {}

  keys() {
    return this._map.keys();
  }

  get(key: string): any {
    return this._map.get(key);
  }

  set(key: string, value: any): Map<string, any> {
    return this._map.set(key, value);
  }

  toJson(): any {
    const obj = {};
    Array.from(this.keys())
      .forEach(key => {
        obj[key] = this.get(key);
      });
    return obj;
  }

  initialize(obj: any): void {
    Object.keys(obj)
      .forEach(key => {
        this.set(key, obj[key]);
      });
  }

  /**
   * Inject the State into the bottom of the <head>
   */
  inject() {
    try {
      const document: any = this.state.getDocument();
      const transferStateString = JSON.stringify(this.toJson());
      const renderer = this.rendererFactory.createRenderer(document, {
        id: '-1',
        encapsulation: ViewEncapsulation.None,
        styles: [],
        data: {}
      });

      const head = document.children[0].children[0];
      if (head.name !== 'head') {
        throw new Error('Please have <head> as the first element in your document');
      }

      const script = renderer.createElement('script');
      renderer.setValue(script, `window['TRANSFER_STATE'] = ${transferStateString}`);
      renderer.appendChild(head, script);
    } catch (e) {
      console.error(e);
    }
  }
}
