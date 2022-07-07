/*This file was automatically generated */
// tslint:disable
// @ts-nocheck
/* eslint-disable */

import { DoctorEvilViewModel } from '../doctorEvilViewModel';
import { DoctorEvil } from '../../../../src/model/evil/doctoEvil';

export class DoctorEvilViewModelMapper {
      public static toDoctorEvilViewModel(model: DoctorEvil): DoctorEvilViewModel {
      let result = new DoctorEvilViewModel();
            result.hasMiniMe = model.hasMiniMe;
            if (model.firstKilledEvil) {
                  result.firstKilledEvil = JSON.parse(JSON.stringify(model.firstKilledEvil));
            }
            result.id = model.id ? +model.id : model.id;
            result.name = model.name;
            if (model.nodeModulesModel) {
                  result.nodeModulesModel = JSON.parse(JSON.stringify(model.nodeModulesModel));
            }
            if (model.lastKilledHero) {
                  result.lastKilledHero = JSON.parse(JSON.stringify(model.lastKilledHero));
            }
            return result;
      }
      public static fromDoctorEvilViewModel(viewModel: DoctorEvilViewModel): DoctorEvil {
            let result = new DoctorEvil();
            result.hasMiniMe = viewModel.hasMiniMe;
            if (viewModel.firstKilledEvil) {
                  result.firstKilledEvil = JSON.parse(JSON.stringify(viewModel.firstKilledEvil));
            }
            result.id = viewModel.id;
            result.name = viewModel.name;
            if (viewModel.nodeModulesModel) {
                  result.nodeModulesModel = JSON.parse(JSON.stringify(viewModel.nodeModulesModel));
            }
            if (viewModel.lastKilledHero) {
                  result.lastKilledHero = JSON.parse(JSON.stringify(viewModel.lastKilledHero));
            }
            return result;
      }
}
