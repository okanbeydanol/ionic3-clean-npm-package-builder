
import { NgModule, ModuleWithProviders, InjectionToken } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from 'ionic-angular';
import { Config } from 'ionic-angular';

import { HttpClientModule } from '@angular/common/http';

import { CleanLibComponent } from './clean-lib.component';
import { CleanLibService } from './clean-lib.service';
import { Test1Component } from './test1/test1.component';
import { Test2Component } from './test2/test2.component';

import { CoreModalLateralTransition } from './../classess/modal-lateral-transition';
import { CorePageTransition } from './../classess/page-transition';
import { CoreAppProvider } from '../providers/app';
import { CoreLoggerProvider } from '../providers/logger';
import { CoreDomUtilsProvider } from './../providers/utils/dom';
import { CoreMimetypeUtilsProvider } from './../providers/utils/mimetype';
import { CoreEventsProvider } from '../providers/events';
import { CoreTextUtilsProvider } from '../providers/utils/text';
import { CoreTimeUtilsProvider } from './../providers/utils/time';
import { CoreUtilsProvider } from './../providers/utils/utils';


export interface LibConfig {
  apiUrl: string;
}
export const LibConfigService = new InjectionToken<LibConfig>('LibConfig');


@NgModule({
  declarations: [
    CleanLibComponent,
    Test1Component,
    Test2Component
  ],
  imports: [
    CommonModule,
    IonicModule.forRoot({
      pageTransition: 'core-page-transition'
    }),
    HttpClientModule,
  ],
  exports: [
    CleanLibComponent,
    Test1Component,
    Test2Component
  ],
  entryComponents: [
    CleanLibComponent,
    Test1Component,
    Test2Component
  ],
  providers: [
    CleanLibService,
    CoreTextUtilsProvider,
    CoreDomUtilsProvider,
    CoreAppProvider,
    CoreEventsProvider,
    CoreLoggerProvider,
    CoreMimetypeUtilsProvider,
    CoreTimeUtilsProvider,
    CoreUtilsProvider
  ],
})
export class CleanLibModule {
  constructor(private configPage: Config) {
    // Set transition animation.
    this.configPage.setTransition('core-page-transition', CorePageTransition);
    this.configPage.setTransition('core-modal-lateral-transition', CoreModalLateralTransition);
  }
  static forRoot(config: LibConfig): ModuleWithProviders {
    return {
      ngModule: CleanLibModule,
      providers: [
        CleanLibService,
        {
          provide: LibConfigService,
          useValue: config,
        },
      ],
    };
  }
}
