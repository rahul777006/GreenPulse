import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CropPage } from './crop.page';

const routes: Routes = [
  {
    path: '',
    component: CropPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CropPageRoutingModule {}
