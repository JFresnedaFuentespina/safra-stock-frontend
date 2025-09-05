import { Component } from '@angular/core';
import { StatsComponent } from "../stats/stats.component";

@Component({
  selector: 'app-main-menu',
  imports: [StatsComponent],
  templateUrl: './main-menu.component.html',
  styleUrl: './main-menu.component.css'
})
export class MainMenuComponent {

}
