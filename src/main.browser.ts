import 'zone.js/dist/zone';
import 'reflect-metadata';
import 'rxjs/Rx';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { BrowserAppModule } from './app/browser-app.module';

platformBrowserDynamic().bootstrapModule(BrowserAppModule);
