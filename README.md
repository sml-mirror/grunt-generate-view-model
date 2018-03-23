# Grunt plugin for code generation view models by models description

[![Build Status](https://travis-ci.org/AbatapCompany/grunt-generate-view-model.svg?branch=master)](https://travis-ci.org/AbatapCompany/grunt-generate-view-model)

This repository provides a grunt plugin for code generation view models by models description.

## Installation 

  npm install grunt-generate-view-model

## Attributes
There are 5 decorators used in this plugin:
* @GenerateView - main decorator of plugin.It contains one parameter (Object) with 3 properties:
  * model - name of view model
  * filePath - path to view model relative to the root of the folder
  * mapperPath - path yo mapper(if it need) // optional
You can create several views from one base model
It is decorator for class
```typescript
@GenerateView({
    'model':'ClassView',
    'filePath':'./generated/viewmodels',
    'mapperPath':'./generated/mappers'})
```
* @NeedMapper - decorator which show to plugin that view model of base model need mapper.
  There is no parameters inside of this decorator.
It is decorator for class
```typescript
@NeedMapper()
```
* @IgnoreViewModel - if you don't need some property in view model or models. It has one optional parameter,which show what view model will be ignored by this property.If parametrs is not define - this property ignored in all view models. If you need to ignore several models,but not all - it need to write several same decorators with different name parameter
It is decorator for property
```typescript
@IgnoreViewModel()

@IgnoreViewModel("HeroViewModel")
```
* @ViewModelName - if you want to rename name of property in view model,you need to use this decorator.it contains 2 parameters.
First of this is name of field in view model.Second parameter is optional and contains view model name.if it is null - property will be rename in all view models
It is decorator for property
```typescript
@ViewModelName("information")

@ViewModelName("information", "HeroViewModel")
public data: string;
```
* @ViewModelType -if type of this property chanes in view models,you need to use this decorator. Has one object parameter which contains 3 properties:
  * type - type which will be use in view model
  * modelName - name of view model which will be have this modernize property//optional. If is is null - it will be works for all  view models of this class.
  * transformer - complex property ,using if you need to create mapper and transform field by special rules  //optional.
  Include 2 property:
     * toView - property which used to transform base field to view field. field "function" - show what function will be transform it.  This function is not codegeneration and need to input one parameter - base model;
     * isAsync - property which show is the function is async//optional

if there is no "transformer" property, use 2 pathes of transform:
* if type is complex ,but not generated or generated without mapper - deep copying
* if type is complex and codegen and has mapper - use mapper
```typescript
    @ViewModelType({
    "modelName": "HeroViewModel",
    "transformer": { "toView" : { "function": toViewModelFunction , "isAsync": true},
                    "fromView": { "function": FromViewModelFunction }},
    "type": HeroDetail})
```
## Begin to use
After install plugin you need to make first steps:
* create gencofig.json
```json
{
    "check":
        {
            "folders":[
                "./server/models"
            ]
        }
}
```
Array folders show what folders need to explore to find models,which need view models
* Set decorators to models
```typescripts
import { InnerClass } from "./innerClass";
import {GenerateView, NeedMapper, ViewModelType} from "grunt-generate-view-model";
import {InnerClassView } from "../generated/viewmodels/innerClassView";
import {fromModelToView, fromViewtoModel} from '../function/transformFunction';

@GenerateView({
    'model':'ClassView',
    'filePath':'./generated/viewmodels',
    'mapperPath':'./generated/mappers'})
@NeedMapper()
export class Class {
    public property1: number;

    public property2: Object;

    public property3: string[];
    @ViewModelType({'type': InnerClassView,
    'transformer':{
        "toView":{'function':fromModelToView, "isAsync":true},
        "fromView":{'function': fromViewtoModel}}})
    public property4: InnerClass;

    @ViewModelType({'type': InnerClassView})
    public property5: InnerClass;

    public property6: InnerClass[];

}
```
* In package.json make script like:
```json
  "scripts": {
    "<your name of script>": "generateView"
  }
  ```
  where "generateView" is string which launch plugin
  
  * npm run \<your name of script\>
