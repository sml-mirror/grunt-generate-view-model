# Grunt plugin for code generation view models by models description

[![Build Status](https://travis-ci.org/AbatapCompany/grunt-generate-view-model.svg?branch=master)](https://travis-ci.org/AbatapCompany/grunt-generate-view-model)

This repository provides a grunt plugin for code generation view models by models description.

# Установка

  npm install grunt-generate-view-model
  
# Как начать использовать
* Создайте gencofig.json в корневом катологе
```json
{
    "check":
        {
            "folders":[
                "./models"
            ]
        }
}
``` 
Свойство "folders" показывает для каких папок(и их внутренних папок) нужны модели отображений.
* Установите декораторы на нужные модели
```typescripts
import { InnerClass } from "./innerClass";
import {GenerateView, ViewModelType} from "grunt-generate-view-model";
import {InnerClassView } from "../generated/viewmodels/innerClassView";
import {fromModelToView, fromViewtoModel} from '../function/transformFunction';

@GenerateView({
    'model':'ClassView',
    'filePath':'./generated/viewmodels',
    'mapperPath':'./generated/mappers'})
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
* В package.json добавьте инициализирующую команду в свойство "scripts":
```json
  "scripts": {
    "generation": "generateView"
  }
  ```
  где "generateView" - строка для запуска плагина
  
* npm run generation

* после завершения работы плагина по пути, указанному в декораторе GenerateView, появятся файлы с расширением ".ts" :

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

# Декораторы

В этом плагине используются 4 декоратора: 1 для классов и 3 для свойств

## Декораторы для классов
### GenerateView
Основной декоратор для создания моделей отображения
```shell
+-------------+--------------+-------------------------------------------------------+
|                        @GenerateView                                               |
+------------------------------------------------------------------------------------+
|   Property  |  Mandatory   |                      Definition                       |
+-------------+--------------+-------------------------------------------------------+
| model       | true         | name of view model                                    |
| filePath    | true         | path to view model relative to the root of the folder |
| mapperpath  | false        | path to mapper                                        |
+-------------+--------------+-------------------------------------------------------+
```
Можно создавать несколько моделей отображения от одной базовой модели.
```typescript
@GenerateView({
    'model':'ClassView',
    'filePath':'./generated/viewmodels',
    'mapperPath':'./generated/mappers'})
```

## Декораторы для свойств
### ViewModelName

Декоратор, который используется для переименования свойства у модели отображения.
```shell
+------------------------------------------------------------------------------------+
|                        @ViewModelName                                              |
+------------------------------------------------------------------------------------+
|   Property             |  Mandatory   |              Definition                    |
+------------------------+--------------+--------------------------------------------+
| 1st param(name)        | true         | name of field in view model                |
| 2nd param(using models)| false        | view model using this name of field        |
+------------------------+--------------+--------------------------------------------+
```
* Если 2 параметр - null : свойство будет переименовано во всех создаваемых от этой базовой модели моделей отображения.
```typescript
@ViewModelName("information")

@ViewModelName("information", "HeroViewModel")
public data: string;
```
### IgnoreViewModel

Декоратор, который используется для удаления свойства из модели отображения.
```shell
+--------------------------------------------------------------------------------------------------+
|                              @IgnoreViewModel                                                    |
+--------------------------------------------------------------------------------------------------+
|   Property                   |   Mandatory  |               Definition                           |
+-------------+----------------+--------------+----------------------------------------------------+
| 1st param(name of view model)|     false    |name of view model ,which ignore ths field          |
+------------------------------+--------------+----------------------------------------------------+
```
* Если параметр не определен - это свойство игнорируется во всех создаваемых моделях.
* Если необходимо игнорировать несколько моделей - необходимо написать декоратор для каждой создаваемой модели отбражения.
```typescript
@IgnoreViewModel()

@IgnoreViewModel("HeroViewModel")
```
### ViewModelType
Декоратор, который используется для смены типа свойства в модели отображения.
```shell
+-------------------------------------------------------------------------------------------+
|                        @ViewModelType                                                     |
+-------------------------------------------------------------------------------------------+
|   Property  |  Mandatory   |                      Definition                              | 
+-------------+--------------+--------------------------------------------------------------+
| type        | true         | property type in view model                                  |
| transformer | false        | function used to transform to view model and back im mappers | - complex object
| modelName   | false        | name of view model which will be have property               |
+-------------+--------------+--------------------------------------------------------------+

+-------------------------------------------------------------------------------------------+
|                        transforner Type                                                   |
+-------------------------------------------------------------------------------------------+
|   Property  |  Mandatory   |                      Definition                              | 
+-------------+--------------+--------------------------------------------------------------+
| toView      | true         | transform object which used to transform base model to view  | - complex object
| fromView    | true         | transform object which used to transform view model to base  | - complex object
+-------------+--------------+--------------------------------------------------------------+


+-------------------------------------------------------------------------------------------+
|                        toView/fromView objects                                            |
+-------------------------------------------------------------------------------------------+
|   Property  |  Mandatory   |                      Definition                              | 
+-------------+--------------+--------------------------------------------------------------+
| function    | true         | function which transformate model                            | 
| isAsync     | false        | is function async                                            | 
+-------------+--------------+--------------------------------------------------------------+
```
* Если свойство "transformer" отсутствует:
  * Если тип свойства - составной, но не сгенерирован или сгенерирован без маппера - глубокое копирование.
  * Если тип скодогенерирован с маппером - используется маппер.
* Если свойство "modelName" отсутствует, тип используется для всех моделей отображения для данной базовой модели.
```typescript
    @ViewModelType({
    "modelName": "HeroViewModel",
    "transformer": { "toView" : { "function": toViewModelFunction , "isAsync": true},
                    "fromView": { "function": FromViewModelFunction }},
    "type": HeroDetail})
```
