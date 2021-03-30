/*This file was automatically generated */
// tslint:disable
/* eslint-disable */

import { HeroViewModel } from '../heroViewModel';
import { Hero } from '../../../../src/model/hero/hero';
import { HeroDetailViewModelMapper } from './heroDetailViewModelMapper';
import { ComplexInterface } from '../../../../../transformer/complexContextParam';
import { asyncTransformer, notAsyncTransformer, asyncTransformer3 } from '../../../../../transformer/asyncTransformer';

export class HeroViewModelMapper {
      public static async toHeroViewModel(model: Hero, context?: ComplexInterface): Promise<HeroViewModel> {
            let result = new HeroViewModel();
            result.id = model.id.toString();
      result.name = model.name;
      result.information = model.data;
           result.detail = await asyncTransformer(model, context);
            if (model.detailVM) {
                  result.detailVM = await HeroDetailViewModelMapper.toHeroDetailViewModel(model.detailVM);
            }
      if (model.details) {
            let tmp = await model.details.map(async function(item: any ) {return await HeroDetailViewModelMapper.toHeroDetailViewModel(item); });
            tmp.forEach(async mp => {
                  let p = await mp;
                  result.details.push(p); });
      }
      if (model.detailsVM) {
            let tmp = await model.detailsVM.map(async function(item: any ) {return await HeroDetailViewModelMapper.toHeroDetailViewModel(item); });
            tmp.forEach(async mp => {
                  let p = await mp;
                  result.detailsVM.push(p); });
      }
           result.simpleArray = await asyncTransformer3(model, context);
      result.state = model.state;
            return result;
      }
      public static fromHeroViewModel(viewModel: HeroViewModel, context?: string): Hero {
            let result = new Hero();
            result.id = viewModel.id ? +viewModel.id : viewModel.id as any;
            result.name = viewModel.name;
            result.data = viewModel.information;
            result.detail =  notAsyncTransformer(viewModel, context);
            if (viewModel.detailVM) {
                  result.detailVM =  HeroDetailViewModelMapper.fromHeroDetailViewModel(viewModel.detailVM);
            }
            if (viewModel.details) {
                  let tmp =  viewModel.details.map( function(item: any ) {return  HeroDetailViewModelMapper.fromHeroDetailViewModel(item); });
                  tmp.forEach( mp => {
                       let p =  mp;
                       result.details.push(p); });
            }
            if (viewModel.detailsVM) {
                  let tmp =  viewModel.detailsVM.map( function(item: any ) {return  HeroDetailViewModelMapper.fromHeroDetailViewModel(item); });
                  tmp.forEach( mp => {
                       let p =  mp;
                       result.detailsVM.push(p); });
            }
            if (viewModel.simpleArray) {
                  result.simpleArray = viewModel.simpleArray.map(function(item: any ) { return JSON.parse(JSON.stringify( item )); });
            }
            result.state = viewModel.state;
            return result;
      }
}
