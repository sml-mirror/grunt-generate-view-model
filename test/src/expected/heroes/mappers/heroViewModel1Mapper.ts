/*This file was automatically generated */
// tslint:disable
/* eslint-disable */

import { HeroViewModel1 } from '../heroViewModel1';
import { Hero } from '../../../../src/model/hero/hero';
import { HeroDetailViewModelMapper } from './heroDetailViewModelMapper';

export class HeroViewModel1Mapper {
      public static toHeroViewModel1(model: Hero): HeroViewModel1 {
      let result = new HeroViewModel1();
            result.name = model.name;
            result.data = model.data;
            if (model.detail) {
                  result.detail = JSON.parse(JSON.stringify(model.detail));
            }
      if (model.details) {
            let tmp =  model.details.map( function(item: any ) {return  HeroDetailViewModelMapper.toHeroDetailViewModel(item); });
            tmp.forEach( mp => {
                  let p =  mp;
                  result.details.push(p); });
      }
      if (model.detailsVM) {
            let tmp =  model.detailsVM.map( function(item: any ) {return  HeroDetailViewModelMapper.toHeroDetailViewModel(item); });
            tmp.forEach( mp => {
                  let p =  mp;
                  result.detailsVM.push(p); });
      }
            if (model.simpleArray) {
                  result.simpleArray = model.simpleArray.map(function(item: any ) { return JSON.parse(JSON.stringify(item)); });
            }
            result.state = model.state;
            return result;
      }
      public static fromHeroViewModel1(viewModel: HeroViewModel1): Hero {
            let result = new Hero();
            result.name = viewModel.name;
            result.data = viewModel.data;
            if (viewModel.detail) {
                  result.detail = JSON.parse(JSON.stringify(viewModel.detail));
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
