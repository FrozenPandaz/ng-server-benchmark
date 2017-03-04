import { NgModule, Renderer, RendererFactoryV2, ViewEncapsulation } from '@angular/core';
import { ServerModule, PlatformState } from '@angular/platform-server';
import { ServerTransferStateModule } from '../modules/transfer-state/server-transfer-state.module';
import { AppComponent } from './app.component';
import { AppModule } from './app.module';
import { TransferState } from '../modules/transfer-state/transfer-state';

@NgModule({
  bootstrap: [AppComponent],
  imports: [
    ServerModule,
    ServerTransferStateModule,
	  AppModule
  ]
})
export class ServerAppModule {

  constructor(private transferState: TransferState, private state: PlatformState, private rendererFactory: RendererFactoryV2) { }

  ngOnBootstrap() {
    this.injectTransferState();
  }

  /**
   * Inject the Universal Cache into the bottom of the <head>
   */
  private injectTransferState() {
    try {
      const document: any = this.state.getDocument();
      const transferStateString = JSON.stringify(this.transferState.toJson());
      const renderer = this.rendererFactory.createRenderer(document, {
        id: '-1',
        encapsulation: ViewEncapsulation.None,
        styles: [],
        data: {}
      });
      const script = renderer.createElement('script');
      renderer.setValue(script, `window['TRANSFER_STATE'] = ${transferStateString}`);
      const head = document.children[0].children[0];
      if (head.name !== 'head') {
        throw new Error('Please have <head> as the first element in your document');
      }
      renderer.appendChild(head, script);
    } catch (e) {
      console.error(e);
    }
  }
}
