# Grunt plugin for code generation view models by models description

[![Build Status](https://travis-ci.org/AbatapCompany/grunt-generate-view-model.svg?branch=master)](https://travis-ci.org/AbatapCompany/grunt-generate-view-model)

This repository provides a grunt plugin for code generation view models by models description.

# Installation 

  npm install grunt-generate-view-model
  
# Begin to use
After install plugin you need to make first steps:
* create gencofig.json in root folder
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
    
    @IgnoreViewModel()
    public property7: number[]

}
```
* In package.json make script like:
```json
  "scripts": {
    "generation": "generateView"
  }
  ```
  where "generateView" is string which launch plugin
  
* npm run generation

* go to path ,whic define in GenerateView decorator and see something like this:

view model
```typescript
import { InnerClassView } from './innerClassView';
import { InnerClass } from '../../models/innerClass';

  export class ClassView {

  public property1: number;

  public property2: Object;

  public property3: string [];

  public property4: InnerClassView;

  public property5: InnerClassView;

  public property6: InnerClass [];
}
```
 mapper
```typescript
  import { ClassView } from '../viewmodels/classView';
import { Class } from '../../models/class';
import { fromModelToView,fromViewtoModel } from '../../function/transformFunction';
import { InnerClassViewMapper } from './InnerClassViewMapper';

export class ClassViewMapper {
      public static async toClassView(model: Class): Promise<ClassView> {
            let result = new ClassView();
            result.property1 = model.property1;
            if (model.property2) {
                  result.property2 = JSON.parse(JSON.stringify(model.property2));
            }
            if (model.property3) {
                  result.property3 =  model.property3.map(function(item: any ) { return JSON.parse(JSON.stringify(item)); });
            }
            result.property4  = await fromModelToView(model);
            if (model.property5) {
                  result.property5 =  await InnerClassViewMapper.toInnerClassView(model.property5);
            }
            if (model.property6) {
                  result.property6 =  model.property6.map(function(item: any ) { return JSON.parse(JSON.stringify(item)); });
            }
            return result;
      }
      public static async fromClassView(viewModel: ClassView): Promise<Class> {
            let result = new Class();
            result.property1 = viewModel.property1;
            if (viewModel.property2) {
                  result.property2 = JSON.parse(JSON.stringify(viewModel.property2));
            }
            if (viewModel.property3) {
                  result.property3 =  viewModel.property3.map(function(item: any ) { return JSON.parse(JSON.stringify( item )); });
            }
            result.property4  =  fromViewtoModel(viewModel);
            if (viewModel.property5) {
                  result.property5 =  await InnerClassViewMapper.fromInnerClassView(viewModel.property5);
            }
            if (viewModel.property6) {
                  result.property6 =  viewModel.property6.map(function(item: any ) { return JSON.parse(JSON.stringify( item )); });
            }
            return result;
      }
}

```


# Attributes

There are 4 decorators used in this plugin: 1 for classes and 3 for properties

## Attributes for classes
### GenerateView
Main decorator for creating view model
```shell
+-------------+--------------+-------------------------------------------------------+
|                        @GenerateView                                               |
+------------------------------------------------------------------------------------+
|   property  |  isOptional  |                      definition                       |
+-------------+--------------+-------------------------------------------------------+
| model       | false        | name of view model                                    |
| filePath    | false        | path to view model relative to the root of the folder |
| mapperpath  | true         | path to mapper                                        |
+-------------+--------------+-------------------------------------------------------+
```
You can create several views from one base model
```typescript
@GenerateView({
    'model':'ClassView',
    'filePath':'./generated/viewmodels',
    'mapperPath':'./generated/mappers'})
```

## Attributes for properties
### ViewModelName
Decorator which used to rename property in view model
```shell
+------------------------------------------------------------------------------------+
|                        @ViewModelName                                              |
+------------------------------------------------------------------------------------+
|   property             |  isOptional  |                      definition            |
+------------------------+--------------+--------------------------------------------+
| 1st param(name)        | false        | name of field in view model                |
| 2nd param(using models)| true         | view model using this name of field        |
+------------------------+--------------+--------------------------------------------+
```
* If 2nd param is null - property will be rename in all view models
```typescript
@ViewModelName("information")

@ViewModelName("information", "HeroViewModel")
public data: string;
```
### IgnoreViewModel
Decorator which used to delete property from view model
```shell
+--------------------------------------------------------------------------------------+
|                              @IgnoreViewModel                                        |
+--------------------------------------------------------------------------------------+
|   property                   |  isOptional  |               definition               |
+-------------+----------------+--------------+----------------------------------------+
| 1st param(name of view model)|     true     |       is field ignored in view model   |
+------------------------------+--------------+----------------------------------------+
```
* If parametr is not define - this property ignored in all view models.
* If you need to ignore several models,but not all - it need to write several same decorators with different name parameter
```typescript
@IgnoreViewModel()

@IgnoreViewModel("HeroViewModel")
```
### ViewModelTypes
Decorator  which used to change type of property in view model
```shell
+-------------------------------------------------------------------------------------------+
|                        @GenerateView                                                      |
+-------------------------------------------------------------------------------------------+
|   property  |  isOptional  |                      definition                              | 
+-------------+--------------+--------------------------------------------------------------+
| type        | false        | property type in view model                                  |
| transformer | true         | function used to transform to view model and back im mappers | - complex object
| modelName   | true         | name of view model which will be have property               |
+-------------+--------------+--------------------------------------------------------------+

+-------------------------------------------------------------------------------------------+
|                        transforner Type                                                   |
+-------------------------------------------------------------------------------------------+
|   property  |  isOptional  |                      definition                              | 
+-------------+--------------+--------------------------------------------------------------+
| toView      | false        | transform object which used to transform base model to view  | - complex object
| fromView    | false        | transform object which used to transform view model to base  | - complex object
+-------------+--------------+--------------------------------------------------------------+


+-------------------------------------------------------------------------------------------+
|                        toView/fromView objects                                            |
+-------------------------------------------------------------------------------------------+
|   property  |  isOptional  |                      definition                              | 
+-------------+--------------+--------------------------------------------------------------+
| function    | false        | function which transformate model                            | 
| isAsync     | true         | is function async                                            | 
+-------------+--------------+--------------------------------------------------------------+
```
* if there is no "transformer" property, use 2 pathes of transform:
  * if type is complex ,but not generated or generated without mapper - deep copying
  * if type is complex and codegen and has mapper - use mapper
* if there is no "modelName" property type using for all view models for this base model
```typescript
    @ViewModelType({
    "modelName": "HeroViewModel",
    "transformer": { "toView" : { "function": toViewModelFunction , "isAsync": true},
                    "fromView": { "function": FromViewModelFunction }},
    "type": HeroDetail})
```
