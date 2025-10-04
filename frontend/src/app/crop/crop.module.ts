import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CropPageRoutingModule } from './crop-routing.module';

import { CropPage } from './crop.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CropPageRoutingModule
  ],
  declarations: [CropPage]
})
export class CropPageModule {}
