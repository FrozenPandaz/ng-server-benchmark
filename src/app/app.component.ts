import { Component, OnInit } from '@angular/core'
import { TransferState } from '../modules/transfer-state/transfer-state';

@Component({
	selector: 'demo-app',
  template: `
    <table>
      <tr *ngFor="let node of nodes">
        <td>{{node}}</td>
      </tr>
    </table>
	`,
  styles: [
    `h1 {
      color: green;
    }`
  ]
})
export class AppComponent implements OnInit {
  nodes = [];
  constructor() {}
  ngOnInit() {
    for (let i = 0; i < 1000; i++) {
      this.nodes.push('Hello ' + i);
    }
  }
}
