import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CropPage } from './crop.page';

describe('CropPage', () => {
  let component: CropPage;
  let fixture: ComponentFixture<CropPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CropPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
