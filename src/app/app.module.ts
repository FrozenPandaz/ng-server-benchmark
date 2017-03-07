import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { APP_BASE_HREF, CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { HomeView } from './home/home-view.component';
import { TransferHttpModule } from '../modules/transfer-http/transfer-http.module';


@NgModule({
	imports: [
    CommonModule
	],
  providers: [
    { provide: APP_BASE_HREF, useValue: '/'}
  ],
	declarations: [ AppComponent, HomeView ],
  exports: [ AppComponent ]
})
export class AppModule {}
