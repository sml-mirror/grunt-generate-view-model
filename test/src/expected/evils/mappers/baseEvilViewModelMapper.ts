/*This file was automatically generated */
// tslint:disable
// @ts-nocheck
/* eslint-disable */

import { BaseEvilViewModel } from '../baseEvilViewModel';
import { BaseEvil } from '../../../../src/model/evil/baseEvil';

export class BaseEvilViewModelMapper {
      public static toBaseEvilViewModel(model: BaseEvil): BaseEvilViewModel {
      let result = new BaseEvilViewModel();
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
      public static fromBaseEvilViewModel(viewModel: BaseEvilViewModel): BaseEvil {
            let result = new BaseEvil();
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
