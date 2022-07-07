/*This file was automatically generated */
// tslint:disable
// @ts-nocheck
/* eslint-disable */

import { SubDoctorEvilViewModel } from '../subDoctorEvilViewModel';
import { SubDoctorEvil } from '../../../../src/model/evil/subDoctorEvil';

export class SubDoctorEvilViewModelMapper {
      public static toSubDoctorEvilViewModel(model: SubDoctorEvil): SubDoctorEvilViewModel {
      let result = new SubDoctorEvilViewModel();
            result.height = model.height ? +model.height : model.height;
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
      public static fromSubDoctorEvilViewModel(viewModel: SubDoctorEvilViewModel): SubDoctorEvil {
            let result = new SubDoctorEvil();
            result.height = viewModel.height;
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
