import { NgModule } from '@angular/core';
import { ServerModule, PlatformState } from '@angular/platform-server';
import { ServerTransferStateModule } from '../modules/transfer-state/server-transfer-state.module';
import { AppComponent } from './app.component';
import { AppModule } from './app.module';
import { TransferState } from '../modules/transfer-state/transfer-state';
import { ɵgetDOM } from '@angular/platform-browser';

@NgModule({
  bootstrap: [AppComponent],
  imports: [
    ServerModule,
    ServerTransferStateModule,
	  AppModule
  ]
})
export class ServerAppModule {

  constructor(private transferState: TransferState, private state: PlatformState) { }

  ngOnBootstrap() {
    console.log('stable');
    this.injectCache();
  }

  /**
   * Inject the Universal Cache into the bottom of the <head>
   */
  injectCache() {
    try {
      const document: any = this.state.getDocument();
      const dom = ɵgetDOM();
      const script: HTMLScriptElement = <HTMLScriptElement>dom.createElement('script');
      const transferStateString = JSON.stringify(this.transferState.toJson());
      dom.setText(script, `window['TRANSFER_STATE'] = ${transferStateString}`);
      const body = dom.querySelector(document, 'body');
      dom.appendChild(body, script);
    } catch (e) {
      console.error(e);
    }
  }
}
